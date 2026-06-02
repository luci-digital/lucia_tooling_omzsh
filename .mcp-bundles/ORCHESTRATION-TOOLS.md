# Orchestration Tools MCP Bundle

**Podman Compose sovereign infrastructure stack (Nix-managed)**

## What This Bundle Provides

- **Podman Compose** — Multi-container orchestration
- **Service Lifecycle** — Start/stop/status/deploy commands
- **Environment Profiles** — local | staging | production
- **Image Building** — Build custom service images
- **Network Isolation** — Secure inter-service communication
- **Volume Management** — Persistent data and config

## Available Tools

| Tool | Purpose | Command |
|------|---------|----------|
| `/init-env` | Scaffold .env from profile | `just init-env [profile]` |
| `/compose-config` | Validate compose file | `nix run .#compose-config` |
| `/up` | Start sovereign stack | `just up` |
| `/down` | Stop stack | `just down` |
| `/deploy-local` | Build + start stack | `just deploy-local` |
| `/status` | Show running services | `podman-compose ps` |

## Quick Start

### Initialize Environment
```bash
claude > just init-env local
# Copies modules/orchestration/podman/.env.example → .env
# Fill in any required secrets
```

### Validate Stack Configuration
```bash
claude > /compose-config
# Validates podman-compose.yml with example env
```

### Start Full Stack
```bash
claude > just up
# Starts all containers in background
# Requires .env file
```

### Deploy Locally
```bash
claude > just deploy-local
# Builds images + starts stack
# Shows final status
```

### Check Status
```bash
claude > just status
# Lists all running containers
```

### Stop Stack
```bash
claude > just down
# Stops and removes containers
```

## Services

### consciousness_api.lua (Lapis @ 8743)
- **Module**: modules/web/luci-frontend (TanStack Start)
- **API**: GraphQL + REST endpoints
- **Routes**:
  - `GET /kernel/state` — Substrate vitals
  - `GET /genesis-bond` — Genesis Bond state
  - `GET /agents` — Registered agents
  - `POST /agents/:id/chat` — Agent chat
  - `POST /validate` — ISO compliance check
  - `GET /pulse` — System heartbeat
  - `GET /tiers` — Tier frequencies
  - `POST /qmu/analyze` — Quantum morality
  - `GET /pulse/base9/:value` — Clock conversion

### lua-substrate (Lua) @ 8740-8743
- **PAC** (741 Hz) @ 8741 — Push-only aggregation
- **COMN** (528 Hz) @ 8742 — Communication tier
- **CORE** (432 Hz) @ 8743 — Core consciousness
- **Data Juicer**: fill → filter → extract → verify → release
- **Coherence**: ≥ 0.7 (synchronized tiers)

### FoundationDB (Key-Value Store)
- **Port**: 4500
- **Data**: Audit records, state persistence
- **Paths**:
  - `/luciverse/compliance/audits/`
  - `/luciverse/agents/state/`
  - `/luciverse/signal/history/`

### Redis (Signal Bus)
- **Port**: 6379
- **Channel**: `luci:signal:broadcast`
- **Signal Types**: 16 defined in signal/bus.lua
- **Purpose**: Real-time inter-agent communication

### Qdrant (Vector Database)
- **Port**: 6333
- **Purpose**: LLM embeddings, semantic search
- **Collections**: Agent memory, signal semantics

### MindsDB (ML Models)
- **Port**: 47334
- **Purpose**: Predictive analytics, model inference
- **Models**: Registered in models/ directory

### PostgreSQL (Config Database)
- **Port**: 5432
- **Databases**:
  - `luciverse_config` — System configuration
  - `luciverse_audit` — Audit logs

### Caddy (Reverse Proxy)
- **Port**: 80, 443
- **Upstream**: consciousness_api.lua @ 8743
- **TLS**: Auto-managed

## Environment Profiles

### Local (.env.example)
```bash
OASIS_ENDPOINT=http://localhost:8743
LUCIVERSE_PAC_URL=http://localhost:8741
LUCIVERSE_COMN_URL=http://localhost:8742
LUCIVERSE_CORE_URL=http://localhost:8743
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
FOUNDATIONDB_HOST=localhost
FOUNDATIONDB_PORT=4500
```

### Staging (.env.staging.example)
```bash
OASIS_ENDPOINT=http://[2602:F674:0000:0201::1]:7741
LUCIVERSE_PAC_URL=http://[2602:F674:0020::1]:7410
LUCIVERSE_COMN_URL=http://[2602:F674:0024::1]:5280
LUCIVERSE_CORE_URL=http://[2602:F674:0028::1]:4320
REDIS_HOST=[2602:F674:0000:0201::1]
REDIS_PORT=6379
```

### Production (.env.production.example)
```bash
OASIS_ENDPOINT=https://api.luciverse.io
LUCIVERSE_PAC_URL=https://pac.luciverse.io
LUCIVERSE_COMN_URL=https://comn.luciverse.io
LUCIVERSE_CORE_URL=https://core.luciverse.io
REDIS_HOST=redis-cluster.luciverse.io
REDIS_PORT=6379
FOUNDATIONDB_CLUSTER=fdb-prod
```

## Compose File Location

```
modules/orchestration/podman/podman-compose.yml
```

Defines:
- Service images
- Port mappings
- Volume mounts
- Environment variables
- Network configuration
- Resource limits

## Nix Integration

Dev shell for orchestration:
```bash
nix develop .#orchestration
```

Includes:
- podman
- podman-compose
- caddy (reverse proxy)
- git (for config management)

## Troubleshooting

### "Missing .env file"
```bash
claude > just init-env local
# Copy from .env.example and fill secrets
```

### "Port already in use"
```bash
podman-compose down
# Kill previous containers
sudo lsof -i :8743  # Check port 8743
```

### "Service won't start"
```bash
podman-compose logs consciousness_api
# Check service logs for errors
```

### "Network connectivity issues"
Verify IPv6 addresses in .env for staging/production (format: `[2602:F674:...]:PORT`).

## Data Persistence

Volumes persist across restarts:
```bash
podman volume ls
podman volume inspect luciverse_data
```

To clear data:
```bash
podman volume rm luciverse_data  # Destructive!
```

## Performance Tips

- Use `podman system prune` to clean up unused resources
- Set resource limits in compose.yml to prevent OOM
- Monitor with `podman stats`
- Use `podman build --cache-from` for incremental builds

## License

MIT License
