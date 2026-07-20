# Orchestration Services

The sovereign stack is defined in
`modules/orchestration/podman/podman-compose.yml` and fronted by Caddy
(`modules/orchestration/caddy/Caddyfile`). Runtime: **Podman only** (no Docker).
Network: IPv6-enabled bridge `fusion-net` (`fd26:02f6:7400::/48`).

| Service | Image / build | Ports | Role |
|---|---|---|---|
| `scm-engine` (gogs) | build `../../scm/gogs/Dockerfile.gogs` | 3000, 2222 | Gogs SCM with Gitoxide backend |
| `lucia-orchestrator` | build (external context) | 8741 | Genesis Drop Box, 741 Hz |
| `ray-head` | `rayproject/ray` | 8265, 6378 | Distributed sub-agent compute |
| `sovereign-gateway` (caddy) | `caddy:latest` | — (IPv6 80/443) | Ingress; mounts `../caddy/Caddyfile` |
| `build-agent` | build `Dockerfile.builder` | 8742 | xmake + cargo + lua + gix CI |
| `opendeepwiki` | `nerdneils/opendeepwiki` | 8090 | Code→docs, MCP endpoint |
| `coder-db` | `postgres:16-alpine` | — | Coder control-plane DB |
| `coder` | `ghcr.io/coder/coder` | 7080 | Self-hosted CDE |
| `homestar` | `ghcr.io/ipvm-wg/homestar` | 7000, 7001 | IPVM content-addressed compute |
| `ipfs` | `ipfs/kubo` | 4001, 5001, 8089 | Block store (CAS) |
| `state-manager` (fdb) | — | — | **Disabled** — uses host FoundationDB |

## Ingress routes (Caddy)

Each service is reachable via its IPv6 tier address and a `*.lucidigital.io`
hostname, e.g. `gogs.lucidigital.io`, `coder.lucidigital.io`,
`gitweb.lucidigital.io`, `homestar.lucidigital.io`, `ipfs.lucidigital.io`. Caddy
applies sovereign headers (HSTS, `X-LDS-Sovereign-Root`, frequency attestation).

## Required configuration

`compose-up` / `deploy-local` require `modules/orchestration/podman/.env`
(scaffold via `just init-env <profile>`). Required keys (compose fails fast if
unset): `CODER_DB_PASSWORD`, `CODER_PSK`. See the `.env*.example` templates.

## Lifecycle

```sh
just compose-config   # validate the compose file (uses .env.example)
just compose-up       # start detached
just compose-down     # stop
just deploy-local     # build + up + ps
```

## Notes

- IPv6 bindings and the `2602:F674::/40` plan are preserved verbatim from the
  original layout.
- `host.containers.internal` is used for host services (Ollama, IPFS API,
  FoundationDB) — airgap-first.
