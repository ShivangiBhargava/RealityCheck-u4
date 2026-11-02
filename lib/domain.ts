export const TASK_CATEGORIES = [
  'Accessibility',
  'Public spaces',
  'Transit',
  'Local business',
  'Safety',
  'Other',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number]

export type EvidenceReview = {
  outcome: 'strong_match' | 'partial_match' | 'needs_attention'
  confidence: number
  summary: string
  checks: Array<{
    label: string
    result: 'visible' | 'unclear' | 'not_visible'
    note: string
  }>
}

export type SubmissionStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'payout_submitted'
  | 'paid'
  | 'payout_failed'

export const FALLBACK_EVIDENCE_REVIEW: EvidenceReview = {
  outcome: 'needs_attention',
  confidence: 0,
  summary: 'Automated review was unavailable. Please review the evidence manually.',
  checks: [],
}
