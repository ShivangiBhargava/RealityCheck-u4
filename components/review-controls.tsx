'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function ReviewControls({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  async function review(decision: 'approve' | 'reject') {
    setPending(decision)
    setError('')
    try {
      const response = await fetch(`/api/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.error ?? 'The review could not be saved.')
        return
      }
      router.refresh()
    } catch {
      setError('The review could not be saved. Check your connection and try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Approval closes this task and unlocks a separate payout action.
      </p>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending !== null} onClick={() => review('approve')}>
          {pending === 'approve' ? (
            <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          ) : (
            <Check aria-hidden="true" data-icon="inline-start" />
          )}
          Approve evidence
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending !== null} onClick={() => review('reject')}>
          {pending === 'reject' ? (
            <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          ) : (
            <X aria-hidden="true" data-icon="inline-start" />
          )}
          Reject
        </Button>
      </div>
    </div>
  )
}
