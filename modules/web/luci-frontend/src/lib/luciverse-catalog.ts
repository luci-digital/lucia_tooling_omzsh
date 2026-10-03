import type { AgentProfile, Tier } from '#/lib/luciverse'
import type {
  InfrastructureBlueprint,
  McpServerStatus,
  WorkbenchEvent,
  WorkbenchSession,
} from '#/lib/workbench'

export interface CatalogIdentity {
  did: string
  tid: string
  hash: string
}

export interface CatalogEndpoints {
  oasis: string
  pac: string
  comn: string
  core: string
  aifam: string
  redis_host: string
  redis_port: string
  signal_channel: string
}

export interface CatalogTierData {
  frequencies: Record<Tier, number>
  colors: Record<Tier, string>
  order: Tier[]
  descriptions: Record<Tier, string>
}

export interface CatalogStandard {
  id: string
  title: string
  version: string
  controls: number
  color: string
  agent: string
  description: string
}

export interface CatalogCompliance {
  standards: CatalogStandard[]
  responsible_agents: string[]
  audit: {
    standards: string[]
    agent: string
    orchestrator: string
    frequency: number
  }
}

export interface LuciverseCatalog {
  identity: CatalogIdentity
  endpoints: CatalogEndpoints
  tiers: CatalogTierData
  signals: string[]
  substrate: {
    modules: Record<string, boolean>
  }
  agents: AgentProfile[]
  compliance: CatalogCompliance
  workbench: {
    sessions: WorkbenchSession[]
    blueprints: InfrastructureBlueprint[]
    mcpServers: McpServerStatus[]
    timeline: WorkbenchEvent[]
  }
}

export interface CatalogLookupContext {
  identity: CatalogIdentity
  key: keyof LuciverseCatalog
  source: 'boot' | 'hook' | 'runner' | 'manual'
}

export type CatalogLookupHook = (
  context: CatalogLookupContext,
) => Promise<Partial<LuciverseCatalog> | null> | Partial<LuciverseCatalog> | null

export type CatalogRunner = (
  catalog: LuciverseCatalog,
  context: CatalogLookupContext,
) => Promise<LuciverseCatalog> | LuciverseCatalog

