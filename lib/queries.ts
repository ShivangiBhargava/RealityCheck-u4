import 'server-only'

import {
  and,
  count,
  desc,
  eq,
  gt,
  ilike,
  isNull,
  ne,
  or,
} from 'drizzle-orm'
import { db } from '@/lib/db'
import { submissions, tasks, user as users } from '@/lib/db/schema'
import { TASK_CATEGORIES, type TaskCategory } from '@/lib/domain'

export async function getDashboardData(userId: string) {
  const now = new Date()
  const openTaskFilter = and(
    eq(tasks.status, 'open'),
    ne(tasks.userId, userId),
    or(isNull(tasks.dueAt), gt(tasks.dueAt, now)),
  )

  const [openCountRows, postedCountRows, submissionCountRows, payoutCountRows, recentTasks] =
    await Promise.all([
      db.select({ value: count() }).from(tasks).where(openTaskFilter),
      db.select({ value: count() }).from(tasks).where(eq(tasks.userId, userId)),
      db
        .select({ value: count() })
        .from(submissions)
        .where(eq(submissions.userId, userId)),
      db
        .select({ value: count() })
        .from(submissions)
        .where(
          and(
            eq(submissions.userId, userId),
            or(
              eq(submissions.payoutStatus, 'submitted'),
              eq(submissions.payoutStatus, 'paid'),
            ),
          ),
        ),
      db
        .select()
        .from(tasks)
        .where(openTaskFilter)
        .orderBy(desc(tasks.createdAt))
        .limit(3),
    ])

  return {
    stats: {
      openTasks: openCountRows[0]?.value ?? 0,
      postedTasks: postedCountRows[0]?.value ?? 0,
      submissions: submissionCountRows[0]?.value ?? 0,
      payoutsSent: payoutCountRows[0]?.value ?? 0,
    },
    recentTasks,
  }
}

export async function getOpenTasks(
  userId: string,
  filters: { query?: string; category?: string },
) {
  const search = filters.query?.trim().slice(0, 100)
  const category = TASK_CATEGORIES.find((item) => item === filters.category) as
    | TaskCategory
    | undefined
  const now = new Date()

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'open'),
        ne(tasks.userId, userId),
        or(isNull(tasks.dueAt), gt(tasks.dueAt, now)),
        category ? eq(tasks.category, category) : undefined,
        search
          ? or(
              ilike(tasks.title, `%${search}%`),
              ilike(tasks.location, `%${search}%`),
              ilike(tasks.category, `%${search}%`),
              ilike(tasks.description, `%${search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(tasks.createdAt))
    .limit(40)
}

export async function getAccountData(userId: string) {
  const [postedTasks, submittedRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt))
      .limit(24),
    db
      .select({
        submission: submissions,
        taskTitle: tasks.title,
        taskLocation: tasks.location,
        rewardCents: tasks.rewardCents,
      })
      .from(submissions)
      .innerJoin(tasks, eq(submissions.taskId, tasks.id))
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt))
      .limit(24),
  ])

  return { postedTasks, submittedRows }
}

export async function getTaskPageData(taskId: string, userId: string) {
  const [row] = await db
    .select({ task: tasks, ownerName: users.name })
    .from(tasks)
    .innerJoin(users, eq(tasks.userId, users.id))
    .where(eq(tasks.id, taskId))
    .limit(1)

  if (!row) return null
  const isOwner = row.task.userId === userId

  if (isOwner) {
    const ownerSubmissions = await db
      .select({ submission: submissions, submitterName: users.name })
      .from(submissions)
      .innerJoin(users, eq(submissions.userId, users.id))
      .where(eq(submissions.taskId, taskId))
      .orderBy(desc(submissions.createdAt))
      .limit(50)

    return {
      task: row.task,
      ownerName: row.ownerName,
      isOwner: true as const,
      mySubmission: null,
      ownerSubmissions,
    }
  }

  const [mySubmission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.taskId, taskId), eq(submissions.userId, userId)))
    .limit(1)

  return {
    task: row.task,
    ownerName: row.ownerName,
    isOwner: false as const,
    mySubmission: mySubmission ?? null,
    ownerSubmissions: [],
  }
}
