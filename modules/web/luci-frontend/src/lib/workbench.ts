export type WorkbenchExportTarget = 'terraform' | 'json' | 'podman-compose'

export interface WorkbenchSession {
  id: string
  project: string
  owner: string
  status: 'active' | 'paused' | 'ready'
  branch: string
  focus: string
  lastUpdated: string
  checkpoints: string[]
  mcpServers: string[]
}

export interface InfrastructureResource {
  name: string
  type: string
  count: number
  purpose: string
}

export interface InfrastructureBlueprint {
  id: string
  title: string
  summary: string
  exports: WorkbenchExportTarget[]
  resources: InfrastructureResource[]
  outputs: string[]
}

export interface McpServerStatus {
  id: string
  name: string
  status: 'ready' | 'syncing' | 'offline'
  transport: 'http' | 'streamable' | 'stdio'
  endpoint: string
  purpose: string
}

export interface WorkbenchEvent {
  id: string
  timestamp: string
  title: string
  detail: string
  kind: 'session' | 'compose' | 'mcp' | 'export'
}

export function buildWorkbenchManifest(
  session: WorkbenchSession,
  blueprint: InfrastructureBlueprint,
) {
  return {
    stack: blueprint.title,
    session: session.project,
    owner: session.owner,
    branch: session.branch,
    focus: session.focus,
    exports: blueprint.exports,
    resources: blueprint.resources.map((resource) => ({ ...resource })),
    mcp_servers: session.mcpServers,
    checkpoints: session.checkpoints,
    generated_at: new Date().toISOString(),
    notes: [
      'Opcode-inspired session ledger',
      'CRAIG-inspired infrastructure composition',
      'Luciverse-native provider-neutral export plan',
    ],
  }
}

