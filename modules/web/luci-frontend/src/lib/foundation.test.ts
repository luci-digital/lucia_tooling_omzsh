import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFoundationManifest, getFoundationSnapshot, primeFoundationSnapshot } from './foundation'
import {
  getFoundationProvisioningSnapshot,
  primeFoundationProvisioning,
  registerFoundationProvisioningLookupHook,
  registerFoundationProvisioningRunner,
} from './foundation-provisioning'

describe('foundation provisioning', () => {
  beforeEach(() => {
    vi.stubEnv('LUCIVERSE_CAS_URL', '')
    vi.stubEnv('LUCIVERSE_CATALOG_HASH', 'sha256:test-catalog')
    vi.stubEnv('LUCIVERSE_FOUNDATION_HASH', 'sha256:test-foundation')
    vi.stubEnv('LUCIVERSE_DID', 'did:ip6:2602:f674:0000:0201::1')
    vi.stubEnv('LUCIVERSE_TID', 'tid:luciverse:741')
    vi.stubEnv('LUCIVERSE_AIFAM_URL', 'http://localhost:8001')
    vi.stubEnv('LUCIVERSE_AIFAM_DID', 'did:aifam:local')
    vi.stubEnv('LUCIVERSE_AIFAM_TID', 'tid:aifam:8001')
    vi.stubEnv('LUCIVERSE_PROVISIONING_CAS_URL', '')
    vi.stubEnv('LUCIVERSE_PROVISIONING_HASH', 'sha256:test-provisioning')
    vi.stubEnv('LUCIVERSE_PROVISIONING_DID', 'did:ip6:2602:f674:0000:0200::1')
    vi.stubEnv('LUCIVERSE_PROVISIONING_TID', 'tid:provisioning:741')
    registerFoundationProvisioningLookupHook(null)
    registerFoundationProvisioningRunner(null)
  })

  afterEach(() => {
    registerFoundationProvisioningLookupHook(null)
    registerFoundationProvisioningRunner(null)
    vi.unstubAllEnvs()
  })

  it('resolves provisioning through injectable hooks and runner', async () => {
    registerFoundationProvisioningLookupHook(() => ({
      identity: {
        provisioning_hash: 'sha256:hooked-provisioning',
      },
      domain: {
        summary: 'Hooked provisioning summary',
      },
    }))
    registerFoundationProvisioningRunner(async (snapshot) => ({
      ...snapshot,
      notes: [...snapshot.notes, 'runner-applied'],
    }))

    await primeFoundationProvisioning()

    const provisioning = getFoundationProvisioningSnapshot()
    expect(provisioning.identity.provisioning_hash).toBe('sha256:hooked-provisioning')
    expect(provisioning.domain.summary).toBe('Hooked provisioning summary')
    expect(provisioning.notes).toContain('runner-applied')
  })

  it('keeps provisioning separate from the main domain catalog', async () => {
    await primeFoundationSnapshot()
    const foundation = getFoundationSnapshot()
    const domainIds = foundation.domains.map((domain) => domain.id)

    expect(foundation.provisioning.domain.id).toBe('sovereign-provisioning')
    expect(domainIds).not.toContain('sovereign-provisioning')
    expect(domainIds).toContain('verification-kernel')

    const manifest = buildFoundationManifest(foundation)
    expect(manifest.provisioning.snapshot_hash).toBe(foundation.provisioning.identity.provisioning_hash)
  })

  it('documents the protocol layer inputs', () => {
    const protocolDoc = readFileSync(
      new URL('../../../../docs/specs/luciverse-protocol.md', import.meta.url),
      'utf8',
    )

    expect(protocolDoc).toContain('Dioxus')
    expect(protocolDoc).toContain('iroh')
    expect(protocolDoc).toContain('smoltcp')
    expect(protocolDoc).toContain('xmake')
    expect(protocolDoc).toContain('LLVM-6502')
  })
})
