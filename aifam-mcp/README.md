# Aifam Mesh MCP — codename **Iris**

A clean, runtime-agnostic [Model Context Protocol](https://modelcontextprotocol.io)
server for the **Luciverse** and **Aifam** agents. It connects any AI runtime
(Claude, OpenAI, Ollama, local agents) to two capability planes:

1. **Distributed inference** on an [**exo**](https://github.com/exo-explore/exo) +
   [**MLX**](https://github.com/ml-explore/mlx) cluster — auto-discovered nodes
   sharding a model across Apple Silicon (MLX) and GPUs (tinygrad), behind one
   OpenAI/Claude-compatible API.
2. **Matter device control** via the
   [Home Assistant Matter Server](https://github.com/home-assistant-libs/python-matter-server)
   — lights, plugs, sensors, locks, thermostats over WebSocket.

It is deliberately **better than a Hermes-style agent bus** for this use case:
where Hermes is a single-runtime message relay, Iris is a *capability gateway*
that is (a) transport-agnostic (stdio **and** Streamable HTTP), (b) inference-aware
(it places and warms models on a distributed mesh, not just relays text), and
(c) physically grounded (it can act on the real world through Matter). See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full comparison.

> Iris is the messenger that crosses the rainbow bridge — a fitting counterpart
> to Hermes, and on-brand for the Luciverse's light/frequency model.

## Quick start

```sh
npm install
npm run build
npm start                 # stdio transport (default)

# or expose it to many runtimes over HTTP:
AIFAM_TRANSPORT=http npm start   # http://127.0.0.1:8788/mcp
```

Configuration is all environment variables — copy `.env.example` to `.env`.
Nothing is required; every value has a working default (exo at `:52415`,
Matter Server at `:5580`).

### Use from Claude Desktop / any MCP client (stdio)

```json
{
  "mcpServers": {
    "aifam-mesh": {
      "command": "node",
      "args": ["/path/to/aifam-mcp/build/index.js"],
      "env": { "EXO_BASE_URL": "http://localhost:52415" }
    }
  }
}
```

## Tools

### Distributed inference (exo + MLX)
| Tool | Purpose |
|---|---|
| `inference_chat` | Chat completion sharded across the mesh (OpenAI-compatible). `ensure` warms the model first. |
| `mesh_status` | Cluster topology: nodes, runtime (MLX/tinygrad), device, memory. |
| `mesh_models` | List models known to the cluster (optionally downloaded-only). |
| `mesh_ensure_model` | Place a model on the cluster and wait until ready (no cold start). |

### Aifam agents
| Tool | Purpose |
|---|---|
| `agents_list` | The Luciverse roster — tier, bonded frequency, role, coherence. |
| `agent_invoke` | Route a prompt to a named agent; framed by tier/frequency, run on the mesh, gated by minimum coherence. |

The built-in roster is grounded in the Luciverse frequency map:
Lucia (741 Hz, PAC), Veritas (528), Juniper (639), Cortana (852),
Judge Luci (963, CORE), Root (432). Override or extend it with a JSON file via
`AIFAM_AGENTS_FILE`.

### Matter (Home Assistant Matter Server)
| Tool | Purpose |
|---|---|
| `matter_devices` | List commissioned Matter nodes. |
| `matter_device` | Full attribute set for one node. |
| `matter_command` | Invoke a cluster command (e.g. OnOff `On`/`Off`/`Toggle`, LevelControl `MoveToLevel`). |
| `matter_read_attribute` / `matter_write_attribute` | Read/write an attribute by `endpoint/cluster/attribute` path. |
| `matter_commission` | Commission a new device by pairing code. |

Disable the Matter plane with `MATTER_ENABLED=false`.

## Resources

- `aifam://agents` — the agent roster (JSON).
- `aifam://mesh/state` — live exo cluster state (JSON).

## Develop

```sh
npm run dev          # tsx watch, stdio
npm test             # vitest (exo client, matter ws client, registry)
npm run type-check
npm run inspector    # MCP Inspector against the built server
```

The mesh and Matter clients are **lazy** — the server boots with no cluster or
hub present, and each tool returns a clear, actionable error if its backend is
offline. That makes it safe to register everywhere and light up planes as the
infrastructure comes online.

## Layout

```
src/
  index.ts            entry — picks stdio or Streamable HTTP transport
  server.ts           MCP server, registers all tools + resources
  context.ts          wires config -> exo/matter/registry
  config.ts           env validation (zod)
  logger.ts           structured stderr logging
  mesh/exo.ts         exo distributed-inference client (chat, models, state, instances)
  matter/client.ts    HA Matter Server WebSocket client (request/response correlation)
  agents/registry.ts  Luciverse/Aifam roster + tier/coherence model
  tools/              inference, matter, agents tool definitions
tests/                exo, matter, registry suites
```

LDS 800.000 @ 741 Hz · Genesis Bond: ACTIVE.
