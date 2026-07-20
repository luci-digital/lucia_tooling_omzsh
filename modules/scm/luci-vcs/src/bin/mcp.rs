// luci-mcp — Model Context Protocol server for the LuciVerse VCS substrate.
// LDS 700.528 · 528 Hz · Genesis Bond: ACTIVE @ 741 Hz
//
// Exposes the Rust core (core/vcs) to MCP-capable agents (Claude, Zed via
// ACP, the MCP Inspector, etc.) over stdio. Tools are grouped by domain:
//
//   DID handles (LDS 200.741)
//     handle_parse        — parse "<given> <tag> <family>" into structure
//     handle_verify       — check a handle's tag against an Ed25519 pubkey
//     handle_tag_for_key  — derive the 4-digit NoZero tag for a pubkey
//     handle_mine_vanity  — mine a pubkey whose tag matches a target
//
//   NoZero base-9 codec (LuciVerse invariant — digits 1–9, no zero)
//     base9_encode        — encode a u32 with a fixed digit width
//     base9_decode        — decode a NoZero base-9 string to a u32
//
//   VCS substrate metadata (LDS 700.528)
//     vcs_info            — tier, frequency, IPv6 root, component addressing
//
// Transport is stdio: stdout is the JSON-RPC channel, so ALL logging goes to
// stderr. Wire it into Zed via `context_servers` (see core/vcs/README.md).

use std::fs::File;
use std::io::Read;

use luci_vcs::handle::{
    decode_base9_nozero, encode_base9_nozero, parse_handle, tag_for_key, verify_handle,
};
use luci_vcs::{VcsComponent, FREQUENCY_HZ, LDS_TIER, VCS_IPV6_ROOT};

use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::*;
use rmcp::schemars;
use rmcp::{tool, tool_handler, tool_router, ErrorData as McpError, ServerHandler, ServiceExt};
use serde_json::json;
use tracing_subscriber::EnvFilter;