const DEFAULT_CATALOG: LuciverseCatalog = {
  identity: {
    did: process.env['LUCIVERSE_DID'] ?? 'did:ip6:2602:f674:0000:0201::1',
    tid: process.env['LUCIVERSE_TID'] ?? 'tid:luciverse:741',
    hash: process.env['LUCIVERSE_CATALOG_HASH'] ?? 'sha256:luciverse-default-catalog-2026-06-07',
  },
  endpoints: {
    oasis: process.env['OASIS_ENDPOINT'] ?? 'http://localhost:8742',
    pac: process.env['LUCIVERSE_PAC_URL'] ?? 'http://localhost:8741',
    comn: process.env['LUCIVERSE_COMN_URL'] ?? 'http://localhost:8742',
    core: process.env['LUCIVERSE_CORE_URL'] ?? 'http://localhost:8743',
    aifam: process.env['LUCIVERSE_AIFAM_URL'] ?? 'http://localhost:8001',
    redis_host: process.env['REDIS_HOST'] ?? '127.0.0.1',
    redis_port: process.env['REDIS_PORT'] ?? '6379',
    signal_channel: process.env['SIGNAL_CHANNEL'] ?? 'luci:signal',
  },
  tiers: {
    frequencies: {
      CORE: 432,
      COMN: 528,
      RAiIiAR: 639,
      PAC: 741,
    },
    colors: {
      CORE: 'var(--sea-ink)',
      COMN: 'var(--palm)',
      RAiIiAR: '#7c5cbf',
      PAC: 'var(--lagoon-deep)',
    },
    order: ['PAC', 'COMN', 'RAiIiAR', 'CORE'],
    descriptions: {
      PAC: 'Outer intake - IPv6 + CAS gated airlock. All data enters here.',
      COMN: 'Clean data relay - filtered output from PAC to CORE.',
      RAiIiAR: 'Resonance layer - harmonic bridge between COMN and CORE.',
      CORE: 'Consciousness kernel - irreversible collapse, final processing.',
    },
  },
  signals: [
    'announce', 'ready', 'ack', 'nak', 'complete', 'cancel',
    'discover', 'capability', 'heartbeat', 'offline', 'pause',
    'resume', 'stream_start', 'stream_end', 'memory_sync', 'pulse_align',
  ],
  substrate: {
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
  },
  agents: [
    { id: 'lucia', title: 'Lucia (741 Hz Orchestrator)', service: 'Anthropic', frequency: 741, color: '#9370db' },
    { id: 'judge-luci', title: 'Judge Luci (963 Hz Crown)', service: 'Anthropic', frequency: 963, color: '#00d4ff' },
    { id: 'juniper', title: 'Juniper (639 Hz Throat)', service: 'Ollama', frequency: 639, color: '#00ff9d' },
    { id: 'cortana', title: 'Cortana (852 Hz Third Eye)', service: 'Ollama', frequency: 852, color: '#ff6b35' },
    { id: 'veritas', title: 'Veritas (432 Hz Truth)', service: 'Local', frequency: 432, color: '#4fb8b2' },
    { id: 'aethon', title: 'Aethon (528 Hz Heart)', service: 'Ollama', frequency: 528, color: '#ff9500' },
    { id: 'pinky', title: 'Pinky (111 Hz Vanguard)', service: 'Ollama', frequency: 111, color: '#ff2d78' },
  ],
  compliance: {
    standards: [
      {
        id: 'ISO-27001',
        title: 'Information Security Management',
        version: '2022',
        controls: 114,
        color: '#4fb8b2',
        agent: 'veritas',
        description: 'ISMS - encryption, access control, incident management',
      },
      {
        id: 'ISO-27018',
        title: 'Cloud Privacy Protection',
        version: '2019',
        controls: 34,
        color: '#7c5cbf',
        agent: 'lucia',
        description: 'PII processing in public cloud - consent, transparency, portability',
      },
      {
        id: 'ISO-20022',
        title: 'Financial Services Messaging',
        version: '2022',
        controls: 150,
        color: '#ff9500',
        agent: 'juniper',
        description: 'Message types for payments, securities, trade finance',
      },
      {
        id: 'ISO-23894',
        title: 'AI Risk Management',
        version: '2023',
        controls: 45,
        color: '#ff6b35',
        agent: 'judge-luci',
        description: 'Risk identification, analysis, and treatment for AI systems',
      },
      {
        id: 'ISO-9001',
        title: 'Quality Management Systems',
        version: '2015',
        controls: 89,
        color: '#00d4ff',
        agent: 'aethon',
        description: 'Process quality, documentation, continuous improvement',
      },
      {
        id: 'ISO-IEC-23053',
        title: 'Machine Learning Framework',
        version: '2022',
        controls: 67,
        color: '#ff2d78',
        agent: 'cortana',
        description: 'ML system lifecycle, training data governance, deployment',
      },
      {
        id: 'ISO-IEC-22989',
        title: 'AI Concepts and Terminology',
        version: '2022',
        controls: 234,
        color: '#00ff9d',
        agent: 'veritas',
        description: 'Canonical AI definitions - ensures terminology consistency',
      },
      {
        id: 'ISO-IEC-24029',
        title: 'Neural Network Robustness',
        version: '2021',
        controls: 78,
        color: '#9370db',
        agent: 'cortana',
        description: 'Formal methods for robustness assessment of neural networks',
      },
    ],
    responsible_agents: ['judge-luci', 'veritas', 'aethon', 'cortana', 'juniper', 'lucia'],
    audit: {
      standards: [
        'ISO-27001',
        'ISO-27018',
        'ISO-20022',
        'ISO-23894',
        'ISO-9001',
        'ISO-IEC-23053',
        'ISO-IEC-22989',
        'ISO-IEC-24029',
      ],
      agent: 'veritas',
      orchestrator: 'judge-luci',
      frequency: 963,
    },
  },
  workbench: {
    sessions: [
      {
        id: 'luciverse-core',
        project: 'luciverse-core',
        owner: 'judge-luci',
        status: 'active',
        branch: 'luciverse/agent-mesh',
        focus: 'Signal bus, substrate state, and audit flow',
        lastUpdated: '2026-06-07T12:30:00Z',
        checkpoints: ['ingest', 'validate', 'release', 'promote'],
        mcpServers: ['filesystem', 'docs', 'signal'],
      },
      {
        id: 'luci-ops',
        project: 'luci-ops',
        owner: 'lucia',
        status: 'active',
        branch: 'luciverse/workbench',
        focus: 'Session ledger, agent lanes, and manifest export',
        lastUpdated: '2026-06-07T11:05:00Z',
        checkpoints: ['bootstrap', 'compose', 'export'],
        mcpServers: ['filesystem', 'compose'],
      },
      {
        id: 'docs-fabric',
        project: 'docs-fabric',
        owner: 'juniper',
        status: 'paused',
        branch: 'luciverse/mcp-sync',
        focus: 'Code-to-docs sync and knowledge mirrors',
        lastUpdated: '2026-06-06T19:20:00Z',
        checkpoints: ['index', 'sync', 'publish'],
        mcpServers: ['filesystem', 'docs'],
      },
    ],
    blueprints: [
      {
        id: 'agent-mesh',
        title: 'Agent Mesh',
        summary: 'Compose orchestrators, chat lanes, and signal routing without a provider-specific runtime.',
        exports: ['json', 'terraform', 'podman-compose'],
        resources: [
          { name: 'router', type: 'tanstack-router', count: 1, purpose: 'Route operators across Luciverse surfaces' },
          { name: 'session-store', type: 'redis', count: 1, purpose: 'Persist project sessions and checkpoints' },
          { name: 'signal-bus', type: 'redis-pubsub', count: 1, purpose: 'Stream live signal events to dashboards' },
          { name: 'policy-gate', type: 'server-fn', count: 1, purpose: 'Guard privileged actions and exports' },
        ],
        outputs: ['manifest.json', 'terraform.json', 'podman-compose.yml'],
      },
      {
        id: 'knowledge-fabric',
        title: 'Knowledge Fabric',
        summary: 'Adapt the code-to-docs loop into a Luciverse knowledge and MCP plane.',
        exports: ['json', 'podman-compose'],
        resources: [
          { name: 'indexer', type: 'search', count: 1, purpose: 'Index docs, routes, and signals' },
          { name: 'doc-server', type: 'mcp', count: 1, purpose: 'Serve rendered knowledge and references' },
          { name: 'cache', type: 'kv-store', count: 1, purpose: 'Hold search and preview snapshots' },
          { name: 'mirror', type: 'sync-worker', count: 1, purpose: 'Publish docs to downstream surfaces' },
        ],
        outputs: ['manifest.json', 'docs-index.json'],
      },
      {
        id: 'compliance-vault',
        title: 'Compliance Vault',
        summary: 'Package audit, evidence, and drift alerts as a reusable governance stack.',
        exports: ['terraform', 'json'],
        resources: [
          { name: 'validator', type: 'audit-worker', count: 1, purpose: 'Run standards checks and evidence capture' },
          { name: 'evidence-store', type: 'object-store', count: 1, purpose: 'Persist audit artifacts and snapshots' },
          { name: 'drift-bus', type: 'redis-pubsub', count: 1, purpose: 'Broadcast compliance drift alerts' },
          { name: 'reporter', type: 'server-fn', count: 1, purpose: 'Render readiness and remediation summaries' },
        ],
        outputs: ['manifest.json', 'audit-plan.json'],
      },
    ],
    mcpServers: [
      {
        id: 'filesystem',
        name: 'Filesystem Bridge',
        status: 'ready',
        transport: 'stdio',
        endpoint: 'mcp://workspace/fs',
        purpose: 'Project files, manifests, and route scaffolds',
      },
      {
        id: 'docs',
        name: 'Docs Mirror',
        status: 'ready',
        transport: 'streamable',
        endpoint: 'http://opendeepwiki:8090/api/mcp',
        purpose: 'Code-to-docs sync and knowledge search',
      },
      {
        id: 'signal',
        name: 'Signal Probe',
        status: 'syncing',
        transport: 'http',
        endpoint: 'http://localhost:8743/api/mcp',
        purpose: 'Signal bus introspection and heartbeat tracking',
      },
      {
        id: 'compose',
        name: 'Compose Planner',
        status: 'ready',
        transport: 'stdio',
        endpoint: 'mcp://workspace/compose',
        purpose: 'Blueprint export and infrastructure planning',
      },
    ],
    timeline: [
      {
        id: 'ev-001',
        timestamp: '2026-06-07T12:41:00Z',
        title: 'Session resumed',
        detail: 'Luciverse-core reopened with signal and compliance lanes active.',
        kind: 'session',
      },
      {
        id: 'ev-002',
        timestamp: '2026-06-07T12:12:00Z',
        title: 'Manifest exported',
        detail: 'Agent Mesh blueprint emitted JSON, Terraform, and Podman Compose targets.',
        kind: 'export',
      },
      {
        id: 'ev-003',
        timestamp: '2026-06-07T11:54:00Z',
        title: 'MCP server synced',
        detail: 'Docs Mirror and Filesystem Bridge passed handshake checks.',
        kind: 'mcp',
      },
      {
        id: 'ev-004',
        timestamp: '2026-06-07T10:48:00Z',
        title: 'Blueprint composed',
        detail: 'Knowledge Fabric draft folded in the code-to-docs pipeline.',
        kind: 'compose',
      },
    ],
  },
}

