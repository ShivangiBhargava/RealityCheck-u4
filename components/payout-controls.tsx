'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, LoaderCircle, Wallet } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function PayoutControls({
  submissionId,
  payoutStatus,
  payoutBatchId,
  rewardLabel,
}: {
  submissionId: string
  payoutStatus: string | null
  payoutBatchId: string | null
  rewardLabel: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function sendPayout() {
    setPending(true)
    setError('')
    try {
      const response = await fetch(`/api/submissions/${submissionId}/payout`, {
        method: 'POST',
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.error ?? 'The payout request could not be completed.')
        router.refresh()
        return
      }
      router.refresh()
    } catch {
      setError('The payout status could not be confirmed. Check PayPal Sandbox before retrying.')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  if (payoutStatus === 'submitted' || payoutStatus === 'paid') {
    return (
      <Alert>
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>PayPal payout submitted</AlertTitle>
        <AlertDescription>
          {payoutBatchId ? `Sandbox batch: ${payoutBatchId}` : 'The sandbox payout was accepted.'}
        </AlertDescription>
      </Alert>
    )
  }

  if (payoutStatus === 'unknown' || payoutStatus === 'sending') {
    return (
      <Alert variant={payoutStatus === 'unknown' ? 'destructive' : 'default'}>
        {payoutStatus === 'unknown' ? <AlertCircle aria-hidden="true" /> : <LoaderCircle aria-hidden="true" className="animate-spin" />}
        <AlertTitle>{payoutStatus === 'unknown' ? 'Payout needs a status check' : 'Payout processing'}</AlertTitle>
        <AlertDescription>
          {payoutStatus === 'unknown'
            ? 'Check PayPal Sandbox payout history before retrying. The app will not resend an unconfirmed payout.'
            : 'A payout request is in progress. Refresh in a moment.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {payoutStatus === 'failed' ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>PayPal rejected the last request</AlertTitle>
          <AlertDescription>Review the contributor&apos;s payout details before trying again.</AlertDescription>
        </Alert>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <Button type="button" onClick={sendPayout} disabled={pending}>
        {pending ? (
          <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
        ) : (
          <Wallet aria-hidden="true" data-icon="inline-start" />
        )}
        {pending ? 'Sending…' : `Send ${rewardLabel} via PayPal Sandbox`}
      </Button>
      <p className="text-xs text-muted-foreground">The amount and recipient are taken from the approved submission and task.</p>
    </div>
  )
}
