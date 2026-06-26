# Aifam Mesh MCP (Iris) — Architecture

## Purpose

A single, clean MCP gateway that lets the Luciverse / Aifam agents reach two
planes from **any** AI runtime:

- **Cognition** — distributed LLM inference on an **exo + MLX** cluster.
- **Action** — physical-world control of **Matter** devices via the Home
  Assistant Matter Server.

```
        any AI runtime (Claude · OpenAI · Ollama · local agents)
                              │  MCP (stdio | Streamable HTTP)
                              ▼
                    ┌───────────────────────┐
                    │   Aifam Mesh MCP (Iris)│
                    │   server.ts / tools/   │
                    └─────────┬─────────┬────┘
            inference plane   │         │   action plane
                              ▼         ▼
              ┌───────────────────┐   ┌──────────────────────────┐
              │ exo cluster (mesh)│   │ HA Matter Server (ws:5580)│
              │  /v1/chat /state  │   │  get_nodes/device_command │
              │  MLX · tinygrad   │   │  Matter fabric            │
              └───────────────────┘   └──────────────────────────┘
              auto-discovered nodes    lights · plugs · locks · sensors
```

## Why this beats a Hermes-style bus

"Hermes" (the messenger) names the common pattern of a single-runtime agent
**message relay**: it ferries text between agents on one stack. Iris is a
**capability gateway**, and the differences are deliberate:

| Concern | Hermes-style relay | Aifam Mesh MCP (Iris) |
|---|---|---|
| Runtime coupling | Bound to one runtime/SDK | **Runtime-agnostic** via MCP; works in any MCP client |
| Transport | One channel | **stdio _and_ Streamable HTTP** in one binary |
| Inference | Relays text to a single endpoint | **Mesh-aware**: lists/places/warms models across an exo cluster, shards across MLX + tinygrad |
| Topology | Opaque | `mesh_status` / `aifam://mesh/state` expose nodes, runtime, device, memory |
| World actions | None (text only) | **Matter plane**: read/write attributes, invoke cluster commands, commission devices |
| Identity model | Flat agent ids | **Luciverse tiers + frequencies + coherence gating** (PAC→COMN→CORE, push-only) |
| Failure mode | Hard dependency on the bus | **Lazy backends**: boots with nothing online; each plane reports a clear, actionable error |
| Base | Container/Linux assumption | **OpenBSD-first**, no Docker required (see below) |

Net: Hermes moves messages; Iris moves *capabilities* — and it knows about the
distributed substrate underneath instead of treating inference as a black box.

## Components

- **`mesh/exo.ts`** — exo client. exo exposes an OpenAI/Claude-compatible API and
  auto-discovers peers, so a fleet of Macs/GPUs presents as one model endpoint.
  - `chat` → `POST /v1/chat/completions`
  - `listModels` → `GET /models[?status=downloaded]`
  - `state` → `GET /state` (normalized to nodes + runtime/device/memory)
  - `ensureModel` → `POST /instance` + `GET /instance/await` (warm before use)
- **`matter/client.ts`** — Home Assistant Matter Server WebSocket client. Handles
  the ServerInfo handshake, then correlates each `{message_id, command, args}`
  request to its response; surfaces `error_code` as a typed error. Wraps
  `get_nodes`, `get_node`, `device_command`, `read_attribute`, `write_attribute`,
  `commission_with_code`.
- **`backends/`** — the runtime-agnostic chat layer. A `ChatBackend` interface
  fronts `mesh` (exo + MLX, local distributed inference), `anthropic` (the
  official Claude SDK), and `openai` (any OpenAI-compatible cloud runtime). A
  `BackendRegistry` routes by name and reports which are configured. This is how
  agents "fan out to cloud runtimes" — `agent_invoke` picks one backend,
  `agent_fanout` runs the same prompt across several in parallel. The Anthropic
  backend is the only place the Claude wire format lives; it omits sampling
  params because the current Opus family rejects them.
- **`agents/registry.ts`** — the Aifam roster, grounded in the Luciverse
  frequency map (432 root · 528 Veritas · 639 Juniper · 741 Lucia · 852 Cortana ·
  963 Judge Luci). Each agent may declare a preferred `backend` and `model`.
  Tiers PAC→COMN→CORE flow push-only; `agent_invoke` is gated by a configurable
  minimum coherence.
- **`tools/`** — thin, well-described MCP tools over the clients. Every handler is
  wrapped by `guard()` so backend failures become clean tool errors, never crashes.
- **`index.ts`** — selects the transport. stdio for local/embedded clients;
  stateless Streamable HTTP (fresh server+transport per request) for remote
  multi-runtime access.

## Tier & coherence model

Inference routed through `agent_invoke` is framed with the agent's tier and
bonded frequency and refused if the agent's coherence drops below
`LUCIVERSE_COHERENCE_MIN` (default 0.7; Genesis Bond minimum is 0.94). This keeps
the agent mesh aligned with the Luciverse substrate's push-only, coherence-held
discipline rather than a free-for-all relay.

## Deployment base: OpenBSD

Iris targets **OpenBSD** as its base — a hardened, auditable, no-Docker
substrate that matches the sovereign-platform ethos (and contrasts with the
container-first assumption of a typical Hermes deployment).

- **Ports required** (from [openbsd/ports](https://github.com/openbsd/ports)):
  - `lang/node` — provides `node` + `npm`, the only hard runtime/build dependency.
  - `devel/git` — to clone this repo (build-time only).
  - exo and the Matter Server themselves run on their own hosts; Iris only needs
    network reach to `EXO_BASE_URL` and `MATTER_WS_URL`.
- **Service**: an `rc.d(8)` daemon script (`deploy/openbsd/rc.d/aifam_mcp`) runs
  it under `rcctl` with HTTP transport, logging to `/var/log/aifam_mcp.log`.
- **Privilege separation**: runs as a dedicated `_aifam` user; OpenBSD's
  `pledge(2)`/`unveil(2)` posture is documented in `deploy/openbsd/README.md`.

See [`deploy/openbsd/README.md`](./deploy/openbsd/README.md) for the full install.

## Roadmap

- Streaming chat (SSE passthrough from exo `stream:true`).
- Matter event subscriptions (`start_listening`) surfaced as MCP notifications.
- exo `instance/previews` exposed as a placement-planning tool.
- Per-agent model affinity learned from `mesh_status` device capabilities.
- Native OpenBSD port skeleton (`Makefile` + `pkg/`) for `make package`.
