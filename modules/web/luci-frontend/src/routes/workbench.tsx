import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { buildWorkbenchManifest, type WorkbenchSession } from '#/lib/workbench'
import { primeLuciverseCatalog, getLuciverseCatalog, type LuciverseCatalog } from '#/lib/luciverse-catalog'

export const Route = createFileRoute('/workbench')({
  loader: async () => {
    await primeLuciverseCatalog()
    return { catalog: getLuciverseCatalog() }
  },
  component: WorkbenchPage,
})

type WorkbenchData = LuciverseCatalog['workbench']

const STATUS_STYLES: Record<WorkbenchSession['status'], string> = {
  active: 'bg-[rgba(79,184,178,0.15)] text-[var(--sea-ink)]',
  paused: 'bg-[rgba(255,149,0,0.14)] text-[var(--sea-ink)]',
  ready: 'bg-[rgba(124,92,191,0.14)] text-[var(--sea-ink)]',
}

const MCP_STYLES: Record<WorkbenchData['mcpServers'][number]['status'], string> = {
  ready: 'bg-[rgba(79,184,178,0.15)] text-[var(--sea-ink)]',
  syncing: 'bg-[rgba(255,149,0,0.14)] text-[var(--sea-ink)]',
  offline: 'bg-[rgba(255,68,68,0.14)] text-[var(--sea-ink)]',
}

const EVENT_STYLES: Record<WorkbenchData['timeline'][number]['kind'], string> = {
  session: '#4fb8b2',
  compose: '#9370db',
  mcp: '#00d4ff',
  export: '#ff9500',
}