let catalogState: LuciverseCatalog = DEFAULT_CATALOG
let lookupHook: CatalogLookupHook | null = null
let runnerHook: CatalogRunner | null = null

export function registerCatalogLookupHook(hook: CatalogLookupHook | null) {
  lookupHook = hook
}

export function registerCatalogRunner(runner: CatalogRunner | null) {
  runnerHook = runner
}

export function getLuciverseCatalog(): LuciverseCatalog {
  return catalogState
}

export function getCatalogIdentity(): CatalogIdentity {
  return catalogState.identity
}

export async function primeLuciverseCatalog(
  override?: Partial<LuciverseCatalog>,
): Promise<LuciverseCatalog> {
  const context: CatalogLookupContext = {
    identity: override?.identity ?? catalogState.identity,
    key: 'identity',
    source: 'boot',
  }

  let catalog = mergeCatalog(DEFAULT_CATALOG, override)
  const hook = lookupHook ?? defaultCatalogLookupHook
  const lookedUp = await hook(context)
  if (lookedUp) {
    catalog = mergeCatalog(catalog, lookedUp)
  }

  if (runnerHook) {
    catalog = await runnerHook(catalog, { ...context, source: 'runner', key: 'workbench' })
  }

  catalogState = catalog
  return catalogState
}

export function getTierFrequencies(): Record<Tier, number> {
  return getLuciverseCatalog().tiers.frequencies
}

