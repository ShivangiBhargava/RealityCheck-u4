'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, LoaderCircle, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function EvidenceForm({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    formData.set('taskId', taskId)

    try {
      const response = await fetch('/api/submissions', { method: 'POST', body: formData })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.error ?? 'We could not save your evidence. Please try again.')
        return
      }
      router.refresh()
    } catch {
      setError('We could not save your evidence. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Submission not sent</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="evidence">What did you find?</FieldLabel>
          <Textarea id="evidence" name="evidence" required minLength={10} maxLength={800} rows={3} placeholder="Briefly explain how your photo meets the task criteria…" />
          <FieldDescription>Keep notes focused on the visible task details.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="evidenceFile">Evidence photo</FieldLabel>
          <Input id="evidenceFile" name="evidenceFile" type="file" accept="image/jpeg,image/png,image/webp" required />
          <FieldDescription>JPG, PNG, or WebP. Maximum 6 MB. Stored privately for this task.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="payoutEmail">PayPal email for this reward</FieldLabel>
          <Input id="payoutEmail" name="payoutEmail" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" />
          <FieldDescription>Used only if the task owner approves your evidence.</FieldDescription>
        </Field>
      </FieldGroup>
      <div className="mt-4 flex flex-col gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          The AI review is advisory. The task owner makes the final decision before any sandbox payout.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          ) : (
            <Camera aria-hidden="true" data-icon="inline-start" />
          )}
          {pending ? 'Uploading and reviewing…' : 'Submit evidence'}
        </Button>
      </div>
    </form>
  )
}
