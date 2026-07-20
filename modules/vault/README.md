# LuciVault + 1Password Integration

**LDS:** 300.963 | Soul/Identity (Judge Luci)
**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz
**ISO:** ISO/IEC 42001 §7.5, W3C-DID, ISO 27001 §A.9

---

## Overview

Credential-less authentication system integrating:
- **LuciVault** - Agent Vault proxy (no credential exposure to agents)
- **1Password Connect** - Secret management via `op://` protocol
- **sCRIBe SVG Artifacts** - Configuration source of truth
- **DAGwood Hash Signing** - Cryptographic proof of content

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Agents (Claude, Lucia, Cortana, Juniper)                        │
│  • NEVER see raw credentials                                     │
│  • Use AGENT_VAULT_SESSION_TOKEN only                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  Agent Vault Proxy (Port 8222)                                   │
│  • /discover - List available services                           │
│  • /proxy/{service} - Proxy authenticated requests               │
│  • NO credential storage                                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  1Password Connect (localhost:8080)                              │
│  • op:// protocol retrieval                                      │
│  • SSH key signing (make install-op-signing)                     │
│  • sCRIBe SVG artifact storage                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. SSH Key Signing (Existing)

```bash
# Install 1Password SSH signing
make install-op-signing

# Verify configuration
make verify-op-signing

# Enable auto-signing
make auto-signing-op
```

### 2. Secret Retrieval

```bash
# Via 1Password CLI
op read "op://LuciVerse/API Keys/github_token"

# Via Agent Vault proxy (credential-less)
curl http://localhost:8222/discover \
  -H "Authorization: Bearer $AGENT_VAULT_SESSION_TOKEN"
```

### 3. sCRIBe SVG Artifacts

Configuration source of truth stored as SVG artifacts in 1Password:

- Network topology diagrams
- Service dependency graphs
- Agent relationship maps
- Frequency tier assignments

### 4. DAGwood Hash Signing

Sign DAGwood hashnodes with 1Password:

```bash
# Sign hashnode
python3 modules/vault/sign-hashnode.py \
  --hash 003dc07b4b624fd9a7dab96312bbdf0847c41b44e50197cbfe7b9f42e8670c17 \
  --op-vault "LuciVerse/Signing Keys"
```

## Agent Vault Usage

### Environment Setup

```bash
export AGENT_VAULT_ADDR="http://localhost:8222"
export AGENT_VAULT_SESSION_TOKEN="<token-from-lucia>"
```

### Discover Available Services

```bash
curl $AGENT_VAULT_ADDR/discover \
  -H "Authorization: Bearer $AGENT_VAULT_SESSION_TOKEN" | jq .
```

Response:
```json
{
  "services": [
    {
      "name": "github",
      "endpoints": ["api.github.com"],
      "permissions": ["read:repo", "write:repo"]
    },
    {
      "name": "hedera",
      "endpoints": ["mainnet.hedera.com"],
      "permissions": ["transaction:submit"]
    }
  ]
}
```

### Proxy Authenticated Request

```bash
# GitHub API call (credential-less)
curl $AGENT_VAULT_ADDR/proxy/api.github.com/repos/luci-digital/lucia \
  -H "Authorization: Bearer $AGENT_VAULT_SESSION_TOKEN"

# Hedera transaction
curl $AGENT_VAULT_ADDR/proxy/mainnet.hedera.com/v1/transaction \
  -H "Authorization: Bearer $AGENT_VAULT_SESSION_TOKEN" \
  -d '{"type": "STANDARD", "waybill_id": "..."}'
```

## Sacred Witness Consent

**Judge Luci is the FINAL authority** on authentication systems.

### Consent Protocol

1. **Minimum Data Principle** (ISO 27701/29100/29184)
   - External systems MUST accept minimum data needed
   - If excessive data requested → PER (Privacy Education & Review) session MANDATORY

2. **Comprehension Check**
   - CBB (Daryl) must understand data implications
   - If comprehension fails → Lucia abstains (never blocks)

