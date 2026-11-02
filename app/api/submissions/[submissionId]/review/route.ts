import { and, eq, exists } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { submissions, tasks } from '@/lib/db/schema'
import { getRequestUser } from '@/lib/auth-helpers'
import { reviewDecisionSchema } from '@/lib/validation'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ submissionId: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in to review evidence.' }, { status: 401 })

  const { submissionId } = await params
  const body = await request.json().catch(() => null)
  const parsed = reviewDecisionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose approve or reject.' }, { status: 400 })
  }

  const [record] = await db
    .select({
      taskId: tasks.id,
      ownerId: tasks.userId,
      taskStatus: tasks.status,
      submissionStatus: submissions.status,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .where(eq(submissions.id, submissionId))
    .limit(1)

  if (!record || record.ownerId !== user.id) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }
  if (record.submissionStatus !== 'pending_review') {
    return NextResponse.json({ error: 'This submission has already been reviewed.' }, { status: 409 })
  }
  if (parsed.data.decision === 'approve' && record.taskStatus !== 'open') {
    return NextResponse.json({ error: 'This task is no longer open for approval.' }, { status: 409 })
  }

  try {
    await db.transaction(async (tx) => {
      const ownedTask = tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.id, submissions.taskId), eq(tasks.userId, user.id)))

      if (parsed.data.decision === 'approve') {
        const [closedTask] = await tx
          .update(tasks)
          .set({ status: 'closed', updatedAt: new Date() })
          .where(
            and(
              eq(tasks.id, record.taskId),
              eq(tasks.userId, user.id),
              eq(tasks.status, 'open'),
            ),
          )
          .returning({ id: tasks.id })
        if (!closedTask) throw new Error('Task is no longer open')
      }

      const [updated] = await tx
        .update(submissions)
        .set({
          status: parsed.data.decision === 'approve' ? 'approved' : 'rejected',
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(submissions.id, submissionId),
            eq(submissions.status, 'pending_review'),
            exists(ownedTask),
          ),
        )
        .returning({ id: submissions.id })
      if (!updated) throw new Error('Submission is no longer pending')
    })
  } catch {
    return NextResponse.json(
      { error: 'The review could not be saved. Refresh and try again.' },
      { status: 409 },
    )
  }

  return NextResponse.json({ status: parsed.data.decision === 'approve' ? 'approved' : 'rejected' })
}
