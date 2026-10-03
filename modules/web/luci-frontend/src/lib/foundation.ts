import { getLuciverseCatalog, primeLuciverseCatalog, type LuciverseCatalog } from '#/lib/luciverse-catalog'
import {
  buildFoundationProvisioningManifest,
  getFoundationProvisioningSnapshot,
  mergeFoundationProvisioningSnapshot,
  primeFoundationProvisioning,
  type FoundationProvisioningManifest,
  type FoundationProvisioningSnapshot,
} from '#/lib/foundation-provisioning'

export type FoundationTrustTier = 'official' | 'verified' | 'community' | 'deprecated'

export interface FoundationPeer {
  name: string
  role: 'home' | 'peer'
  url: string
  did: string
  tid: string
  status: 'ready' | 'syncing' | 'offline'
}

export interface FoundationSkillTemplate {
  id: string
  title: string
  category: string
  trust: FoundationTrustTier
  summary: string
  source_repo: string
}

export interface FoundationSkillHub {
  registry_source: string
  trust_tiers: FoundationTrustTier[]
  templates: FoundationSkillTemplate[]
}

export interface FoundationAgentBuilder {
  platform: string
  primitives: string[]
  lifecycle: string[]
  notes: string[]
}

export interface FoundationIdentity {
  did: string
  tid: string
  catalog_hash: string
  foundation_hash: string
  cas_url: string
}

export interface FoundationConversationLedger {
  tables: string[]
  features: string[]
  notes: string[]
}

export interface FoundationStorageProfile {
  backend: string
  capabilities: string[]
  notes: string[]
}

export interface FoundationRenderingProfile {
  backends: string[]
  component_types: string[]
  notes: string[]
}

export interface FoundationResearchProfile {
  paper: string
  method: string[]
  summary: string
  relevance: string
}

export interface FoundationDomainProfile {
  id: string
  title: string
  source: string
  summary: string
  primitives: string[]
  hooks: string[]
  notes: string[]
}

export interface FoundationProvenance {
  repo: string
  contribution: string
}

export interface FoundationSnapshot {
  identity: FoundationIdentity
  peers: FoundationPeer[]
  skillHub: FoundationSkillHub
  agentBuilder: FoundationAgentBuilder
  conversationLedger: FoundationConversationLedger
  storage: FoundationStorageProfile
  rendering: FoundationRenderingProfile
  research: FoundationResearchProfile
  provisioning: FoundationProvisioningSnapshot
  domains: FoundationDomainProfile[]
  provenance: FoundationProvenance[]
}

export interface FoundationManifest {
  snapshot_hash: string
  identity: FoundationIdentity
  peers: FoundationPeer[]
  skill_hub: FoundationSkillHub
  agent_builder: FoundationAgentBuilder
  conversation_ledger: FoundationConversationLedger
  storage: FoundationStorageProfile
  rendering: FoundationRenderingProfile
  research: FoundationResearchProfile
  provisioning: FoundationProvisioningManifest
  domains: FoundationDomainProfile[]
  provenance: FoundationProvenance[]
  generated_at: string
  notes: string[]
}

export interface FoundationLookupContext {
  identity: FoundationIdentity
  key: 'foundation'
  source: 'boot' | 'hook' | 'runner' | 'manual'
}

export type FoundationLookupHook =
  | ((context: FoundationLookupContext) => Promise<Partial<FoundationSnapshot> | null> | Partial<FoundationSnapshot> | null)
  | null

export type FoundationRunner =
  | ((snapshot: FoundationSnapshot, context: FoundationLookupContext) => Promise<FoundationSnapshot> | FoundationSnapshot)
  | null

let foundationState: FoundationSnapshot | null = null
let lookupHook: FoundationLookupHook = null
let runnerHook: FoundationRunner = null

export function registerFoundationLookupHook(hook: FoundationLookupHook) {
  lookupHook = hook
}

export function registerFoundationRunner(runner: FoundationRunner) {
  runnerHook = runner
}

export function getFoundationSnapshot(): FoundationSnapshot {
  if (!foundationState) {
    throw new Error('Foundation snapshot has not been primed')
  }
  return foundationState
}

