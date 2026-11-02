import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { EvidenceForm } from '@/components/evidence-form'
import { SubmissionCard } from '@/components/submission-card'
import { formatDate, formatMoney } from '@/lib/format'
import type { tasks, submissions } from '@/lib/db/schema'

type Task = typeof tasks.$inferSelect
type Submission = typeof submissions.$inferSelect
type OwnerSubmission = { submission: Submission; submitterName: string }

type Props = {
  task: Task
  ownerName: string
  isOwner: boolean
  mySubmission: Submission | null
  ownerSubmissions: OwnerSubmission[]
  paypalStatus: 'connected' | 'not_connected' | 'unavailable'
}

export function TaskDetailsView({
  task,
  ownerName,
  isOwner,
  mySubmission,
  ownerSubmissions,
  paypalStatus,
}: Props) {
  const expired = task.dueAt ? task.dueAt.getTime() <= Date.now() : false
  const acceptsSubmissions = task.status === 'open' && !expired

  return (
    <div className="flex flex-col gap-6">
      <Link href="/explore" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to explore
      </Link>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{task.category}</Badge>
          <Badge variant={task.status === 'open' ? 'outline' : 'secondary'}>
            {task.status === 'open' ? (expired ? 'Expired' : 'Open') : task.status === 'completed' ? 'Completed' : 'Closed'}
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{task.title}</h1>
        <p className="text-sm text-muted-foreground">Posted by {ownerName}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">The check</h2>
              <CardDescription>What the task owner is asking a neighbor to verify.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
              <div className="rounded-xl border border-border bg-muted/35 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence criteria</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.criteria}</p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4 text-primary" />
                  {task.location}
                </span>
                <span className="pl-6">{task.address}</span>
              </div>
              <Alert>
                <ShieldCheck aria-hidden="true" />
                <AlertTitle>Keep it safe</AlertTitle>
                <AlertDescription>Meet in public, follow local rules, and do not enter private property.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {isOwner ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Submissions</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Private evidence shared only with you and its contributor.</p>
                </div>
                <span className="text-sm text-muted-foreground">{ownerSubmissions.length}</span>
              </div>
              {ownerSubmissions.length ? (
                <div className="flex flex-col gap-4">
                  {ownerSubmissions.map(({ submission, submitterName }) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      taskTitle={task.title}
                      rewardCents={task.rewardCents}
                      ownerView
                      submitterName={submitterName}
                      paypalStatus={paypalStatus}
                      returnTo={`/tasks/${task.id}`}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="min-h-48 border border-dashed border-border bg-card">
                  <EmptyHeader>
                    <EmptyTitle>No evidence yet</EmptyTitle>
                    <EmptyDescription>When a neighbor submits a check, it will appear here for your review.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>
          ) : mySubmission ? (
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Your submission</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your evidence and its review status.</p>
              </div>
              <SubmissionCard
                submission={mySubmission}
                taskTitle={task.title}
                rewardCents={task.rewardCents}
                ownerView={false}
              />
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader className="gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reward</p>
              <p className="text-3xl font-semibold tracking-tight text-primary">{formatMoney(task.rewardCents)}</p>
              <CardDescription>Paid after the task owner approves your evidence.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-4" />
                {task.dueAt ? `Due ${formatDate(task.dueAt)}` : 'No deadline set'}
              </div>
              {isOwner ? (
                <Alert>
                  <AlertDescription>
                    {task.status === 'open'
                      ? 'Your task is live. Approving one submission will close it and unlock the separate payout step.'
                      : task.status === 'completed'
                        ? 'This task has been completed.'
                        : 'This task is no longer accepting submissions.'}
                  </AlertDescription>
                </Alert>
              ) : mySubmission ? (
                <Alert>
                  <AlertDescription>Your evidence is already on file. The task owner makes the final decision.</AlertDescription>
                </Alert>
              ) : acceptsSubmissions ? (
                <EvidenceForm taskId={task.id} />
              ) : (
                <Alert variant="destructive">
                  <AlertTitle>Submissions are closed</AlertTitle>
                  <AlertDescription>This task is no longer accepting evidence.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
