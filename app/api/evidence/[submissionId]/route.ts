import { eq } from 'drizzle-orm'
import { get } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { submissions, tasks } from '@/lib/db/schema'
import { getRequestUser } from '@/lib/auth-helpers'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ submissionId: string }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getRequestUser(request)
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { submissionId } = await params
  const [record] = await db
    .select({
      pathname: submissions.evidencePathname,
      contributorId: submissions.userId,
      ownerId: tasks.userId,
    })
    .from(submissions)
    .innerJoin(tasks, eq(submissions.taskId, tasks.id))
    .where(eq(submissions.id, submissionId))
    .limit(1)

  if (
    !record ||
    (record.contributorId !== user.id && record.ownerId !== user.id)
  ) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const result = await get(record.pathname, {
      access: 'private',
      ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
    })

    if (!result) return new NextResponse('Not found', { status: 404 })
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          'Cache-Control': 'private, no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Content-Disposition': 'inline',
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Evidence is unavailable.' }, { status: 404 })
  }
}
