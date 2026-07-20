# Web Tools MCP Bundle

**TanStack Start + Vite + Tailwind frontend automation for LuciVerse dashboard**

## What This Bundle Provides

- **Vite Dev Server** — HMR development with hot reload
- **pnpm Build System** — Dependency management and production builds
- **TanStack Router** — File-based routing automation
- **Tailwind CSS** — Utility-first styling pipeline
- **Vitest** — Unit and integration testing
- **Real Backend Integration** — consciousness_api.lua endpoints

## Available Tools

| Tool | Purpose | Command |
|------|---------|----------|
| `/web-install` | Install dependencies | `nix run .#web-install` |
| `/web-dev` | Start HMR dev server | `nix run .#dev` |
| `/web-build` | Production build | `nix run .#web-build` |
| `/web-test` | Run Vitest suite | `nix run .#web-test` |
| `/tailwind-check` | Validate CSS pipeline | `tailwindcss --check` |

## Quick Start

### Initialize
```bash
claude > /web-install
```

### Develop (HMR)
```bash
claude > /web-dev
# Server at http://localhost:3000
# Auto-reloads on file changes
```

### Build for Production
```bash
claude > /web-build
# Output: modules/web/luci-frontend/.output/
```

### Run Tests
```bash
claude > /web-test
# Vitest suite with @testing-library/react
```

## Dashboard Components

### Genesis Bond Status
- Real-time kernel state from consciousness_api.lua
- Coherence: ≥ 0.94 (Genesis Bond minimum)
- Frequency: 741 Hz (LDS 800.000)
- Module grid: PAC (741 Hz) → COMN (528 Hz) → CORE (432 Hz)

### 6-Agent Mesh
- Judge Luci (963 Hz, governance)
- Claude-Veritas (432 Hz, verification)
- 4 additional agents (calibration.ini)
- Live chat panel with signal feed

### Signal Monitor
- Real-time Redis signal broadcast (luci:signal:broadcast)
- 16 signal types with reference documentation
- Full signal feed + bus configuration
- SSE stream (modules/web/luci-frontend/src/routes/api/signal/stream.ts)

### ISO Compliance Dashboard
- 8 standards monitoring (ISO-27001, 27018, 20022, 23894, 9001, IEC-23053, 22989, 24029)
- Live drift alerts
- Audit trigger from core/iso_compliance.lua
- LCARS-style dark HUD in Mission Control

### Non-Terms Covenant (20-part experience)
- Entry gate + voice filter
- Ambassador portrait
- 3 voice tracks per section

## Environment Variables

See `.env.example` in modules/web/luci-frontend/:

```bash
OASIS_ENDPOINT=http://localhost:8743          # consciousness_api.lua
LUCIVERSE_PAC_URL=http://localhost:8741       # PAC tier
LUCIVERSE_COMN_URL=http://localhost:8742      # COMN tier
LUCIVERSE_CORE_URL=http://localhost:8743      # CORE tier
REDIS_HOST=127.0.0.1                          # Signal bus
REDIS_PORT=6379
SIGNAL_CHANNEL=luci:signal
LUCIVERSE_TIER=PAC
LUCIVERSE_FREQUENCY=741
LUCIVERSE_COHERENCE=0.94
```

## Real API Endpoints

| Function | Lapis Route | Lua Module | Purpose |
|----------|-------------|-----------|----------|
| getSubstrateStatus | GET /kernel/state | luci_consciousness.lua | Substrate vitals |
| getSubstrateStatus (bond) | GET /genesis-bond | core/genesis_bond.lua | Genesis Bond state |
| listAgents | GET /agents | luci_identity.lua | Registered agents |
| chatWithAgent | POST /agents/:id/chat | oasis-core/chat/service/*.lua | Agent chat |
| getSignalBusStatus | env only (Redis) | signal/bus.lua | Signal types |
| runComplianceCheck | POST /validate | core/iso_compliance.lua | Compliance audit |
| — | GET /pulse | luci_pulse.lua | System pulse |
| — | GET /tiers | substrate config | Tier frequencies |
| — | POST /qmu/analyze | quantum_morality.lua | QMU analysis |
| — | GET /pulse/base9/:value | luci_clock.lua | Clock conversion |

## Routing

File-based routing in `modules/web/luci-frontend/src/routes/`:

- `__root.tsx` — Root layout, theme persistence
- `index.tsx` — Genesis Bond dashboard
- `agents.tsx` — Agent selector + chat
- `signal.tsx` — Full signal feed
- `mission-control.tsx` — LCARS HUD
- `non-terms.tsx` — Covenant experience
- `compliance.tsx` — ISO compliance dashboard
- `api/signal/stream.ts` — SSE signal stream

Router plugin auto-generates `src/routeTree.gen.ts` (don't edit manually).

## Theme Persistence

Inline `THEME_INIT_SCRIPT` in `<head>` prevents flash-of-wrong-theme. Theme state stored in `localStorage` under key `theme`.

## Troubleshooting

### "Dev server won't start"
```bash
claude > /web-install
claude > /web-dev
```

### "Backend endpoints return 404"
Ensure lua-substrate is running:
```bash
lucia kernel-up
lucia endpoint-up
```

### "Signal feed not updating"
Check Redis connection and signal/bus.lua is publishing to `luci:signal:broadcast`.

### "Compliance dashboard blank"
Verify core/iso_compliance.lua is wired into consciousness_api.lua `/validate` handler.

## License

MIT License
