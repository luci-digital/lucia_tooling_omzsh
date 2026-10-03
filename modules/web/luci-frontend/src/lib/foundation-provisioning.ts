export interface FoundationProvisioningIdentity {
  did: string
  tid: string
  catalog_hash: string
  provisioning_hash: string
  cas_url: string
}

export interface FoundationProvisioningDomainProfile {
  id: string
  title: string
  source: string
  summary: string
  primitives: string[]
  hooks: string[]
  notes: string[]
}

export interface FoundationProvisioningProvenance {
  repo: string
  contribution: string
}

export interface FoundationProvisioningSnapshot {
  identity: FoundationProvisioningIdentity
  domain: FoundationProvisioningDomainProfile
  provenance: FoundationProvisioningProvenance[]
  notes: string[]
}

export interface FoundationProvisioningManifest {
  snapshot_hash: string
  identity: FoundationProvisioningIdentity
  domain: FoundationProvisioningDomainProfile
  provenance: FoundationProvisioningProvenance[]
  generated_at: string
  notes: string[]
}

export interface FoundationProvisioningLookupContext {
  identity: FoundationProvisioningIdentity
  key: 'provisioning'
  source: 'boot' | 'hook' | 'runner' | 'manual'
}

export type FoundationProvisioningLookupHook =
  | ((context: FoundationProvisioningLookupContext) => Promise<Partial<FoundationProvisioningSnapshot> | null> | Partial<FoundationProvisioningSnapshot> | null)
  | null

export type FoundationProvisioningRunner =
  | ((snapshot: FoundationProvisioningSnapshot, context: FoundationProvisioningLookupContext) => Promise<FoundationProvisioningSnapshot> | FoundationProvisioningSnapshot)
  | null

let provisioningState: FoundationProvisioningSnapshot | null = null
let lookupHook: FoundationProvisioningLookupHook = null
let runnerHook: FoundationProvisioningRunner = null

export function registerFoundationProvisioningLookupHook(hook: FoundationProvisioningLookupHook) {
  lookupHook = hook
}

export function registerFoundationProvisioningRunner(runner: FoundationProvisioningRunner) {
  runnerHook = runner
}

export function getFoundationProvisioningSnapshot(): FoundationProvisioningSnapshot {
  if (!provisioningState) {
    throw new Error('Foundation provisioning snapshot has not been primed')
  }

  return provisioningState
}

export function getFoundationProvisioningDomain(): FoundationProvisioningDomainProfile {
  return getFoundationProvisioningSnapshot().domain
}

export function buildFoundationProvisioningManifest(snapshot: FoundationProvisioningSnapshot): FoundationProvisioningManifest {
  return {
    snapshot_hash: snapshot.identity.provisioning_hash,
    identity: snapshot.identity,
    domain: snapshot.domain,
    provenance: snapshot.provenance,
    generated_at: new Date().toISOString(),
    notes: [
      'Runner-backed sovereign provisioning schema with injectable CAS/DID/TID resolution',
      'Provisioning is split from the main foundation snapshot so the bootstrap contract can evolve independently',
      'Content-addressed lookups can be swapped without changing the base Luciverse manifest',
    ],
  }
}

export async function primeFoundationProvisioning(
  override?: Partial<FoundationProvisioningSnapshot>,
): Promise<FoundationProvisioningSnapshot> {
  const base = buildDefaultFoundationProvisioningSnapshot()
  const context: FoundationProvisioningLookupContext = {
    identity: base.identity,
    key: 'provisioning',
    source: 'boot',
  }

  let snapshot = mergeFoundationProvisioningSnapshot(base, override)

  const hook = lookupHook ?? defaultFoundationProvisioningLookupHook
  const lookedUp = await hook(context)
  if (lookedUp) {
    snapshot = mergeFoundationProvisioningSnapshot(snapshot, lookedUp)
  }

  if (runnerHook) {
    snapshot = await runnerHook(snapshot, { ...context, source: 'runner' })
  }

  provisioningState = snapshot
  return provisioningState
}

function buildDefaultFoundationProvisioningSnapshot(): FoundationProvisioningSnapshot {
  const catalogHash = process.env['LUCIVERSE_CATALOG_HASH'] ?? 'sha256:luciverse-default-catalog-2026-06-07'
  const provisioningHash = process.env['LUCIVERSE_PROVISIONING_HASH'] ?? 'sha256:claude-lucia-provision-6726'
  const casUrl = process.env['LUCIVERSE_PROVISIONING_CAS_URL'] ?? ''
  const did = process.env['LUCIVERSE_PROVISIONING_DID'] ?? 'did:ip6:2602:f674:0000:0200::1'
  const tid = process.env['LUCIVERSE_PROVISIONING_TID'] ?? 'tid:provisioning:741'

  return {
    identity: {
      did,
      tid,
      catalog_hash: catalogHash,
      provisioning_hash: provisioningHash,
      cas_url: casUrl,
    },
    domain: {
      id: 'sovereign-provisioning',
      title: 'Sovereign Provisioning Fabric',
      source: 'claude_lucia_provision-6726.txt',
      summary:
        'USB boot, YubiKey attestation, MAC/UID genesis, certificate issuance, and RF callback are resolved through a content-addressed bootstrap contract.',
      primitives: ['USB provisioning', 'YubiKey attestation', 'MAC/UID', 'DID genesis', 'certificates', 'content hashes', 'RF callback'],
      hooks: ['lookup hook', 'runner hook', 'provisioning manifest', 'NixOS ISO builder', 'hash resolver'],
      notes: [
        'Treat provisioning policy as a content-addressed schema, not a BIOS one-off or a fixed constant.',
        'The bootstrap path must remain injectable so remote, offline, and attested boot flows can all share the same contract.',
      ],
    },
    provenance: [
      {
        repo: 'claude_lucia_provision-6726.txt',
        contribution: 'Sovereign boot transcript covering USB provisioning, attestation, certificate issuance, and RF callbacks.',
      },
      {
        repo: 'modules/docs/specs/did-handles.md',
        contribution: 'Dial-by-being identity and Iroh-based resolution contract for provisioning-linked handles.',
      },
    ],
    notes: [
      'Provisioning state is runner-backed and content-addressed.',
      'IPv6 DID/TID identity anchors the bootstrap path before the rest of the Luciverse manifest resolves.',
      'CAS lookups can override the default snapshot without changing the bootstrap schema.',
    ],
  }
}

export function mergeFoundationProvisioningSnapshot(
  base: FoundationProvisioningSnapshot,
  patch?: Partial<FoundationProvisioningSnapshot>,
): FoundationProvisioningSnapshot {
  if (!patch) return base

  return {
    ...base,
    ...patch,
    identity: {
      ...base.identity,
      ...(patch.identity ?? {}),
    },
    domain: {
      ...base.domain,
      ...(patch.domain ?? {}),
    },
    provenance: patch.provenance ?? base.provenance,
    notes: patch.notes ?? base.notes,
  }
}

async function defaultFoundationProvisioningLookupHook(
  context: FoundationProvisioningLookupContext,
): Promise<Partial<FoundationProvisioningSnapshot> | null> {
  const casUrl = context.identity.cas_url
  if (!casUrl) return null

  const url = new URL(casUrl)
  const hash = context.identity.provisioning_hash.replace(/^sha256:/, '')
  url.pathname = `${url.pathname.replace(/\/$/, '')}/blobs/${encodeURIComponent(hash)}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    return res.json() as Promise<Partial<FoundationProvisioningSnapshot>>
  } catch {
    return null
  }
}