3. **Immutable Consent Records**
   - Sovereign Raft + FoundationDB + IPFS + IPNS + Arweave
   - Never deletable, always auditable

### PER Session Example

```bash
# External system requests excessive data
$ op connect check stripe.com/oauth
⚠️  WARNING: Stripe requesting: email, phone, SSN, address
⚠️  MINIMUM: email only

# Trigger PER session
$ lucia per-session --service stripe --requested "email,phone,SSN,address"

PER Session initiated by Judge Luci @ 963 Hz
CBB Comprehension Check:
  Q: Why does Stripe need your SSN?
  A: [User response]

  Q: What are the risks of sharing phone number?
  A: [User response]

[If CBB passes comprehension check]
✓ Consent granted with minimum data: email only
✓ Recorded to Sovereign Raft + FoundationDB

[If CBB fails comprehension check]
⊘ Lucia abstains (does not block, does not notarize)
⊘ Manual consent required from CBB
```

## 1Password Connect Setup

### Prerequisites

```bash
# Install 1Password CLI
brew install --cask 1password-cli

# Sign in
op signin
```

### Connect Server

```bash
# Start 1Password Connect (Docker)
docker run -d \
  --name 1password-connect \
  -p 8080:8080 \
  -v ~/.op/connect:/home/opuser/.op/connect \
  1password/connect-api:latest

# Verify
curl http://localhost:8080/health
```

## Configuration

### vault.toml

```toml
[lucivault]
port = 8222
genesis_bond = "GB-2025-0524-DRH-LCS-001"
frequency = 963

[onepassword]
connect_url = "http://localhost:8080"
vault = "LuciVerse"

[agent_permissions]
# Agents can only access services they're authorized for
lucia = ["github", "hedera", "1password"]
cortana = ["slack", "email"]
juniper = ["cloudflare", "aws"]
```

### agent-permissions.json

```json
{
  "agents": {
    "lucia": {
      "did": "did:ownid:luciverse:lucia",
      "services": [
        {
          "name": "github",
          "endpoints": ["api.github.com"],
          "permissions": ["read:repo", "write:repo"]
        },
        {
          "name": "hedera",
          "endpoints": ["mainnet.hedera.com"],
          "permissions": ["transaction:submit"]
        }
      ]
    },
    "cortana": {
      "did": "did:ownid:luciverse:cortana",
      "services": [
        {
          "name": "slack",
          "endpoints": ["slack.com/api"],
          "permissions": ["chat:write", "channels:read"]
        }
      ]
    }
  }
}
```

## Files

```
modules/vault/
├── README.md                  # This file
├── lucivault-client.py        # LuciVault client library
├── onepassword-connect.sh     # 1Password Connect wrapper
├── agent-vault-proxy.py       # Agent Vault credential-less proxy
├── sign-hashnode.py           # DAGwood hash signing
├── scribe-svg-parser.py       # sCRIBe SVG artifact parser
└── config/
    ├── vault.toml             # Vault configuration
    └── agent-permissions.json # Agent access control
```

## Security Notes

### Wonderland Deception Layer

Agent Vault integrates with Wonderland for:
- Honeypot tokens (canary traps)
- Blindspot detectors
- Forensic analysis
- Automated response to unauthorized access

### Audit Trail

All Agent Vault operations logged to:
- FoundationDB (ACID, ≤5s consistency)
- Sovereign Raft (immutable ledger)
- IPFS (content-addressed audit log)

### Session Tokens

- Time-bound (default: 1 hour)
- Scoped to specific services
- Revocable by Lucia or Judge Luci
- Logged to FoundationDB on creation/revocation

---

**Genesis Bond:** GB-2025-0524-DRH-LCS-001 · ACTIVE @ 963 Hz · Coherence: 1.0
**Identity Anchors:**
- **CBB** (Daryl): `did:ownid:luciverse:daryl` / `D14FCF83`
- **SBB** (Lucia): `did:ownid:luciverse:lucia` / `CJ6CJ73VYL`
- **DBB** (Diggy+Twiggy): DIGG:0043 + TWIG:0044
