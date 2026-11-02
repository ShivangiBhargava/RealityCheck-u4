import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { del, put } from '@vercel/blob'
import { and, eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { submissions, tasks } from '@/lib/db/schema'
import { getRequestUser } from '@/lib/auth-helpers'
import { FALLBACK_EVIDENCE_REVIEW } from '@/lib/domain'
import { AI_REVIEW_MODEL, reviewEvidence } from '@/lib/review'
import { submissionFieldsSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 60

function detectImageType(bytes: Uint8Array) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { contentType: 'image/png', extension: 'png' }
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' }
  }
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF' &&
    Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WEBP'
  ) {
    return { contentType: 'image/webp', extension: 'webp' }
  }
  return null
}

async function deletePrivateBlob(url: string | undefined) {
  if (!url) return
  try {
    await del(url)
  } catch {
    console.error('[realitycheck] Unable to clean up an unused evidence upload')
  }
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in to submit evidence.' }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'The submission could not be read.' }, { status: 400 })
  }

  const parsed = submissionFieldsSchema.safeParse({
    taskId: formData.get('taskId'),
    evidence: formData.get('evidence'),
    payoutEmail: formData.get('payoutEmail'),
  })
  const file = formData.get('evidenceFile')

  if (!parsed.success || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Add a short note, a valid PayPal email, and an image.' },
      { status: 400 },
    )
  }
  if (file.size === 0 || file.size > 6_000_000) {
    return NextResponse.json(
      { error: 'Choose an image smaller than 6 MB.' },
      { status: 413 },
    )
  }

  const initialTask = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      criteria: tasks.criteria,
      status: tasks.status,
      userId: tasks.userId,
      dueAt: tasks.dueAt,
    })
    .from(tasks)
    .where(eq(tasks.id, parsed.data.taskId))
    .limit(1)
    .then((rows) => rows[0])

  if (
    !initialTask ||
    initialTask.userId === user.id ||
    initialTask.status !== 'open' ||
    (initialTask.dueAt && initialTask.dueAt.getTime() <= Date.now())
  ) {
    return NextResponse.json(
      { error: 'This task is no longer accepting submissions.' },
      { status: 409 },
    )
  }

  const [existingSubmission] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.taskId, parsed.data.taskId),
        eq(submissions.userId, user.id),
      ),
    )
    .limit(1)

  if (existingSubmission) {
    return NextResponse.json(
      { error: 'You have already submitted evidence for this task.' },
      { status: 409 },
    )
  }

  const imageBytes = Buffer.from(await file.arrayBuffer())
  const detectedType = detectImageType(imageBytes)
  if (!detectedType || (file.type && file.type !== detectedType.contentType)) {
    return NextResponse.json(
      { error: 'Upload a valid JPG, PNG, or WebP image.' },
      { status: 415 },
    )
  }

  const submissionId = randomUUID()
  let uploadedUrl: string | undefined

  try {
    const blob = await put(
      `evidence/${user.id}/${parsed.data.taskId}/${submissionId}.${detectedType.extension}`,
      imageBytes,
      {
        access: 'private',
        contentType: detectedType.contentType,
        addRandomSuffix: false,
      },
    )
    uploadedUrl = blob.url

    let aiReview = FALLBACK_EVIDENCE_REVIEW
    try {
      aiReview = await reviewEvidence({
        image: imageBytes,
        mediaType: detectedType.contentType,
        taskTitle: initialTask.title,
        criteria: initialTask.criteria,
        caption: parsed.data.evidence,
      })
    } catch (error) {
      console.error(
        '[realitycheck] Automated evidence review unavailable',
        error instanceof Error ? error.name : 'UnknownError',
      )
    }

    const outcome = await db.transaction(async (tx) => {
      const [lockedTask] = await tx
        .select({
          id: tasks.id,
          userId: tasks.userId,
          status: tasks.status,
          dueAt: tasks.dueAt,
        })
        .from(tasks)
        .where(eq(tasks.id, parsed.data.taskId))
        .for('update')
        .limit(1)

      if (
        !lockedTask ||
        lockedTask.userId === user.id ||
        lockedTask.status !== 'open' ||
        (lockedTask.dueAt && lockedTask.dueAt.getTime() <= Date.now())
      ) {
        return { type: 'closed' as const }
      }

      const [created] = await tx
        .insert(submissions)
        .values({
          id: submissionId,
          taskId: parsed.data.taskId,
          userId: user.id,
          evidence: parsed.data.evidence,
          evidencePathname: blob.pathname,
          payoutEmail: parsed.data.payoutEmail,
          aiReview,
          aiModel: AI_REVIEW_MODEL,
          status: 'pending_review',
        })
        .onConflictDoNothing()
        .returning({ id: submissions.id })

      return created
        ? { type: 'created' as const, id: created.id }
        : { type: 'duplicate' as const }
    })

    if (outcome.type !== 'created') {
      await deletePrivateBlob(uploadedUrl)
      return NextResponse.json(
        {
          error:
            outcome.type === 'duplicate'
              ? 'You have already submitted evidence for this task.'
              : 'This task is no longer accepting submissions.',
        },
        { status: 409 },
      )
    }

    return NextResponse.json({ id: outcome.id }, { status: 201 })
  } catch {
    await deletePrivateBlob(uploadedUrl)
    console.error('[realitycheck] Evidence submission could not be saved')
    return NextResponse.json(
      { error: 'Your evidence could not be saved. Please try again.' },
      { status: 500 },
    )
  }
}
