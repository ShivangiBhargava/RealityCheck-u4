import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { ExploreFilters } from '@/components/explore-filters'
import { TaskCard } from '@/components/task-card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { buttonVariants } from '@/components/ui/button'
import { getOpenTasks } from '@/lib/queries'
import { requireUser } from '@/lib/auth-helpers'
import { TASK_CATEGORIES } from '@/lib/domain'
import { cn } from '@/lib/utils'

type SearchParams = Record<string, string | string[] | undefined>

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const user = await requireUser()
  const params = await searchParams
  const rawQuery = params.q
  const rawCategory = params.category
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? ''
  const requestedCategory = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory
  const category =
    requestedCategory && TASK_CATEGORIES.some((item) => item === requestedCategory)
      ? requestedCategory
      : 'all'
  const tasks = await getOpenTasks(user.id, { query, category })

  return (
    <AppShell user={user} active="explore">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Marketplace</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Explore local checks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Find a practical task nearby, follow clear evidence criteria, and earn a reward when the owner approves your work.
            </p>
          </div>
          <Link href="/tasks/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            Post a task <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </header>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="Task filters">
          <ExploreFilters query={query} category={category} />
        </section>

        <section className="flex flex-col gap-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Open checks</h2>
            <span className="text-sm text-muted-foreground">{tasks.length} found</span>
          </div>
          {tasks.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          ) : (
            <Empty className="min-h-64 border border-dashed border-border bg-card">
              <EmptyHeader>
                <EmptyTitle>No matching open checks</EmptyTitle>
                <EmptyDescription>
                  Try a broader search, or post the first task in your neighborhood.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link href="/tasks/new" className={cn(buttonVariants({ variant: 'outline' }))}>
                  Post a task
                </Link>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </div>
    </AppShell>
  )
}
