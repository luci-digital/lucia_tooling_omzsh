import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { getLuciverseCatalog, primeLuciverseCatalog } from '#/lib/luciverse-catalog'
import {
  buildFoundationManifest,
  getFoundationSnapshot,
  primeFoundationSnapshot,
  type FoundationDomainProfile,
  type FoundationSkillTemplate,
} from '#/lib/foundation'

export const Route = createFileRoute('/foundations')({
  loader: async () => {
    await primeLuciverseCatalog()
    await primeFoundationSnapshot()
    return {
      catalog: getLuciverseCatalog(),
      foundation: getFoundationSnapshot(),
    }
  },
  component: FoundationsPage,
})

export default function FoundationsPage() {
  const { catalog, foundation } = Route.useLoaderData()
  const [copied, setCopied] = useState(false)
  const manifest = buildFoundationManifest(foundation)
  const manifestText = JSON.stringify(manifest, null, 2)

  async function copyManifest() {
    try {
      await navigator.clipboard.writeText(manifestText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="island-kicker mb-1">content-addressed foundation</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            Foundations
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            DID {foundation.identity.did} · TID {foundation.identity.tid} · snapshot {foundation.identity.foundation_hash}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyManifest}
            className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
          >
            {copied ? 'Copied' : 'Copy manifest'}
          </button>
          <Link
            to="/workbench"
            className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            Workbench
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Snapshot" value={foundation.identity.foundation_hash} tone="#4fb8b2" />
        <MetricCard label="Peers" value={`${foundation.peers.length} linked`} tone="#9370db" />
        <MetricCard label="Skills" value={`${foundation.skillHub.templates.length} templates`} tone="#00d4ff" />
        <MetricCard label="Renderers" value={`${foundation.rendering.backends.length} backends`} tone="#ff9500" />
        <MetricCard label="Domains" value={`${foundation.domains.length} adaptive inputs`} tone="#ff6b35" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="flex flex-col gap-4">
          <SectionCard title="Identity And Peer Mesh" kicker="CID / DID / TID">
            <div className="grid gap-3 lg:grid-cols-2">
              <InfoRow label="Catalog hash" value={foundation.identity.catalog_hash} />
              <InfoRow label="Foundation hash" value={foundation.identity.foundation_hash} />
              <InfoRow label="CAS URL" value={foundation.identity.cas_url || 'not configured'} />
              <InfoRow label="AIFam endpoint" value={catalog.endpoints.aifam} />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {foundation.peers.map((peer) => (
                <div key={peer.name} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--sea-ink)]">{peer.name}</p>
                      <p className="text-xs text-[var(--sea-ink-soft)]">{peer.role}</p>
                    </div>
                    <span className="rounded-full bg-[rgba(79,184,178,0.12)] px-2 py-0.5 font-mono text-[10px] uppercase text-[#4fb8b2]">
                      {peer.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-[var(--sea-ink-soft)]">
                    <span className="break-all">URL: {peer.url}</span>
                    <span className="break-all">DID: {peer.did}</span>
                    <span className="break-all">TID: {peer.tid}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Provisioning Fabric" kicker="runner-backed bootstrap">
            <div className="grid gap-3 lg:grid-cols-2">
              <InfoRow label="Provisioning DID" value={foundation.provisioning.identity.did} />
              <InfoRow label="Provisioning TID" value={foundation.provisioning.identity.tid} />
              <InfoRow label="Provisioning hash" value={foundation.provisioning.identity.provisioning_hash} />
              <InfoRow label="Provisioning CAS" value={foundation.provisioning.identity.cas_url || 'not configured'} />
            </div>

            <div className="mt-4">
              <DomainCard domain={foundation.provisioning.domain} />
            </div>
          </SectionCard>

          <SectionCard title="Skill Hub" kicker="openclaude-skills patterns">
            <div className="flex flex-wrap gap-1.5">
              {foundation.skillHub.trust_tiers.map((tier) => (
                <span
                  key={tier}
                  className="rounded-lg border border-[var(--line)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]"
                >
                  {tier}
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              {foundation.skillHub.templates.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Agent Builder" kicker="IBM watsonx Orchestrate ADK">
            <p className="text-sm text-[var(--sea-ink-soft)]">{foundation.agentBuilder.platform}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {foundation.agentBuilder.primitives.map((item) => (
                <span key={item} className="rounded-full bg-[rgba(147,112,219,0.12)] px-2 py-0.5 font-mono text-[10px] text-[#9370db]">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {foundation.agentBuilder.lifecycle.map((step) => (
                <div key={step} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
                  {step}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {foundation.agentBuilder.notes.map((note) => (
                <div key={note} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
                  {note}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Conversation Ledger" kicker="mentor.ai schema">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]">Tables</p>
                <div className="flex flex-wrap gap-1.5">
                  {foundation.conversationLedger.tables.map((table) => (
                    <span key={table} className="rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--sea-ink-soft)]">
                      {table}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {foundation.conversationLedger.features.map((feature) => (
                    <span key={feature} className="rounded-full bg-[rgba(79,184,178,0.12)] px-2 py-1 font-mono text-[10px] text-[#4fb8b2]">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {foundation.conversationLedger.notes.map((note) => (
                <div key={note} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
                  {note}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Storage Policy" kicker="ZFS LocalPV">
            <p className="text-sm text-[var(--sea-ink-soft)]">{foundation.storage.backend}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {foundation.storage.capabilities.map((capability) => (
                <span key={capability} className="rounded-full bg-[rgba(255,149,0,0.12)] px-2 py-0.5 font-mono text-[10px] text-[#ff9500]">
                  {capability}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {foundation.storage.notes.map((note) => (
                <div key={note} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
                  {note}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Rendering Matrix" kicker="Epoch and OxiUI">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]">Backends</p>
                <div className="flex flex-wrap gap-1.5">
                  {foundation.rendering.backends.map((backend) => (
                    <span key={backend} className="rounded-full bg-[rgba(124,92,191,0.12)] px-2 py-1 font-mono text-[10px] text-[#9370db]">
                      {backend}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]">Components</p>
                <div className="flex flex-wrap gap-1.5">
                  {foundation.rendering.component_types.map((component) => (
                    <span key={component} className="rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--sea-ink-soft)]">
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {foundation.rendering.notes.map((note) => (
                <div key={note} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
                  {note}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Research Kernel" kicker="arXiv 2601.05371v2">
            <p className="text-sm font-semibold text-[var(--sea-ink)]">{foundation.research.paper}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {foundation.research.method.map((method) => (
                <span key={method} className="rounded-full bg-[rgba(79,184,178,0.12)] px-2 py-1 font-mono text-[10px] text-[#4fb8b2]">
                  {method}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">{foundation.research.summary}</p>
            <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{foundation.research.relevance}</p>
          </SectionCard>

          <SectionCard title="LUCI Kernel Addenda" kicker="LUCI_KERNEL sources">
            <div className="grid gap-3">
              {foundation.domains.map((domain) => (
                <DomainCard key={domain.id} domain={domain} />
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-3">Manifest Preview</p>
          <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[rgba(6,12,11,0.88)] p-4 text-[11px] leading-5 text-[var(--sea-ink)]">{manifestText}</pre>

          <p className="island-kicker mb-3 mt-5">Provenance</p>
          <div className="flex flex-col gap-2">
            {foundation.provenance.map((entry) => (
              <div key={entry.repo} className="rounded-xl border border-[var(--line)] px-3 py-2">
                <p className="font-semibold text-[var(--sea-ink)]">{entry.repo}</p>
                <p className="text-xs text-[var(--sea-ink-soft)]">{entry.contribution}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="island-shell rounded-2xl p-4">
      <p className="island-kicker mb-2">{label}</p>
      <p className="text-base font-semibold text-[var(--sea-ink)]" style={{ color: tone }}>
        {value}
      </p>
    </div>
  )
}

function SectionCard({
  title,
  kicker,
  children,
}: {
  title: string
  kicker: string
  children: ReactNode
}) {
  return (
    <section className="island-shell rounded-2xl p-5">
      <p className="island-kicker mb-1">{kicker}</p>
      <h2 className="mb-4 text-xl font-bold text-[var(--sea-ink)]">{title}</h2>
      {children}
    </section>
  )
}

function DomainCard({ domain }: { domain: FoundationDomainProfile }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--sea-ink)]">{domain.title}</p>
          <p className="text-xs text-[var(--sea-ink-soft)]">{domain.source}</p>
        </div>
        <span className="rounded-full bg-[rgba(255,107,53,0.12)] px-2 py-0.5 font-mono text-[10px] uppercase text-[#ff6b35]">
          {domain.id}
        </span>
      </div>

      <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">{domain.summary}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]">Primitives</p>
          <div className="flex flex-wrap gap-1.5">
            {domain.primitives.map((primitive) => (
              <span key={primitive} className="rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--sea-ink-soft)]">
                {primitive}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sea-ink-soft)]">Hooks</p>
          <div className="flex flex-wrap gap-1.5">
            {domain.hooks.map((hook) => (
              <span key={hook} className="rounded-full bg-[rgba(79,184,178,0.12)] px-2 py-1 font-mono text-[10px] text-[#4fb8b2]">
                {hook}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {domain.notes.map((note) => (
          <div key={note} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
            {note}
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] px-3 py-2">
      <p className="text-xs text-[var(--sea-ink-soft)]">{label}</p>
      <p className="break-all font-mono text-xs font-semibold text-[var(--sea-ink)]">{value}</p>
    </div>
  )
}

function SkillCard({ skill }: { skill: FoundationSkillTemplate }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--sea-ink)]">{skill.title}</p>
          <p className="text-xs text-[var(--sea-ink-soft)]">{skill.summary}</p>
        </div>
        <span className="rounded-full bg-[rgba(147,112,219,0.12)] px-2 py-0.5 font-mono text-[10px] uppercase text-[#9370db]">
          {skill.trust}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--sea-ink-soft)]">
        <span className="rounded-full border border-[var(--line)] px-2 py-1">
          {skill.category}
        </span>
        <span className="rounded-full border border-[var(--line)] px-2 py-1">
          {skill.source_repo}
        </span>
        <span className="rounded-full border border-[var(--line)] px-2 py-1">
          {skill.id}
        </span>
      </div>
    </div>
  )
}
