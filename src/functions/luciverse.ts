import { createServerFn } from '@tanstack/react-start'
import {
  oasisEndpoint,
  thisTier,
  thisFrequency,
  thisCoherence,
  type SubstrateStatus,
  type AgentProfile,
  type ChatMessage,
  type ChatResponse,
  type Tier,
} from '#/lib/luciverse'

// ── Substrate status ─────────────────────────────────────────────────────────

export const getSubstrateStatus = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SubstrateStatus> => {
    const base = oasisEndpoint()

    try {
      const res = await fetch(`${base}/status`, {
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        return res.json() as Promise<SubstrateStatus>
      }
    } catch {
      // Backend not reachable — return stub so the UI doesn't crash
    }

    return {
      version: '0.2.0',
      lua_version: '5.0.3',
      genesis_bond: 'ACTIVE',
      frequency: thisFrequency(),
      tier: thisTier() as Tier,
      coherence: thisCoherence(),
      modules: {
        enzyme_collapse: true,
        state_machine: true,
        filter_membrane: true,
        humo: true,
        signal_bus: true,
        genesis_bond: true,
        nebula: false,
        luci_glyph: true,
      },
      uptime_seconds: 0,
    }
  },
)

// ── Agent list ───────────────────────────────────────────────────────────────

export const listAgents = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AgentProfile[]> => {
    const base = oasisEndpoint()

    try {
      const res = await fetch(`${base}/agents`, {
        signal: AbortSignal.timeout(3000),
      })
      if (res.ok) {
        return res.json() as Promise<AgentProfile[]>
      }
    } catch {
      // Fall through to stub
    }

    // Default Luciverse agents from calibration.ini
    return [
      { id: 'lucia', title: 'Lucia AI', service: 'Anthropic' },
      { id: 'claude-veritas', title: 'Claude Veritas', service: 'Anthropic' },
      { id: 'juniper', title: 'Juniper', service: 'Ollama' },
      { id: 'legislature', title: 'Legislature', service: 'Anthropic' },
    ]
  },
)

// ── Agent chat ───────────────────────────────────────────────────────────────

export const chatWithAgent = createServerFn({ method: 'POST' })
  .validator(
    (input: { agentId: string; messages: ChatMessage[] }) => input,
  )
  .handler(async ({ data }): Promise<ChatResponse> => {
    const base = oasisEndpoint()
    const { agentId, messages } = data

    try {
      const res = await fetch(`${base}/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.timeout(30000),
      })
      if (res.ok) {
        return res.json() as Promise<ChatResponse>
      }
      const errText = await res.text()
      throw new Error(`Backend error ${res.status}: ${errText}`)
    } catch (err) {
      if (err instanceof Error) throw err
      throw new Error('Agent unreachable')
    }
  })

// ── Signal bus status ────────────────────────────────────────────────────────

export const getSignalBusStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const host = process.env['REDIS_HOST'] ?? '127.0.0.1'
    const port = process.env['REDIS_PORT'] ?? '6379'
    const channel = process.env['SIGNAL_CHANNEL'] ?? 'luci:signal'
    return {
      redis_host: host,
      redis_port: port,
      broadcast_channel: `${channel}:broadcast`,
      signal_count: 16,
      genesis_bond: 'ACTIVE @ 741 Hz',
    }
  },
)
