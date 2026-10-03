import { getComplianceStandards } from '#/lib/luciverse-catalog'

export type IsoStandardId = string

export type ControlStatus = 'compliant' | 'non_compliant' | 'partial' | 'pending' | 'not_applicable'

export type DriftSeverity = 'critical' | 'high' | 'medium' | 'low' | 'none'

export interface ControlResult {
  id: string
  title: string
  status: ControlStatus
  evidence?: string
  last_checked: number
  agent_responsible: string
}

export interface StandardComplianceStatus {
  standard_id: IsoStandardId
  overall_status: ControlStatus
  score: number
  controls_total: number
  controls_compliant: number
  controls_partial: number
  controls_failing: number
  drift_severity: DriftSeverity
  last_audit: number
  next_check: number
  certification_ready: boolean
  controls?: ControlResult[]
}

export interface ComplianceReport {
  generated_at: number
  overall_score: number
  certification_readiness: number
  standards: StandardComplianceStatus[]
  active_violations: ComplianceViolation[]
  drift_alerts: DriftAlert[]
  genesis_bond_coherence: number
}

export interface ComplianceViolation {
  id: string
  standard_id: IsoStandardId
  control_id: string
  severity: DriftSeverity
  description: string
  detected_at: number
  agent_assigned: string
  status: 'open' | 'remediation' | 'resolved'
}

export interface DriftAlert {
  id: string
  standard_id: IsoStandardId
  message: string
  severity: DriftSeverity
  detected_at: number
  auto_remediation: boolean
}

export function getIsoStandards() {
  return getComplianceStandards()
}

export function stubComplianceReport(): ComplianceReport {
  const standards = getComplianceStandards()
  const now = Date.now()

  return {
    generated_at: now,
    overall_score: 95,
    certification_readiness: 95,
    genesis_bond_coherence: 0.94,
    standards: standards.map((s) => ({
      standard_id: s.id,
      overall_status: 'compliant',
      score: 95,
      controls_total: s.controls,
      controls_compliant: Math.floor(s.controls * 0.95),
      controls_partial: Math.floor(s.controls * 0.04),
      controls_failing: Math.floor(s.controls * 0.01),
      drift_severity: 'low',
      last_audit: now - 86400000,
      next_check: now + 3600000,
      certification_ready: true,
    })),
    active_violations: [],
    drift_alerts: [
      {
        id: 'da-001',
        standard_id: standards[0]?.id ?? 'ISO-27001',
        message: 'Audit log retention approaching 2555-day threshold on node d8rth',
        severity: 'low',
        detected_at: now - 3600000,
        auto_remediation: true,
      },
    ],
  }
}

export function severityColor(s: DriftSeverity): string {
  return { critical: '#ff4444', high: '#ff6b35', medium: '#ff9500', low: '#ffcc00', none: '#4fb8b2' }[s]
}

export function statusColor(s: ControlStatus): string {
  return { compliant: '#4fb8b2', partial: '#ff9500', non_compliant: '#ff4444', pending: '#667788', not_applicable: '#333' }[s]
}

