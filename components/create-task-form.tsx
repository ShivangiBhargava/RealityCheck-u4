'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LoaderCircle, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TASK_CATEGORIES } from '@/lib/domain'
import { cn } from '@/lib/utils'

export function CreateTaskForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const formData = new FormData(event.currentTarget)
    const reward = Number(formData.get('reward'))

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          location: formData.get('location'),
          address: formData.get('address'),
          category: formData.get('category'),
          description: formData.get('description'),
          criteria: formData.get('criteria'),
          rewardCents: Math.round(reward * 100),
          dueAt: formData.get('dueAt') || null,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.id !== 'string') {
        setError(result?.error ?? 'We could not publish this task. Check the details and try again.')
        return
      }
      router.push(`/tasks/${result.id}`)
      router.refresh()
    } catch {
      setError('We could not publish this task. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Task not published</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="title">Task title</FieldLabel>
          <Input id="title" name="title" required minLength={8} maxLength={90} placeholder="Check the new curb ramp on Pine Street" />
          <FieldDescription>Be specific about what a neighbor should verify.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <select
            id="category"
            name="category"
            required
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {TASK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor="reward">Reward (USD)</FieldLabel>
          <Input id="reward" name="reward" type="number" min="5" max="500" step="0.01" required defaultValue="15" />
          <FieldDescription>$5–$500, paid after your approval.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="location">Neighborhood or city</FieldLabel>
          <Input id="location" name="location" required minLength={2} maxLength={100} placeholder="Mission District, San Francisco" />
        </Field>
        <Field>
          <FieldLabel htmlFor="address">Public meeting point</FieldLabel>
          <Input id="address" name="address" required minLength={5} maxLength={180} placeholder="Corner of Pine St and 3rd Ave" />
          <FieldDescription>Only include an address you intend to share publicly.</FieldDescription>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="description">What needs checking?</FieldLabel>
          <Textarea id="description" name="description" required minLength={20} maxLength={800} rows={4} placeholder="Describe the local detail you need a neighbor to verify…" />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="criteria">What should the evidence show?</FieldLabel>
          <Textarea id="criteria" name="criteria" required minLength={10} maxLength={700} rows={3} placeholder="List the visible details that would make the check complete…" />
          <FieldDescription>Clear criteria help the contributor and the AI reviewer. A person still makes the final decision.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="dueAt">Deadline (optional)</FieldLabel>
          <Input id="dueAt" name="dueAt" type="date" />
        </Field>
      </FieldGroup>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
          ) : (
            <Send aria-hidden="true" data-icon="inline-start" />
          )}
          {pending ? 'Publishing…' : 'Publish task'}
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }))}>
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          Cancel
        </Link>
      </div>
    </form>
  )
}
