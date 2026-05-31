# Architecture Overview

LuciDigital is a **sovereign, self-hosted development + identity + agent-compute
platform**. This repo is its seed: a Nix-flake-managed monorepo where each
subsystem is an isolated module, wired together by Podman + Caddi over an
IPv6-native address plan.

## Design principles

1. **Reproducible over clever** — Nix flakes pin every toolchain; behavior is
   identical in CI, dev shells, and on a workstation.
2. **Boring infrastructure** — Podman compose, Caddy, Postgres, env-files. No
   fragile bespoke orchestration.
3. **Sovereign** — no Docker Hub lock-in, no third-party SaaS in the critical
   path; airgap-first defaults (local Ollama, Quad9 DNS, self-hosted SCM).
4. **Layered, not flattened** — the frontend is one module; the platform is the
   VCS substrate + identity + compute mesh.

## Address plan (IPv6)

LuciVerse addressing lives under `2602:F674::/40`. Tiers map to subnets, e.g.:

| Tier | Subnet | Frequency |
|---|---|---|
| VCS (Veritas) | `2602:F674:0000:0700::/64` | 528 Hz |
| Lucia orchestrator | `2602:F674:0000:0201::/64` | 741 Hz |
| Core / A-Tune | `2602:F674:0000:0028::/64` | 528 Hz |

The Rust substrate encodes these in `modules/scm/luci-vcs/src/lib.rs`
(`VcsComponent::ipv6`); Caddy binds them in `modules/orchestration/caddy/Caddyfile`.

## Subsystems

- **Identity** — `did:luci` handles ("Dial by Being"), 4-digit NoZero key tags
  bound to Ed25519 keys, Iroh dialing. Spec: `modules/docs/specs/did-handles.md`;
  implementation: `modules/scm/luci-vcs/src/handle.rs`.
- **VCS substrate** — gitoxide (`gix`) wrapped with content-addressed block
  cache, jj bridge, gitweb HTTP, tokio tracing. `modules/scm/luci-vcs/`.
- **Compute** — Open Compute Protocol (IPVM/UCAN over IPFS), Homestar node.
  Spec: `modules/docs/specs/open-compute.md`.
- **SCM hosting** — Gogs with a Gitoxide backend. `modules/scm/gogs/`.
- **CDE** — Coder workspaces (Terraform template). `modules/orchestration/coder/`.
- **Ingress** — Caddy, IPv6-native, sovereign attestation headers.
- **Frontend** — TanStack Start SSR app. `modules/web/luci-frontend/`.

## Data flow (local)

```
browser ──▶ Caddy (IPv6) ──▶ {gogs, coder, gitweb, homestar, ipfs, lucia}
                                  │
                       Postgres (coder) · IPFS/Kubo (CAS) · FoundationDB (host)
```

## Frequencies (LuciVerse semantics)

`396/417` deception · `432` root · `528` heart/Veritas · `639` throat/Juniper ·
`741` authentic/Lucia · `852` third-eye/Cortana · `963` crown/JudgeLuci. These
are validated in the Open Compute schema (`FrequencyHz` enum).