// ── Tool parameter schemas ──────────────────────────────────────────────────

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct ParseHandleRequest {
    /// A handle string in the form `<given> <4-digit-nozero-tag> <family>`,
    /// e.g. `"Daryl 4142 Harr"`.
    handle: String,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct VerifyHandleRequest {
    /// The handle string to verify, e.g. `"Daryl 4142 Harr"`.
    handle: String,
    /// The Ed25519 public key as 64 hex characters (32 bytes).
    pubkey_hex: String,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct TagForKeyRequest {
    /// The Ed25519 public key as 64 hex characters (32 bytes).
    pubkey_hex: String,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct MineVanityRequest {
    /// Target 4-digit NoZero tag (digits 1–9 only), e.g. `"4142"`.
    tag: String,
    /// Optional display name `"Given Family"` to render the full handle.
    #[serde(default)]
    name: Option<String>,
    /// Maximum keypairs to try before giving up. Defaults to 5_000_000
    /// (expected match in ~6561 trials, so this is a generous ceiling).
    #[serde(default)]
    max_attempts: Option<u64>,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct Base9EncodeRequest {
    /// The non-negative integer to encode. Must satisfy `value < 9^width`.
    value: u32,
    /// Number of NoZero digits in the output (left-padded with `1`).
    width: u32,
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema)]
struct Base9DecodeRequest {
    /// A NoZero base-9 string (digits 1–9 only), e.g. `"4142"`.
    text: String,
}

// ── Server ──────────────────────────────────────────────────────────────────

#[derive(Clone)]
struct LuciMcp {
    // Read by the `#[tool_handler]` macro; dead-code analysis can't see that.
    #[allow(dead_code)]
    tool_router: ToolRouter<LuciMcp>,
}

#[tool_router]
impl LuciMcp {
    fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
        }
    }

    /// Decode 64 hex chars into a 32-byte Ed25519 public key.
    fn parse_pubkey(pubkey_hex: &str) -> Result<[u8; 32], McpError> {
        let bytes = hex::decode(pubkey_hex.trim()).map_err(|e| {
            McpError::invalid_params(format!("pubkey_hex is not valid hex: {e}"), None)
        })?;
        let arr: [u8; 32] = bytes.as_slice().try_into().map_err(|_| {
            McpError::invalid_params(
                format!("pubkey must be 32 bytes (64 hex chars), got {}", bytes.len()),
                None,
            )
        })?;
        Ok(arr)
    }

    fn ok_json(value: serde_json::Value) -> Result<CallToolResult, McpError> {
        let text = serde_json::to_string_pretty(&value)
            .map_err(|e| McpError::internal_error(e.to_string(), None))?;
        Ok(CallToolResult::success(vec![ContentBlock::text(text)]))
    }

    // ── DID handles ──────────────────────────────────────────────────────────

    #[tool(
        description = "Parse a LuciVerse DID handle ('<given> <4-digit-nozero-tag> <family>') \
                       into its components plus canonical, display, and DNS-slug forms."
    )]
    fn handle_parse(
        &self,
        Parameters(req): Parameters<ParseHandleRequest>,
    ) -> Result<CallToolResult, McpError> {
        let h = parse_handle(&req.handle)
            .map_err(|e| McpError::invalid_params(e.to_string(), None))?;
        Self::ok_json(json!({
            "given_name": h.given_name,
            "key_tag": h.key_tag,
            "family_name": h.family_name,
            "canonical": h.canonical(),
            "display": h.display(),
            "dns_slug": h.dns_slug(),
        }))
    }

    #[tool(
        description = "Verify that a LuciVerse handle's tag matches an Ed25519 public key \
                       (the tag is derived from the first two key bytes mod 6561)."
    )]
    fn handle_verify(
        &self,
        Parameters(req): Parameters<VerifyHandleRequest>,
    ) -> Result<CallToolResult, McpError> {
        let h = parse_handle(&req.handle)
            .map_err(|e| McpError::invalid_params(e.to_string(), None))?;
        let pk = Self::parse_pubkey(&req.pubkey_hex)?;
        let expected = tag_for_key(&pk);
        Self::ok_json(json!({
            "valid": verify_handle(&h, &pk),
            "handle_tag": h.key_tag,
            "expected_tag": expected,
        }))
    }

    #[tool(
        description = "Derive the canonical 4-digit NoZero key tag for an Ed25519 public key \
                       (tag = base9_nozero(u16_be(pk[0..2]) mod 6561, width=4))."
    )]
    fn handle_tag_for_key(
        &self,
        Parameters(req): Parameters<TagForKeyRequest>,
    ) -> Result<CallToolResult, McpError> {
        let pk = Self::parse_pubkey(&req.pubkey_hex)?;
        Self::ok_json(json!({ "tag": tag_for_key(&pk) }))
    }

    #[tool(
        description = "Mine a random Ed25519 public key whose LuciVerse tag matches the target \
                       (expected ~6561 trials). Returns the pubkey hex, full handle, and trial count."
    )]
    fn handle_mine_vanity(
        &self,
        Parameters(req): Parameters<MineVanityRequest>,
    ) -> Result<CallToolResult, McpError> {
        validate_tag(&req.tag)?;
        let cap = req.max_attempts.unwrap_or(5_000_000);
        let mut urandom = File::open("/dev/urandom")
            .map_err(|e| McpError::internal_error(format!("open /dev/urandom: {e}"), None))?;

        let mut attempts: u64 = 0;
        let mut found: Option<[u8; 32]> = None;
        let mut buf = [0u8; 32];
        while attempts < cap {
            urandom
                .read_exact(&mut buf)
                .map_err(|e| McpError::internal_error(format!("read entropy: {e}"), None))?;
            attempts += 1;
            if tag_for_key(&buf) == req.tag {
                found = Some(buf);
                break;
            }
        }

        match found {
            Some(pk) => {
                let pk_hex = hex::encode(pk);
                let handle = match &req.name {
                    Some(name) => {
                        let parts: Vec<&str> = name.splitn(2, ' ').collect();
                        if parts.len() == 2 {
                            format!("{} {} {}", parts[0], req.tag, parts[1])
                        } else {
                            format!("{} {} ?", name, req.tag)
                        }
                    }
                    None => format!("? {} ?", req.tag),
                };
                Self::ok_json(json!({
                    "found": true,
                    "tag": req.tag,
                    "pubkey_hex": pk_hex,
                    "handle": handle,
                    "attempts": attempts,
                }))
            }
            None => Self::ok_json(json!({
                "found": false,
                "tag": req.tag,
                "attempts": attempts,
                "max_attempts": cap,
            })),
        }
    }

    // ── NoZero base-9 codec ────────────────────────────────────────────────────

    #[tool(
        description = "Encode a non-negative integer as a fixed-width NoZero base-9 string \
                       (digits 1–9 only; left-padded with '1'). Requires value < 9^width."
    )]
    fn base9_encode(
        &self,
        Parameters(req): Parameters<Base9EncodeRequest>,
    ) -> Result<CallToolResult, McpError> {
        let width = req.width as usize;
        if width == 0 || width > 20 {
            return Err(McpError::invalid_params(
                "width must be between 1 and 20".to_string(),
                None,
            ));
        }
        // 9^width upper bound — reject values that would overflow the width.
        let max = 9u64.checked_pow(req.width).unwrap_or(u64::MAX);
        if (req.value as u64) >= max {
            return Err(McpError::invalid_params(
                format!("value {} does not fit in {} NoZero digits (max {})", req.value, width, max - 1),
                None,
            ));
        }
        Self::ok_json(json!({ "encoded": encode_base9_nozero(req.value, width) }))
    }

    #[tool(
        description = "Decode a NoZero base-9 string (digits 1–9 only) back to a u32 integer."
    )]
    fn base9_decode(
        &self,
        Parameters(req): Parameters<Base9DecodeRequest>,
    ) -> Result<CallToolResult, McpError> {
        match decode_base9_nozero(&req.text) {
            Some(value) => Self::ok_json(json!({ "value": value })),
            None => Err(McpError::invalid_params(
                "input must be a non-empty string of NoZero digits (1–9)".to_string(),
                None,
            )),
        }
    }

    // ── VCS substrate metadata ─────────────────────────────────────────────────

    #[tool(
        description = "Return LuciVerse VCS substrate metadata: LDS tier, Veritas frequency, \
                       the IPv6 root, and per-component IPv6 addressing + frequencies."
    )]
    fn vcs_info(&self) -> Result<CallToolResult, McpError> {
        let components: Vec<serde_json::Value> = [
            ("GixEngine", VcsComponent::GixEngine),
            ("BlockCache", VcsComponent::BlockCache),
            ("Coordinator", VcsComponent::Coordinator),
            ("LuciaBridge", VcsComponent::LuciaBridge),
            ("JjBridge", VcsComponent::JjBridge),
            ("GitWeb", VcsComponent::GitWeb),
        ]
        .into_iter()
        .map(|(name, c)| {
            json!({
                "name": name,
                "ipv6": c.ipv6().to_string(),
                "frequency_hz": c.frequency_hz(),
            })
        })
        .collect();

        Self::ok_json(json!({
            "lds_tier": LDS_TIER,
            "frequency_hz": FREQUENCY_HZ,
            "ipv6_root": VCS_IPV6_ROOT,
            "components": components,
        }))
    }
}