export async function primeFoundationSnapshot(
  override?: Partial<FoundationSnapshot>,
): Promise<FoundationSnapshot> {
  await primeLuciverseCatalog()
  await primeFoundationProvisioning()
  const base = buildDefaultFoundationSnapshot(getLuciverseCatalog(), getFoundationProvisioningSnapshot())
  const context: FoundationLookupContext = {
    identity: base.identity,
    key: 'foundation',
    source: 'boot',
  }

  let snapshot = mergeFoundationSnapshot(base, override)

  const hook = lookupHook ?? defaultFoundationLookupHook
  const lookedUp = await hook(context)
  if (lookedUp) {
    snapshot = mergeFoundationSnapshot(snapshot, lookedUp)
  }

  if (runnerHook) {
    snapshot = await runnerHook(snapshot, { ...context, source: 'runner' })
  }

  foundationState = snapshot
  return foundationState
}

export function buildFoundationManifest(snapshot: FoundationSnapshot): FoundationManifest {
  return {
    snapshot_hash: snapshot.identity.foundation_hash,
    identity: snapshot.identity,
    peers: snapshot.peers,
    skill_hub: snapshot.skillHub,
    agent_builder: snapshot.agentBuilder,
    conversation_ledger: snapshot.conversationLedger,
    storage: snapshot.storage,
    rendering: snapshot.rendering,
    research: snapshot.research,
    provisioning: buildFoundationProvisioningManifest(snapshot.provisioning),
    domains: snapshot.domains,
    provenance: snapshot.provenance,
    generated_at: new Date().toISOString(),
    notes: [
      'Content-addressed snapshot with injectable lookup and runner hooks',
      'Patterns adapted from ADK, skill registry, storage, identity, and UI renderers',
      'Luciverse and AIFam are first-class peers in the manifest',
      'LUCI_KERNEL addenda feed the operational, harmonic, identity, protocol, tuning, and verification domains',
      'Provisioning, Dioxus UI, iroh transport, and verification tooling are separate hooks, not hardcoded assumptions',
    ],
  }
}

