import { createServerFn } from '@tanstack/react-start'
import {
  oasisEndpoint,
  thisTier,
  thisFrequency,
  thisCoherence,
  primeLuciverseCatalog,
  getAgentRegistry,
  getLuciverseCatalog,
  type SubstrateStatus,
  type AgentProfile,
  type ChatMessage,
  type ChatResponse,
  type Tier,
} from '#/lib/luciverse'

// ── Substrate status ─────────────────────────────────────────────────────────

export const getSubstrateStatus = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SubstrateStatus> => {
    await primeLuciverseCatalog()
    const base = oasisEndpoint()
    const catalog = getLuciverseCatalog()

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
      modules: catalog.substrate.modules,
      uptime_seconds: 0,
    }
  },
)

// ── Agent list ───────────────────────────────────────────────────────────────

export const listAgents = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AgentProfile[]> => {
    await primeLuciverseCatalog()
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

    return getAgentRegistry()
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
    await primeLuciverseCatalog()
    const catalog = getLuciverseCatalog()
    const host = process.env['REDIS_HOST'] ?? '127.0.0.1'
    const port = process.env['REDIS_PORT'] ?? '6379'
    const channel = process.env['SIGNAL_CHANNEL'] ?? 'luci:signal'
    const frequency = thisFrequency()
    return {
      redis_host: catalog.endpoints.redis_host ?? host,
      redis_port: catalog.endpoints.redis_port ?? port,
      broadcast_channel: `${catalog.endpoints.signal_channel ?? channel}:broadcast`,
      signal_count: catalog.signals.length,
      genesis_bond: `ACTIVE @ ${frequency} Hz`,
    }
  },
)
