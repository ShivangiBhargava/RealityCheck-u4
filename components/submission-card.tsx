import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { ConnectPayPalButton } from '@/components/connect-paypal-button'
import { PayoutControls } from '@/components/payout-controls'
import { ReviewControls } from '@/components/review-controls'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatMoney, getSubmissionStatusLabel } from '@/lib/format'
import type { EvidenceReview } from '@/lib/domain'
import type { submissions } from '@/lib/db/schema'

type Submission = typeof submissions.$inferSelect

type Props = {
  submission: Submission
  taskTitle: string
  rewardCents: number
  ownerView: boolean
  submitterName?: string
  paypalStatus?: 'connected' | 'not_connected' | 'unavailable'
  returnTo?: string
}

function reviewOutcomeLabel(outcome: EvidenceReview['outcome']) {
  if (outcome === 'strong_match') return 'Strong match'
  if (outcome === 'partial_match') return 'Partial match'
  return 'Needs a closer look'
}

export function SubmissionCard({
  submission,
  taskTitle,
  rewardCents,
  ownerView,
  submitterName,
  paypalStatus = 'not_connected',
  returnTo = '/account',
}: Props) {
  const review = submission.aiReview as EvidenceReview
  const reviewVariant =
    review.outcome === 'strong_match'
      ? 'default'
      : review.outcome === 'partial_match'
        ? 'secondary'
        : 'outline'

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={submission.status === 'rejected' ? 'outline' : 'secondary'}>
            {getSubmissionStatusLabel(submission.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">Submitted {formatDate(submission.createdAt)}</span>
        </div>
        <div>
          <h3 className="text-base font-semibold">{ownerView ? submitterName ?? 'Contributor' : 'Your evidence'}</h3>
          <CardDescription>{taskTitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          <img
            src={`/api/evidence/${submission.id}`}
            alt={`Evidence submitted for ${taskTitle}`}
            loading="lazy"
            className="max-h-80 w-full object-cover"
          />
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{submission.evidence}</p>
        <div className="rounded-xl border border-border bg-muted/35 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">AI evidence check</p>
            <Badge variant={reviewVariant}>{reviewOutcomeLabel(review.outcome)}</Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.summary}</p>
          {review.checks.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {review.checks.map((check, index) => (
                <li key={`${check.label}-${index}`} className="flex flex-col gap-0.5 text-xs sm:flex-row sm:gap-2">
                  <span className="font-medium text-foreground">{check.label}</span>
                  <span className="text-muted-foreground">
                    {check.result === 'visible' ? 'Visible' : check.result === 'unclear' ? 'Unclear' : 'Not visible'}
                    {' · '}{check.note}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            AI output is guidance only. A person makes every final decision.
          </p>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Task reward</span>
          <span className="font-semibold">{formatMoney(rewardCents)}</span>
        </div>
        {ownerView && submission.status === 'pending_review' ? (
          <ReviewControls submissionId={submission.id} />
        ) : null}
        {ownerView && ['approved', 'payout_submitted', 'paid'].includes(submission.status) ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            {paypalStatus === 'connected' ? (
              <PayoutControls
                submissionId={submission.id}
                payoutStatus={submission.payoutStatus}
                payoutBatchId={submission.payoutBatchId}
                rewardLabel={formatMoney(rewardCents)}
              />
            ) : paypalStatus === 'not_connected' ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">Connect your PayPal account to send this sandbox reward.</p>
                <ConnectPayPalButton returnTo={returnTo} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">PayPal connection status is unavailable. Refresh and try again.</p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
