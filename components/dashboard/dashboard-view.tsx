import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { TaskCard } from '@/components/task-card'
import type { tasks } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

type Task = typeof tasks.$inferSelect

type Props = {
  firstName: string
  stats: {
    openTasks: number
    postedTasks: number
    submissions: number
    payoutsSent: number
  }
  recentTasks: Task[]
}

export function DashboardView({ firstName, stats, recentTasks }: Props) {
  const metrics = [
    { label: 'Open checks', value: stats.openTasks },
    { label: 'My submissions', value: stats.submissions },
    { label: 'Tasks posted', value: stats.postedTasks },
  ]

  return (
    <div className="flex flex-col gap-7">
      <section className="relative isolate min-h-[19rem] overflow-hidden rounded-3xl border border-border bg-sidebar sm:min-h-[21rem]">
        <Image
          src="/realitycheck-neighborhood.png"
          alt="A neighbor documenting an accessible curb ramp on a city block"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/80 to-sidebar/35" />
        <div className="relative z-10 flex min-h-[19rem] max-w-2xl flex-col items-start justify-center p-5 text-sidebar-foreground sm:min-h-[21rem] sm:p-8">
          <Badge variant="outline" className="border-sidebar-border bg-sidebar/50 text-sidebar-foreground">
            Neighborhood checks, made useful
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Good to see you, {firstName}.
            <br />
            <span className="text-sidebar-primary">Make local eyes count.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-sidebar-foreground/80 sm:text-base">
            Post a clear check, collect private evidence, and reward the neighbor who gets it done.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/explore" className={cn(buttonVariants({ size: 'lg' }))}>
              Explore tasks
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Link>
            <Link
              href="/tasks/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar/60 px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              Post a task
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Your activity" className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="min-w-0">
            <CardContent className="flex flex-col gap-1.5 p-4 sm:p-5">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{metric.value}</p>
              <p className="text-[11px] leading-tight text-muted-foreground sm:text-sm">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Out in the neighborhood</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Open checks</h2>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Browse all <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {recentTasks.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <Empty className="min-h-56 border border-dashed border-border bg-card">
            <EmptyHeader>
              <EmptyTitle>No open checks just yet</EmptyTitle>
              <EmptyDescription>
                Start with one useful thing you would like a neighbor to verify nearby.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/tasks/new" className={cn(buttonVariants({ variant: 'outline' }))}>
                Post the first task
              </Link>
            </EmptyContent>
          </Empty>
        )}
      </section>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Human-first, evidence-led</h2>
            <CardDescription className="mt-1 leading-relaxed">
              Private uploads get an AI-assisted check. The task owner always makes the final call, and rewards are sent only after approval.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
