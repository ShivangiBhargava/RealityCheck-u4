import { createHash } from 'node:crypto'
import { and, eq, exists, isNull, or } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { submissions, tasks } from '@/lib/db/schema'
import { getRequestUser } from '@/lib/auth-helpers'
import { getPayPalTokenForUser } from '@/lib/paypal'
import { NoValidTokenError, UserAuthorizationRequiredError } from '@vercel/connect'

export const runtime = 'nodejs'
export const maxDuration = 30

type RouteContext = {
  params: Promise<{ submissionId: string }>
}

type PayPalErrorPayload = {
  name?: unknown
  debug_id?: unknown
  details?: Array<{
    field?: unknown
    issue?: unknown
  }>
  batch_header?: { payout_batch_id?: unknown }
}

function getSenderBatchId(submissionId: string) {
  return `rc_${createHash('sha256').update(submissionId).digest('hex').slice(0, 27)}`
}

async function markPayoutStatus(submissionId: string, payoutStatus: string) {
  await db
    .update(submissions)
    .set({ payoutStatus, updatedAt: new Date() })
    .where(eq(submissions.id, submissionId))
}

function getPayPalRejectionMessage(name: string) {
  switch (name.toUpperCase()) {
    case 'INSUFFICIENT_FUNDS':
      return 'The PayPal Sandbox sender does not have enough funds. Add Sandbox balance and try again.'
    case 'AUTHORIZATION_ERROR':
    case 'PERMISSION_DENIED':
      return 'PayPal denied payout access. Reconnect the Sandbox sender account and verify Payouts permission is enabled.'
    case 'VALIDATION_ERROR':
      return 'PayPal rejected the payout details. Verify the recipient’s PayPal Sandbox email and task reward amount.'
    default:
      return 'PayPal rejected the payout. Verify the Sandbox sender has Payouts access and the recipient details are correct.'
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in to send a payout.' }, { status: 401 })

  const { submissionId } = await params
  const [record] = await db
    .select({
      taskId: tasks.id,
      ownerId: tasks.userId,
      taskTitle: tasks.title,
      rewardCents: tasks.rewardCents,
      submissionStatus: submissions.status,
      payoutStatus: submissions.payoutStatus,
      payoutEmail: submissions.payoutEmail,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .where(eq(submissions.id, submissionId))
    .limit(1)

  if (!record || record.ownerId !== user.id) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }
  if (record.submissionStatus !== 'approved') {
    return NextResponse.json({ error: 'Approve the evidence before paying.' }, { status: 409 })
  }
  if (
    record.payoutStatus === 'sending' ||
    record.payoutStatus === 'unknown' ||
    record.payoutStatus === 'submitted' ||
    record.payoutStatus === 'paid'
  ) {
    return NextResponse.json(
      { error: 'This payout is already processing or has been submitted.' },
      { status: 409 },
    )
  }

  let accessToken: string
  try {
    accessToken = await getPayPalTokenForUser(user.id)
  } catch (error) {
    if (
      error instanceof UserAuthorizationRequiredError ||
      error instanceof NoValidTokenError
    ) {
      return NextResponse.json(
        { error: 'Connect your PayPal account first.', code: 'paypal_authorization_required' },
        { status: 409 },
      )
    }
    console.error('[realitycheck] PayPal token was unavailable')
    return NextResponse.json(
      { error: 'PayPal is temporarily unavailable. Please try again.' },
      { status: 503 },
    )
  }

  const senderBatchId = getSenderBatchId(submissionId)
  const ownedTask = db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, submissions.taskId), eq(tasks.userId, user.id)))
  const [claimed] = await db
    .update(submissions)
    .set({ payoutStatus: 'sending', updatedAt: new Date() })
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(submissions.status, 'approved'),
        exists(ownedTask),
        or(isNull(submissions.payoutStatus), eq(submissions.payoutStatus, 'failed')),
        isNull(submissions.payoutBatchId),
      ),
    )
    .returning({ id: submissions.id })

  if (!claimed) {
    return NextResponse.json(
      { error: 'This payout is already processing. Refresh the page.' },
      { status: 409 },
    )
  }

  let response: Response
  try {
    response = await fetch('https://api-m.sandbox.paypal.com/v1/payments/payouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': senderBatchId,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          recipient_type: 'EMAIL',
          email_subject: 'Your RealityCheck reward is on its way',
          email_message: 'Thanks for helping make your neighborhood better.',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: (record.rewardCents / 100).toFixed(2),
              currency: 'USD',
            },
            note: `RealityCheck reward: ${record.taskTitle}`.slice(0, 255),
            receiver: record.payoutEmail,
            sender_item_id: submissionId,
          },
        ],
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    })
  } catch {
    await markPayoutStatus(submissionId, 'unknown')
    return NextResponse.json(
      {
        error:
          'PayPal did not confirm the request. Check the Sandbox payout history before retrying.',
        code: 'payout_status_unknown',
      },
      { status: 502 },
    )
  }

  const payload = (await response.json().catch(() => null)) as PayPalErrorPayload | null

  if (!response.ok) {
    const errorName = typeof payload?.name === 'string' ? payload.name : 'UNKNOWN_ERROR'
    const debugId = typeof payload?.debug_id === 'string' ? payload.debug_id : undefined
    const issues = Array.isArray(payload?.details)
      ? payload.details
          .map((detail) => ({
            field: typeof detail.field === 'string' ? detail.field : undefined,
            issue: typeof detail.issue === 'string' ? detail.issue : undefined,
          }))
          .filter((detail) => detail.field || detail.issue)
      : []
    const statusIsUncertain =
      response.status >= 500 ||
      response.status === 408 ||
      response.status === 409 ||
      errorName.toLowerCase().includes('duplicate')

    // Log PayPal's safe diagnostic identifiers, not the recipient email, access token,
    // or raw response body. The debug ID can be used when contacting PayPal support.
    console.error('[realitycheck] PayPal payout rejected', {
      status: response.status,
      name: errorName,
      debugId,
      issues,
    })

    await markPayoutStatus(submissionId, statusIsUncertain ? 'unknown' : 'failed')
    return NextResponse.json(
      {
        error: statusIsUncertain
          ? 'PayPal did not confirm the request. Check the Sandbox payout history before retrying.'
          : getPayPalRejectionMessage(errorName),
        code: statusIsUncertain ? 'payout_status_unknown' : 'payout_failed',
        ...(debugId ? { reference: debugId } : {}),
      },
      { status: 502 },
    )
  }

  const payoutBatchId = payload?.batch_header?.payout_batch_id
  if (typeof payoutBatchId !== 'string' || payoutBatchId.length === 0) {
    await markPayoutStatus(submissionId, 'unknown')
    return NextResponse.json(
      {
        error:
          'PayPal accepted the request but did not return a batch reference. Check Sandbox payout history before retrying.',
        code: 'payout_status_unknown',
      },
      { status: 502 },
    )
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(submissions)
        .set({
          status: 'payout_submitted',
          payoutStatus: 'submitted',
          payoutBatchId,
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, submissionId))
      await tx
        .update(tasks)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(
          and(
            eq(tasks.id, record.taskId),
            eq(tasks.userId, user.id),
            eq(tasks.status, 'closed'),
          ),
        )
    })
  } catch {
    await markPayoutStatus(submissionId, 'unknown')
    return NextResponse.json(
      {
        error:
          'PayPal accepted the request, but the app could not save its reference. Check Sandbox payout history before retrying.',
        code: 'payout_status_unknown',
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ status: 'submitted', payoutBatchId, sandbox: true })
}
