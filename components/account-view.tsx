import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, CircleUserRound, Wallet } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { ConnectPayPalButton } from '@/components/connect-paypal-button'
import { TaskCard } from '@/components/task-card'
import { formatDate, formatMoney, getSubmissionStatusLabel } from '@/lib/format'
import type { getAccountData } from '@/lib/queries'
import { cn } from '@/lib/utils'

type AccountData = Awaited<ReturnType<typeof getAccountData>>

type Props = {
  user: { name: string; email: string }
  paypalStatus: 'connected' | 'not_connected' | 'unavailable'
  data: AccountData
}

export function AccountView({ user, paypalStatus, data }: Props) {
  return (
    <div className="flex flex-col gap-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Your account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">My activity</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your profile, tasks, submissions, and sandbox payout connection.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="grid-cols-[auto_1fr] items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
              <CircleUserRound aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{user.name}</h2>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your account is protected by email and password sign-in. Task and evidence access is checked on the server.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet aria-hidden="true" className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">PayPal payouts</h2>
                <Badge variant={paypalStatus === 'connected' ? 'default' : 'outline'}>
                  {paypalStatus === 'connected' ? 'Connected' : paypalStatus === 'unavailable' ? 'Unavailable' : 'Not connected'}
                </Badge>
              </div>
              <CardDescription>Per-user authorization for RealityCheck sandbox rewards.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {paypalStatus === 'connected' ? (
              <Alert>
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle>Ready for sandbox payouts</AlertTitle>
                <AlertDescription>Live payments are not enabled in this app.</AlertDescription>
              </Alert>
            ) : paypalStatus === 'not_connected' ? (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">Connect the PayPal account you want to use when approving a contributor&apos;s reward.</p>
                <ConnectPayPalButton returnTo="/account" />
              </>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Could not check the connection</AlertTitle>
                <AlertDescription>Refresh this page and try again.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Tasks I posted</h2>
            <p className="mt-1 text-sm text-muted-foreground">Follow activity and review evidence on your open checks.</p>
          </div>
          <Link href="/tasks/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Post a task <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </div>
        {data.postedTasks.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.postedTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <Empty className="min-h-44 border border-dashed border-border bg-card">
            <EmptyHeader>
              <EmptyTitle>No tasks posted</EmptyTitle>
              <EmptyDescription>Publish a clear neighborhood check and set a reward for completed evidence.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/tasks/new" className={cn(buttonVariants({ variant: 'outline' }))}>Create a task</Link>
            </EmptyContent>
          </Empty>
        )}
      </section>

      <section id="submissions" className="flex scroll-mt-24 flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">My submissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your evidence is private to you and the task owner.</p>
        </div>
        {data.submittedRows.length ? (
          <div className="flex flex-col gap-3">
            {data.submittedRows.map(({ submission, taskTitle, taskLocation, rewardCents }) => (
              <Card key={submission.id}>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <Link href={`/tasks/${submission.taskId}`} className="font-semibold hover:text-primary hover:underline">
                      {taskTitle}
                    </Link>
                    <CardDescription>{taskLocation} · {formatDate(submission.createdAt)}</CardDescription>
                  </div>
                  <Badge variant={submission.status === 'rejected' ? 'outline' : 'secondary'}>
                    {getSubmissionStatusLabel(submission.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 border-t border-border bg-muted/25 text-sm">
                  <span className="text-muted-foreground">Task reward</span>
                  <span className="font-semibold">{formatMoney(rewardCents)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="min-h-44 border border-dashed border-border bg-card">
            <EmptyHeader>
              <EmptyTitle>No submissions yet</EmptyTitle>
              <EmptyDescription>Pick an open check and add a photo with a short explanation.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/explore" className={cn(buttonVariants({ variant: 'outline' }))}>Explore tasks</Link>
            </EmptyContent>
          </Empty>
        )}
      </section>
    </div>
  )
}