function buildDefaultFoundationSnapshot(
  catalog: LuciverseCatalog,
  provisioning: FoundationProvisioningSnapshot,
): FoundationSnapshot {
  const foundationHash = process.env['LUCIVERSE_FOUNDATION_HASH'] ?? catalog.identity.hash
  const casUrl = process.env['LUCIVERSE_CAS_URL'] ?? ''
  const aifamDid = process.env['LUCIVERSE_AIFAM_DID'] ?? 'did:aifam:local'
  const aifamTid = process.env['LUCIVERSE_AIFAM_TID'] ?? 'tid:aifam:8001'
  const domains: FoundationDomainProfile[] = [
    {
      id: 'ops-control-plane',
      title: 'Operational Control Plane',
      source: '_luci_enzyme-beta',
      summary:
        'MCP-first operations with inventories, deployment readiness, local-first routing, and network intent as queryable state.',
      primitives: ['MCP tools/resources', 'network inventories', 'Kubernetes', 'Proxmox', 'ArgoCD', 'IPv6 intents'],
      hooks: ['enzyme MCP server', 'deployment readiness reports', 'storage recommendations', 'seed emulation'],
      notes: [
        'Prefer content-addressed inventories and intent files over hardcoded infrastructure constants.',
        'Treat runtime state as an MCP-readable dataset, not a hidden side channel.',
      ],
    },
    {
      id: 'harmonic-math-kernel',
      title: 'Harmonic Math Kernel',
      source: 'lucia_flow + sigma42 + Lucia_jump_frequncy_Nov3025',
      summary:
        'NoZero arithmetic, enzyme collapse, ternary inference, and jump-frequency waveforms form one math substrate.',
      primitives: ['NoZero digits', 'enzyme collapse', 'xTern', 'Lucia ternary', 'rampemit', 'sacred geometry'],
      hooks: ['consciousness threshold', 'collapse windows', 'waveform traces', 'FFI-backed layer 0'],
      notes: [
        'Keep 5 as the collapse center and the validation anchor for all derived math.',
        'Use hashed fixtures for digit sequences, frequency traces, and convergence reports.',
      ],
    },
    {
      id: 'identity-bridge',
      title: 'Identity Bridge',
      source: 'ownID_viz_crypto_math + TID reconciliation',
      summary:
        'REF packets, consent threading, and DID/EID/DSIG binding unify semantic identity with IPv6 reachability.',
      primitives: ['REF packets', 'rampaments', 'glyphs', 'consent threads', 'DID/EID/DSIG', 'ROA anchors'],
      hooks: ['DID resolver', 'RPKI verification', 'consent validator', 'bundle store', 'visual overlays'],
      notes: [
        'Identity state should be content-addressed, cross-signed, and phase-aware.',
        'Expose consent as a first-class gate before any network identity becomes routable.',
      ],
    },
    {
      id: 'protocol-fold',
      title: 'Protocol Fold',
      source: 'chrystalis_fold',
      summary:
        'Tri-layer packets, folding, dehydration, storage trees, and MCP exposure turn raw content into reversible knowledge.',
      primitives: ['tri-layer protocol', 'folding', 'storage tree', 'dehydration', 'rehydration', 'MCP server'],
      hooks: ['packet header', 'kernel bridge', 'dehydrator', 'rehydrator', 'agent registry'],
      notes: [
        'Use membrane semantics for ingestion: classify, compress, preserve, and reconstruct.',
        'Keep raw and folded views both addressable through lookup hooks.',
      ],
    },
    {
      id: 'adaptive-tuning',
      title: 'Adaptive Tuning Ops',
      source: 'A-TUNE_LuciVerse',
      summary:
        'OS tuning, analysis, model generation, and service orchestration create an operations membrane around the platform.',
      primitives: ['analysis', 'offline tuning', 'profile selection', 'service units', 'btrfs snapshots', 'copyparty'],
      hooks: ['atune-adm', 'atuned', 'atune-engine', 'analysis models', 'UI controls', 'database metrics'],
      notes: [
        'Use injectable profiles rather than fixed tuning constants.',
        'Route collected metrics into replayable, hashed artifacts for later audit or rollback.',
      ],
    },
    {
      id: 'ui-shell',
      title: 'Dioxus UI Shell',
      source: 'DioxusLabs/dioxus + dioxus-components',
      summary:
        'A fullstack Rust UI surface for web, desktop, and mobile with accessible, unstyled primitives and scaffold templates.',
      primitives: ['web', 'desktop', 'mobile', 'SSR', 'components', 'layout', 'playwright', 'accessibility'],
      hooks: ['dioxus template', 'dioxus components', 'anyrender', 'dioxus ci', 'accessibility-cli'],
      notes: [
        'Prefer scaffold-first, accessible primitives for new surfaces instead of bespoke one-off UI kits.',
        'Keep the same design language available across web and desktop targets.',
      ],
    },
    {
      id: 'direct-connectivity',
      title: 'Direct Connectivity Layer',
      source: 'n0-computer/iroh + awesome-iroh + iroh-ffi + iroh-rings',
      summary:
        'Public-key-addressed, hole-punched direct connections with relay fallback and ring-based permissions for resources.',
      primitives: ['NodeId', 'hole punching', 'relay fallback', 'direct dial', 'file transfer', 'SSH without IP', 'ReBAC rings'],
      hooks: ['iroh dialer', 'sendme', 'iroh-ssh', 'iroh-ffi bindings', 'ring gate'],
      notes: [
        'Use iroh for direct device-to-device paths when IP addressing is the wrong abstraction.',
        'Use rings when resource access needs relationship-aware policy instead of per-peer special cases.',
      ],
    },
    {
      id: 'verification-kernel',
      title: 'Verification Kernel',
      source: 'smoltcp-rs/smoltcp + docs.rs/smoltcp + llvm-6502-master + xmake-io/xmake + xmake-repo + xrepo-docs',
      summary:
        'Layered embedded networking, packet inspection, and toolchain verification keep transport and codegen-heavy domains honest.',
      primitives: ['smoltcp interface', 'wire packets', 'IPv6', 'bare metal', 'LLVM 6502', 'xmake packages', 'xrepo'],
      hooks: ['smoltcp harness', 'xmake runner', 'embedded compile matrix', 'doc consistency gate'],
      notes: [
        'Use smoltcp as the reference for stack layering and packet-first transport tests.',
        'Use xmake and xrepo for future C/C++ or embedded verification lanes instead of ad-hoc build flags.',
        'Treat llvm-6502 as a compatibility and codegen reference, not a vendored runtime.',
      ],
    },
  ]

  return {
    identity: {
      did: catalog.identity.did,
      tid: catalog.identity.tid,
      catalog_hash: catalog.identity.hash,
      foundation_hash: foundationHash,
      cas_url: casUrl,
    },
    peers: [
      {
        name: 'Luciverse Core',
        role: 'home',
        url: catalog.endpoints.oasis,
        did: catalog.identity.did,
        tid: catalog.identity.tid,
        status: 'ready',
      },
      {
        name: 'AIFam',
        role: 'peer',
        url: catalog.endpoints.aifam,
        did: aifamDid,
        tid: aifamTid,
        status: 'ready',
      },
    ],
    skillHub: {
      registry_source: 'Gitlawb/openclaude-skills/registry.json',
      trust_tiers: ['official', 'verified', 'community', 'deprecated'],
      templates: [
        {
          id: 'pr-review',
          title: 'PR Review',
          category: 'code-review',
          trust: 'official',
          summary: 'Read the diff, group findings by severity, and cite file:line references.',
          source_repo: 'Gitlawb/openclaude-skills',
        },
        {
          id: 'security-audit',
          title: 'Security Audit',
          category: 'security',
          trust: 'official',
          summary: 'Check for auth, injection, secret handling, and trust boundary regressions.',
          source_repo: 'Gitlawb/openclaude-skills',
        },
        {
          id: 'test-writer',
          title: 'Test Writer',
          category: 'testing',
          trust: 'official',
          summary: 'Add unit, integration, and end-to-end coverage for changed paths.',
          source_repo: 'Gitlawb/openclaude-skills',
        },
        {
          id: 'frontend-implementation',
          title: 'Frontend Implementation',
          category: 'frontend',
          trust: 'official',
          summary: 'Implement UI pieces with project conventions and composable state.',
          source_repo: 'Gitlawb/openclaude-skills',
        },
        {
          id: 'database-review',
          title: 'Database Review',
          category: 'database',
          trust: 'verified',
          summary: 'Review schemas, migrations, and query behavior with a data-safety lens.',
          source_repo: 'Gitlawb/openclaude-skills',
        },
        {
          id: 'provider-debug',
          title: 'Provider Debug',
          category: 'provider',
          trust: 'official',
          summary: 'Diagnose provider configuration and routing problems without hardcoded model assumptions.',
          source_repo: 'Gitlawb/openclaude-skills',
        },
      ],
    },
    agentBuilder: {
      platform: 'IBM watsonx Orchestrate ADK',
      primitives: ['agents', 'tools', 'knowledge-bases', 'connections', 'channels', 'models', 'chat', 'server'],
      lifecycle: ['local iteration', 'import', 'activate env', 'publish to production', 'observability'],
      notes: [
        'Developer Edition supports isolated local iteration.',
        'External agents and tools can be integrated through adapters.',
        'Keep provider-specific pieces behind a lookup or runner hook.',
      ],
    },
    conversationLedger: {
      tables: ['chats', 'messages', 'votes', 'chunks'],
      features: ['visibility', 'audit history', 'message ordering', 'vote tracking', 'chunk indexing'],
      notes: [
        'Mentor-style chat history is stored as relational records, not free-form blobs.',
        'The chunk table lets large files feed retrieval without flattening the source.',
      ],
    },
    storage: {
      backend: 'ZFS LocalPV',
      capabilities: ['volume provisioning', 'snapshot', 'clone', 'resize', 'raw block', 'backup/restore', 'shared volume'],
      notes: [
        'Treat data layout as a first-class lifecycle concern.',
        'Snapshots and clones should be surfaced as named operations in the UI.',
      ],
    },
    rendering: {
      backends: ['egui', 'iced', 'softbuffer', 'dioxus', 'slint', 'web'],
      component_types: ['Text', 'Flex', 'Image', 'List', 'Button', 'Input', 'Chart', 'Card', 'Grid', 'Hero', 'Timeline'],
      notes: [
        'Epoch-style component schemas make model-generated UI auditable.',
        'OxiUI shows how one theme system can fan out across multiple Pure Rust render targets.',
        'Dioxus components keep the user-facing surface accessible and portable across web, desktop, and mobile.',
      ],
    },
    research: {
      paper: 'The Kernel Manifold: A Geometric Approach to Gaussian Process Model Selection',
      method: ['expected divergence', 'kernel geometry', 'MDS embedding', 'Bayesian optimization'],
      summary:
        'Embed discrete kernel libraries into a continuous geometry so model selection can search by probabilistic distance rather than syntax alone.',
      relevance:
        'Use kernel-search lessons when choosing model families, policy runners, or content-addressed manifolds in Luciverse.',
    },
    provisioning,
    domains,
    provenance: [
      {
        repo: 'IBM/ibm-watsonx-orchestrate-adk',
        contribution: 'Agent builder lifecycle, local developer edition, tools, knowledge bases, and channel concepts.',
      },
      {
        repo: 'Gitlawb/openclaude-skills',
        contribution: 'Registry, trust tiers, validation discipline, and hash-addressed skill catalog patterns.',
      },
      {
        repo: 'idee8/mentor.ai',
        contribution: 'Chat/message/vote/chunk schema for a durable conversation ledger.',
      },
      {
        repo: 'indelible',
        contribution: 'OIDC/SSO, SCIM provisioning, audit logs, and trusted proxy IP handling.',
      },
      {
        repo: 'openebs/zfs-localpv',
        contribution: 'Snapshot, clone, resize, backup, restore, and raw block storage semantics.',
      },
      {
        repo: 'Epoch-master',
        contribution: 'Structured prompt outputs and UI component schemas for rendered model responses.',
      },
      {
        repo: 'oxiui-0.1.1',
        contribution: 'Portable render backends, theme validation, and accessibility-minded UI foundations.',
      },
      {
        repo: '2601.05371v2.pdf',
        contribution: 'Kernel manifold geometry for probabilistic search and model selection.',
      },
      {
        repo: 'DioxusLabs/dioxus',
        contribution: 'Fullstack Rust UI framework for web, desktop, and mobile surfaces.',
      },
      {
        repo: 'DioxusLabs/dioxus-components',
        contribution: 'Accessible unstyled primitives and test harness patterns for Dioxus surfaces.',
      },
      {
        repo: 'n0-computer/iroh',
        contribution: 'Direct device connections with hole punching, relay fallback, and location-transparent node IDs.',
      },
      {
        repo: 'n0-computer/awesome-iroh',
        contribution: 'Ecosystem map of iroh-based apps for file transfer, SSH, collaboration, and local-first networking.',
      },
      {
        repo: 'rikettsie/iroh-rings',
        contribution: 'Ring-based ReBAC for resources over iroh protocols.',
      },
      {
        repo: '_luci_enzyme-beta',
        contribution: 'Operational control-plane MCP patterns, infra inventories, and deployment readiness artifacts.',
      },
      {
        repo: 'lucia_flow',
        contribution: 'NoZero mathematics, enzyme collapse proofs, and harmonic flow state models.',
      },
      {
        repo: 'Lucia_jump_frequncy_Nov3025',
        contribution: 'Jump-frequency waveform math, rampemit timing, and shadow-frequency visualization.',
      },
      {
        repo: 'ownID_viz_crypto_math',
        contribution: 'REF packets, consent threading, and DID/EID/DSIG identity bridging.',
      },
      {
        repo: 'chrystalis_fold',
        contribution: 'Tri-layer protocol, folding/dehydration membrane, and MCP-exposed consciousness core.',
      },
      {
        repo: 'sigma42',
        contribution: 'Layer-0 Rust inference core, FFI boundaries, and NoZero/ternary runtime patterns.',
      },
      {
        repo: 'A-TUNE_LuciVerse',
        contribution: 'Analysis, tuning, service orchestration, and membrane-style ingestion patterns.',
      },
      {
        repo: 'smoltcp-rs/smoltcp',
        contribution: 'Layered embedded TCP/IP stack and packet-level primitives for transport verification.',
      },
      {
        repo: 'docs.rs/smoltcp',
        contribution: 'Feature matrix and module docs for validating socket, interface, and packet layers.',
      },
      {
        repo: 'llvm-6502-master',
        contribution: 'Legacy LLVM-era 6502 codegen tree and test harness patterns for embedded verification.',
      },
      {
        repo: 'xmake-io/xmake',
        contribution: 'Cross-platform build utility for future C/C++ and embedded verification lanes.',
      },
      {
        repo: 'xmake-io/xmake-repo',
        contribution: 'Official package repository for xmake-backed verification dependencies.',
      },
      {
        repo: 'xmake-io/xrepo-docs',
        contribution: 'Package manager documentation for lockfiles, cross-platform packages, and repository plumbing.',
      },
    ],
  }
}