export default function WorkbenchPage() {
  const { catalog } = Route.useLoaderData()
  const workbench = catalog.workbench
  const [selectedSessionId, setSelectedSessionId] = useState(workbench.sessions[0].id)
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(workbench.blueprints[0].id)
  const [copied, setCopied] = useState(false)

  const selectedSession = workbench.sessions.find((session) => session.id === selectedSessionId) ?? workbench.sessions[0]
  const selectedBlueprint = workbench.blueprints.find((blueprint) => blueprint.id === selectedBlueprintId) ?? workbench.blueprints[0]
  const manifest = buildWorkbenchManifest(selectedSession, selectedBlueprint)
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
          <p className="island-kicker mb-1">opcode · CRAIG · Luciverse</p>
          <h1 className="display-title m-0 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            Workbench
          </h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Project sessions, MCP registry, and provider-neutral infrastructure plans.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/mission-control"
            className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            Mission Control
          </Link>
          <Link
            to="/compliance"
            className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            Compliance
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sessions" value={`${workbench.sessions.length} tracked`} tone="#4fb8b2" />
        <MetricCard label="Blueprints" value={`${workbench.blueprints.length} ready`} tone="#9370db" />
        <MetricCard label="MCP Servers" value={`${workbench.mcpServers.length} registered`} tone="#00d4ff" />
        <MetricCard label="Export Targets" value={manifest.exports.join(' · ')} tone="#ff9500" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.3fr_0.9fr]">
        <section className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-3">Project Sessions</p>
          <div className="flex flex-col gap-2">
            {workbench.sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
                className={[
                  'rounded-2xl border px-4 py-3 text-left transition',
                  selectedSession.id === session.id
                    ? 'border-[rgba(79,184,178,0.35)] bg-[rgba(79,184,178,0.08)]'
                    : 'border-[var(--line)] bg-transparent hover:bg-[var(--link-bg-hover)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--sea-ink)]">{session.project}</p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">{session.focus}</p>
                  </div>
                  <span className={['shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase', STATUS_STYLES[session.status]].join(' ')}>
                    {session.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--sea-ink-soft)]">
                  <span>Branch: {session.branch}</span>
                  <span>Owner: {session.owner}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
            <p className="island-kicker mb-2">Selected Session</p>
            <div className="grid gap-2 text-sm">
              <InfoRow label="Project" value={selectedSession.project} />
              <InfoRow label="Owner" value={selectedSession.owner} />
              <InfoRow label="Focus" value={selectedSession.focus} />
              <InfoRow label="Updated" value={new Date(selectedSession.lastUpdated).toLocaleString()} />
              <InfoRow label="Branch" value={selectedSession.branch} />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sea-ink-soft)]">
                Checkpoints
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSession.checkpoints.map((checkpoint) => (
                  <span
                    key={checkpoint}
                    className="rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[10px] text-[var(--sea-ink-soft)]"
                  >
                    {checkpoint}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-3">Infrastructure Composer</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {workbench.blueprints.map((blueprint) => (
              <button
                key={blueprint.id}
                type="button"
                onClick={() => setSelectedBlueprintId(blueprint.id)}
                className={[
                  'rounded-2xl border p-4 text-left transition',
                  selectedBlueprint.id === blueprint.id
                    ? 'border-[rgba(147,112,219,0.35)] bg-[rgba(147,112,219,0.08)]'
                    : 'border-[var(--line)] bg-transparent hover:bg-[var(--link-bg-hover)]',
                ].join(' ')}
              >
                <p className="font-semibold text-[var(--sea-ink)]">{blueprint.title}</p>
                <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{blueprint.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {blueprint.exports.map((format) => (
                    <span
                      key={format}
                      className="rounded-full bg-[rgba(79,184,178,0.12)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-[#4fb8b2]"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="island-kicker mb-1">{selectedBlueprint.id}</p>
                  <h2 className="m-0 text-xl font-bold text-[var(--sea-ink)]">{selectedBlueprint.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={copyManifest}
                  className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-xs font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
                >
                  {copied ? 'Copied' : 'Copy manifest'}
                </button>
              </div>
              <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">{selectedBlueprint.summary}</p>

              <div className="mt-4 grid gap-2">
                {selectedBlueprint.resources.map((resource) => (
                  <div
                    key={resource.name}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-[var(--sea-ink)]">{resource.name}</p>
                      <p className="text-xs text-[var(--sea-ink-soft)]">{resource.purpose}</p>
                    </div>
                    <div className="text-right font-mono text-xs text-[var(--sea-ink-soft)]">
                      <p>{resource.type}</p>
                      <p>x{resource.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--sea-ink-soft)]">
                  Manifest Preview
                </p>
                <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[rgba(6,12,11,0.88)] p-4 text-[11px] leading-5 text-[var(--sea-ink)]">{manifestText}</pre>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
              <p className="island-kicker mb-3">Output Targets</p>
              <div className="flex flex-col gap-2">
                {selectedBlueprint.outputs.map((output) => (
                  <div
                    key={output}
                    className="rounded-xl border border-[var(--line)] px-3 py-2 font-mono text-xs text-[var(--sea-ink-soft)]"
                  >
                    {output}
                  </div>
                ))}
              </div>

              <p className="island-kicker mb-3 mt-5">Agent Lanes</p>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'judge-luci', label: 'Governance' },
                  { id: 'veritas', label: 'Verification' },
                  { id: 'lucia', label: 'Orchestration' },
                  { id: 'juniper', label: 'Knowledge' },
                ].map((lane) => (
                  <div
                    key={lane.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2"
                  >
                    <span className="font-mono text-xs text-[var(--sea-ink)]">{lane.id}</span>
                    <span className="font-mono text-[10px] text-[var(--sea-ink-soft)]">{lane.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-3">MCP Registry</p>
          <div className="flex flex-col gap-2">
            {workbench.mcpServers.map((server) => (
              <div key={server.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--sea-ink)]">{server.name}</p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">{server.purpose}</p>
                  </div>
                  <span className={['shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase', MCP_STYLES[server.status]].join(' ')}>
                    {server.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-[10px] font-mono text-[var(--sea-ink-soft)]">
                  <span>Transport: {server.transport}</span>
                  <span>Endpoint: {server.endpoint}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
            <p className="island-kicker mb-2">Session Pulse</p>
            <div className="flex flex-col gap-2">
              {workbench.timeline.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: EVENT_STYLES[event.kind] }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--sea-ink)]">{event.title}</p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="island-shell mt-4 rounded-2xl p-5">
        <p className="island-kicker mb-3">Timeline & Checkpoints</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {workbench.timeline.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-2xl border border-[var(--line)] px-4 py-3"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: EVENT_STYLES[event.kind] }}
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-semibold text-[var(--sea-ink)]">{event.title}</p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--sea-ink-soft)]">
                    {event.kind}
                  </span>
                </div>
                <p className="text-sm text-[var(--sea-ink-soft)]">{event.detail}</p>
                <p className="mt-1 font-mono text-[10px] text-[var(--sea-ink-soft)]">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-[var(--sea-ink-soft)]">{label}</span>
      <span className="max-w-[60%] text-right text-xs font-medium text-[var(--sea-ink)]">{value}</span>
    </div>
  )
}