/// Validate a 4-digit NoZero tag argument (digits 1–9 only).
fn validate_tag(tag: &str) -> Result<(), McpError> {
    if tag.chars().count() != 4 || !tag.chars().all(|c| ('1'..='9').contains(&c)) {
        return Err(McpError::invalid_params(
            format!("tag must be exactly 4 NoZero digits (1–9), got {tag:?}"),
            None,
        ));
    }
    Ok(())
}

#[tool_handler]
impl ServerHandler for LuciMcp {
    fn get_info(&self) -> ServerInfo {
        let mut impl_info = Implementation::from_build_env();
        impl_info.name = "luci-mcp".to_string();
        impl_info.version = env!("CARGO_PKG_VERSION").to_string();
        ServerInfo::new(ServerCapabilities::builder().enable_tools().build())
            .with_server_info(impl_info)
            .with_protocol_version(ProtocolVersion::V_2024_11_05)
            .with_instructions(
                "LuciVerse VCS substrate (LDS 700.528 @ 528 Hz). Tools cover DID handles \
                 (handle_parse, handle_verify, handle_tag_for_key, handle_mine_vanity), \
                 the NoZero base-9 codec (base9_encode, base9_decode), and substrate \
                 metadata (vcs_info)."
                    .to_string(),
            )
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // stdout is the MCP transport — logs MUST go to stderr.
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("luci_mcp=info,warn")),
        )
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .init();

    tracing::info!(
        lds_tier = LDS_TIER,
        frequency_hz = FREQUENCY_HZ,
        "LuciVerse MCP server starting on stdio"
    );

    let service = LuciMcp::new()
        .serve(rmcp::transport::stdio())
        .await
        .inspect_err(|e| tracing::error!("serving error: {e:?}"))?;

    service.waiting().await?;
    Ok(())
}