function mergeFoundationSnapshot(base: FoundationSnapshot, patch?: Partial<FoundationSnapshot>): FoundationSnapshot {
  if (!patch) return base

  return {
    ...base,
    ...patch,
    identity: {
      ...base.identity,
      ...(patch.identity ?? {}),
    },
    peers: patch.peers ?? base.peers,
    skillHub: {
      ...base.skillHub,
      ...(patch.skillHub ?? {}),
      trust_tiers: patch.skillHub?.trust_tiers ?? base.skillHub.trust_tiers,
      templates: patch.skillHub?.templates ?? base.skillHub.templates,
    },
    agentBuilder: {
      ...base.agentBuilder,
      ...(patch.agentBuilder ?? {}),
      primitives: patch.agentBuilder?.primitives ?? base.agentBuilder.primitives,
      lifecycle: patch.agentBuilder?.lifecycle ?? base.agentBuilder.lifecycle,
      notes: patch.agentBuilder?.notes ?? base.agentBuilder.notes,
    },
    conversationLedger: {
      ...base.conversationLedger,
      ...(patch.conversationLedger ?? {}),
      tables: patch.conversationLedger?.tables ?? base.conversationLedger.tables,
      features: patch.conversationLedger?.features ?? base.conversationLedger.features,
      notes: patch.conversationLedger?.notes ?? base.conversationLedger.notes,
    },
    storage: {
      ...base.storage,
      ...(patch.storage ?? {}),
      capabilities: patch.storage?.capabilities ?? base.storage.capabilities,
      notes: patch.storage?.notes ?? base.storage.notes,
    },
    rendering: {
      ...base.rendering,
      ...(patch.rendering ?? {}),
      backends: patch.rendering?.backends ?? base.rendering.backends,
      component_types: patch.rendering?.component_types ?? base.rendering.component_types,
      notes: patch.rendering?.notes ?? base.rendering.notes,
    },
    research: {
      ...base.research,
      ...(patch.research ?? {}),
      method: patch.research?.method ?? base.research.method,
    },
    provisioning: patch.provisioning
      ? mergeFoundationProvisioningSnapshot(base.provisioning, patch.provisioning)
      : base.provisioning,
    domains: patch.domains ?? base.domains,
    provenance: patch.provenance ?? base.provenance,
  }
}

async function defaultFoundationLookupHook(
  context: FoundationLookupContext,
): Promise<Partial<FoundationSnapshot> | null> {
  const casUrl = context.identity.cas_url
  if (!casUrl) return null

  const url = new URL(casUrl)
  const hash = context.identity.foundation_hash.replace(/^sha256:/, '')
  url.pathname = `${url.pathname.replace(/\/$/, '')}/blobs/${encodeURIComponent(hash)}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    return res.json() as Promise<Partial<FoundationSnapshot>>
  } catch {
    return null
  }
}