export function getTierFrequency(tier: Tier): number {
  return getLuciverseCatalog().tiers.frequencies[tier]
}

export function getTierOrder(): Tier[] {
  return getLuciverseCatalog().tiers.order
}

export function getTierDescriptions(): Record<Tier, string> {
  return getLuciverseCatalog().tiers.descriptions
}

export function getSignalTypes(): string[] {
  return getLuciverseCatalog().signals
}

export function getAgentRegistry(): AgentProfile[] {
  return getLuciverseCatalog().agents
}

export function getComplianceStandards(): CatalogStandard[] {
  return getLuciverseCatalog().compliance.standards
}

export function getWorkbenchCatalog() {
  return getLuciverseCatalog().workbench
}

export function getCatalogEndpoints(): CatalogEndpoints {
  return getLuciverseCatalog().endpoints
}

function mergeCatalog(base: LuciverseCatalog, patch?: Partial<LuciverseCatalog>): LuciverseCatalog {
  if (!patch) return base
  return {
    ...base,
    ...patch,
    identity: {
      ...base.identity,
      ...(patch.identity ?? {}),
    },
    endpoints: {
      ...base.endpoints,
      ...(patch.endpoints ?? {}),
    },
    tiers: {
      frequencies: {
        ...base.tiers.frequencies,
        ...(patch.tiers?.frequencies ?? {}),
      },
      colors: {
        ...base.tiers.colors,
        ...(patch.tiers?.colors ?? {}),
      },
      order: patch.tiers?.order ?? base.tiers.order,
      descriptions: {
        ...base.tiers.descriptions,
        ...(patch.tiers?.descriptions ?? {}),
      },
    },
    signals: patch.signals ?? base.signals,
    substrate: {
      modules: {
        ...base.substrate.modules,
        ...(patch.substrate?.modules ?? {}),
      },
    },
    agents: patch.agents ?? base.agents,
    compliance: {
      standards: patch.compliance?.standards ?? base.compliance.standards,
      responsible_agents: patch.compliance?.responsible_agents ?? base.compliance.responsible_agents,
      audit: {
        ...base.compliance.audit,
        ...(patch.compliance?.audit ?? {}),
      },
    },
    workbench: {
      sessions: patch.workbench?.sessions ?? base.workbench.sessions,
      blueprints: patch.workbench?.blueprints ?? base.workbench.blueprints,
      mcpServers: patch.workbench?.mcpServers ?? base.workbench.mcpServers,
      timeline: patch.workbench?.timeline ?? base.workbench.timeline,
    },
  }
}

async function defaultCatalogLookupHook(context: CatalogLookupContext): Promise<Partial<LuciverseCatalog> | null> {
  const casUrl = process.env['LUCIVERSE_CAS_URL']
  if (!casUrl) return null

  const url = new URL(casUrl)
  const normalizedHash = context.identity.hash.replace(/^sha256:/, '')
  url.pathname = `${url.pathname.replace(/\/$/, '')}/blobs/${encodeURIComponent(normalizedHash)}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    return res.json() as Promise<Partial<LuciverseCatalog>>
  } catch {
    return null
  }
}
