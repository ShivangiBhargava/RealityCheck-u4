import Link from 'next/link'
import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { formatDate, formatMoney } from '@/lib/format'
import type { tasks } from '@/lib/db/schema'

type Task = typeof tasks.$inferSelect

export function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:ring-primary/25">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="secondary">{task.category}</Badge>
          <span className="shrink-0 text-sm font-semibold text-primary">
            {formatMoney(task.rewardCents)}
          </span>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
          <Link href={`/tasks/${task.id}`} className="outline-none hover:text-primary focus-visible:underline">
            {task.title}
          </Link>
        </h3>
        <CardDescription className="line-clamp-2 leading-relaxed">
          {task.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{task.location}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
          {task.dueAt ? formatDate(task.dueAt) : 'Flexible deadline'}
        </span>
      </CardContent>
      <CardFooter className="justify-end border-t border-border bg-muted/30">
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary outline-none hover:underline focus-visible:underline"
        >
          View task
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}
