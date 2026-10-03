import {
  getAgentRegistry,
  getCatalogEndpoints,
  getLuciverseCatalog,
  getSignalTypes,
  getTierDescriptions,
  getTierFrequencies,
  getTierFrequency,
  getTierOrder,
  primeLuciverseCatalog,
} from '#/lib/luciverse-catalog'

export type Tier = 'CORE' | 'COMN' | 'RAiIiAR' | 'PAC'

export const TIER_FREQUENCIES: Record<Tier, number> = new Proxy({} as Record<Tier, number>, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined
    return getTierFrequencies()[prop as Tier]
  },
}) as Record<Tier, number>

export const TIER_COLORS: Record<Tier, string> = new Proxy({} as Record<Tier, string>, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined
    return getLuciverseCatalog().tiers.colors[prop as Tier]
  },
}) as Record<Tier, string>

export type SignalType =
  | 'announce'
  | 'ready'
  | 'ack'
  | 'nak'
  | 'complete'
  | 'cancel'
  | 'discover'
  | 'capability'
  | 'heartbeat'
  | 'offline'
  | 'pause'
  | 'resume'
  | 'stream_start'
  | 'stream_end'
  | 'memory_sync'
  | 'pulse_align'

export interface SubstrateStatus {
  version: string
  lua_version: string
  genesis_bond: 'ACTIVE' | 'INACTIVE'
  frequency: number
  tier: Tier
  coherence: number
  modules: Record<string, boolean>
  uptime_seconds: number
}

export interface AgentProfile {
  id: string
  title: string
  service: string
  frequency?: number
  system_message?: string
  color?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  role: string
  content: string
  model?: string
}

export function tierEndpoint(tier: Tier): string {
  const endpoints = getCatalogEndpoints()
  const map: Record<Tier, string> = {
    PAC: endpoints.pac,
    COMN: endpoints.comn,
    CORE: endpoints.core,
    RAiIiAR: endpoints.comn,
  }
  return map[tier]
}

export function oasisEndpoint(): string {
  return getCatalogEndpoints().oasis
}

export function thisTier(): Tier {
  const catalog = getLuciverseCatalog()
  const t = process.env['LUCIVERSE_TIER'] as Tier
  return t in catalog.tiers.frequencies ? t : catalog.tiers.order[0]
}

export function thisFrequency(): number {
  return Number(process.env['LUCIVERSE_FREQUENCY'] ?? getTierFrequency(thisTier()))
}

export function thisCoherence(): number {
  return Number(process.env['LUCIVERSE_COHERENCE'] ?? 0.85)
}

export function getTierMap(): Record<Tier, number> {
  return getTierFrequencies()
}

export function getTierSequence(): Tier[] {
  return getTierOrder()
}

export function getTierNotes(): Record<Tier, string> {
  return getTierDescriptions()
}

export { getAgentRegistry, getSignalTypes, primeLuciverseCatalog, getLuciverseCatalog }
