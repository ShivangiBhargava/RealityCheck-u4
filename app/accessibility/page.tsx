import type { Metadata } from 'next'
import { AppShell } from '@/components/app-shell'
import { AccessibilityFinder } from '@/components/accessibility-finder'
import { requireUser } from '@/lib/auth-helpers'

export const metadata: Metadata = {
  title: 'Accessibility reports',
  description:
    'Search recent, consent-shared accessibility reports or ask a local scout to check a place.',
}

export default async function AccessibilityPage() {
  const user = await requireUser()

  return (
    <AppShell user={user} active="accessibility">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Traveler reports</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Check accessibility before you go</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Search recent reports from local scouts. If a report does not directly answer your question, request a fresh check instead of relying on a guess.
          </p>
        </header>
        <AccessibilityFinder />
      </div>
    </AppShell>
  )
}
