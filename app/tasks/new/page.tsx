import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CreateTaskForm } from '@/components/create-task-form'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { requireUser } from '@/lib/auth-helpers'

export default async function NewTaskPage() {
  const user = await requireUser()

  return (
    <AppShell user={user} active="explore">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Link href="/explore" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to explore
        </Link>
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Create a task</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Make the ask clear</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Set a public meeting point, explain what to verify, and choose a reward. Your task stays open until one submission is approved.
          </p>
        </header>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Task details</h2>
            <CardDescription>Keep requests specific, safe, and easy to verify from public spaces.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTaskForm />
          </CardContent>
        </Card>
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Evidence uploads are private. AI gives the reviewer a checklist, but only you can approve the work and start a PayPal sandbox payout.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
