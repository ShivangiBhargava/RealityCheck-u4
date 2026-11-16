'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowUpRight, LoaderCircle, MapPin, Search, Send, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatMoney } from '@/lib/format'
import type { EvidenceReview } from '@/lib/domain'
import { cn } from '@/lib/utils'

type QuestionFields = {
  venue: string
  location: string
  address: string
  question: string
}

type SharedReport = {
  id: string
  title: string
  location: string
  address: string
  note: string
  reviewSummary: string
  checks: EvidenceReview['checks']
  createdAt: string
  evidenceUrl: string
}

export function AccessibilityFinder() {
  const [fields, setFields] = useState<QuestionFields>({
    venue: '',
    location: '',
    address: '',
    question: 'Is the public entrance step-free?',
  })
  const [searchPending, setSearchPending] = useState(false)
  const [searchState, setSearchState] = useState<'idle' | 'matched' | 'none' | 'unavailable'>('idle')
  const [report, setReport] = useState<SharedReport | null>(null)
  const [searchError, setSearchError] = useState('')
  const [reward, setReward] = useState('15')
  const [taskPending, setTaskPending] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [createdTaskId, setCreatedTaskId] = useState('')

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setFields((current) => ({ ...current, [name]: value }))
    setSearchState('idle')
    setReport(null)
    setSearchError('')
    setTaskError('')
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchPending(true)
    setSearchState('idle')
    setReport(null)
    setSearchError('')
    setTaskError('')
    setCreatedTaskId('')

    try {
      const response = await fetch('/api/accessibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null)

      if (result?.status === 'matched' && result.report) {
        setReport(result.report as SharedReport)
        setSearchState('matched')
      } else if (result?.status === 'unavailable') {
        setSearchState('unavailable')
      } else if (response.ok && result?.status === 'none') {
        setSearchState('none')
      } else {
        setSearchError(result?.error ?? 'We could not search shared reports. Check the details and try again.')
      }
    } catch {
      setSearchError('We could not search shared reports. Check your connection and try again.')
    } finally {
      setSearchPending(false)
    }
  }

  async function handleScoutRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTaskPending(true)
    setTaskError('')

    const rewardDollars = Number(reward)
    if (!Number.isFinite(rewardDollars) || rewardDollars < 5 || rewardDollars > 500) {
      setTaskError('Choose a reward between $5 and $500.')
      setTaskPending(false)
      return
    }

    const title = `Accessibility check: ${fields.venue}`.slice(0, 90)
    const description = `Please check accessibility at ${fields.venue}, ${fields.address}, ${fields.location}. Answer this traveler question: ${fields.question}`
    const criteria = 'Take a clear photo of the relevant public entrance or route. In your note, answer the traveler question using observed details. Do not enter private spaces.'

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          location: fields.location,
          address: fields.address,
          category: 'Accessibility',
          description,
          criteria,
          rewardCents: Math.round(rewardDollars * 100),
          dueAt: null,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.id !== 'string') {
        setTaskError(result?.error ?? 'We could not post the scout check. Please try again.')
        return
      }
      setCreatedTaskId(result.id)
    } catch {
      setTaskError('We could not post the scout check. Check your connection and try again.')
    } finally {
      setTaskPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Ask about a specific place</h2>
          <CardDescription>
            We look for a recent, human-approved report at this location that its scout chose to share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch}>
            <FieldGroup className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="venue">Venue or entrance</FieldLabel>
                <Input id="venue" name="venue" value={fields.venue} onChange={updateField} required minLength={2} maxLength={120} disabled={searchPending} placeholder="Cedar Room Cafe" />
              </Field>
              <Field>
                <FieldLabel htmlFor="location">Neighborhood or city</FieldLabel>
                <Input id="location" name="location" value={fields.location} onChange={updateField} required minLength={2} maxLength={100} disabled={searchPending} placeholder="Oakland, California" />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="address">Public address</FieldLabel>
                <Input id="address" name="address" value={fields.address} onChange={updateField} required minLength={5} maxLength={180} disabled={searchPending} placeholder="214 Grand Avenue" />
                <FieldDescription>Use the public storefront address, not a private entrance or access code.</FieldDescription>
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="question">What would you like to know?</FieldLabel>
                <Textarea id="question" name="question" value={fields.question} onChange={updateField} required minLength={8} maxLength={280} rows={3} disabled={searchPending} />
                <FieldDescription>Ask one specific question, such as whether there is a step-free public entrance.</FieldDescription>
              </Field>
            </FieldGroup>
            {searchError ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Report search failed</AlertTitle>
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="submit" size="lg" disabled={searchPending}>
                {searchPending ? (
                  <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Search aria-hidden="true" data-icon="inline-start" />
                )}
                {searchPending ? 'Checking reports…' : 'Check reports'}
              </Button>
              <p className="text-xs text-muted-foreground">Only reports from the last 90 days are considered.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchState === 'matched' && report ? (
        <Card aria-live="polite">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Recent scout report</p>
                <h2 className="mt-1 text-lg font-semibold">{report.title}</h2>
              </div>
              <Badge variant="secondary">Human-approved</Badge>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{report.location}</span>
              <span>{formatDate(report.createdAt)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{report.address}</p>
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <p className="text-sm font-semibold">Scout&apos;s note</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{report.note}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={report.evidenceUrl}
                alt={`Scout evidence for ${report.title}`}
                width={1200}
                height={675}
                unoptimized
                className="max-h-[28rem] w-full object-contain"
              />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                <p className="text-sm font-semibold">AI visual check, advisory</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{report.reviewSummary}</p>
              {report.checks.length ? (
                <ul className="mt-3 flex flex-col gap-2">
                  {report.checks.map((check, index) => (
                    <li key={`${check.label}-${index}`} className="text-xs leading-relaxed">
                      <span className="font-medium">{check.label}</span>
                      <span className="text-muted-foreground">{' · '}{check.result === 'visible' ? 'Visible' : check.result === 'unclear' ? 'Unclear' : 'Not visible'}{' · '}{check.note}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Alert>
              <AlertDescription>
                This is a snapshot from {formatDate(report.createdAt)}, not a guarantee of current conditions. The contributor opted in and the task owner approved the report before it was shared.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : null}

      {searchState === 'none' || searchState === 'unavailable' ? (
        <div className="flex flex-col gap-4" aria-live="polite">
          <Alert>
            <ShieldCheck aria-hidden="true" />
            <AlertTitle>{searchState === 'unavailable' ? 'Shared reports could not be verified' : 'No reliable shared report for this place yet'}</AlertTitle>
            <AlertDescription>
              {searchState === 'unavailable'
                ? 'We will not guess. You can try the search again later or ask a scout to check this location.'
                : 'No recent human-approved report directly answers this question. Ask a local scout to make a fresh check instead of relying on an uncertain match.'}
            </AlertDescription>
          </Alert>

          {createdTaskId ? (
            <Alert>
              <AlertTitle>Scout check posted</AlertTitle>
              <AlertDescription>
                Your task is live with a {formatMoney(Math.round(Number(reward) * 100))} reward. You will review the evidence before any payout.{' '}
                <Link href={`/tasks/${createdTaskId}`} className="font-semibold text-primary underline underline-offset-4">View the scout check</Link>
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Ask a scout to check it</h2>
                <CardDescription>
                  Post a focused Accessibility task at the address above. You choose the reward and approve any evidence before payout.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScoutRequest} className="flex flex-col gap-4">
                  <Field>
                    <FieldLabel htmlFor="scoutReward">Scout reward (USD)</FieldLabel>
                    <Input id="scoutReward" name="scoutReward" type="number" min="5" max="500" step="0.01" required value={reward} onChange={(event) => setReward(event.target.value)} />
                    <FieldDescription>Choose $5–$500. The payout remains gated on your approval.</FieldDescription>
                  </Field>
                  {taskError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Scout check not posted</AlertTitle>
                      <AlertDescription>{taskError}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Button type="submit" size="lg" disabled={taskPending}>
                    {taskPending ? (
                      <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Send aria-hidden="true" data-icon="inline-start" />
                    )}
                    {taskPending ? 'Posting scout check…' : 'Post an accessibility check'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Only opted-in reports approved by a task owner can be matched. Photos stay private unless a scout explicitly shares them.{' '}
          <Link href="/explore?category=Accessibility" className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto p-0')}>Explore accessibility tasks<ArrowUpRight aria-hidden="true" data-icon="inline-end" /></Link>
        </p>
      </div>
    </div>
  )
}
