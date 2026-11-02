import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { getRequestUser } from '@/lib/auth-helpers'
import { createTaskSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in to post a task.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check the task details and try again.' },
      { status: 400 },
    )
  }

  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
  if (dueAt && dueAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: 'The deadline must be in the future.' },
      { status: 400 },
    )
  }

  const id = randomUUID()
  try {
    await db.insert(tasks).values({
      id,
      userId: user.id,
      title: parsed.data.title,
      location: parsed.data.location,
      address: parsed.data.address,
      category: parsed.data.category,
      description: parsed.data.description,
      criteria: parsed.data.criteria,
      rewardCents: parsed.data.rewardCents,
      status: 'open',
      dueAt,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch {
    console.error('[realitycheck] Task creation failed')
    return NextResponse.json(
      { error: 'We could not publish this task. Please try again.' },
      { status: 500 },
    )
  }
}
