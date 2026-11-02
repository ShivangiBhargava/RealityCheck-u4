export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return 'No deadline'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'No deadline'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function getSubmissionStatusLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Not approved'
    case 'payout_submitted':
      return 'Payout submitted'
    case 'paid':
      return 'Paid'
    case 'payout_failed':
      return 'Payout issue'
    default:
      return 'Under review'
  }
}
