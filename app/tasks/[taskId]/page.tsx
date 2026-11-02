import { notFound } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { TaskDetailsView } from '@/components/task-details-view'
import { requireUser } from '@/lib/auth-helpers'
import { getTaskPageData } from '@/lib/queries'
import { getPayPalConnectionStatus } from '@/lib/paypal'

type PageProps = {
  params: Promise<{ taskId: string }>
}

export default async function TaskPage({ params }: PageProps) {
  const user = await requireUser()
  const { taskId } = await params
  const data = await getTaskPageData(taskId, user.id)
  if (!data) notFound()
  if (!data.isOwner && data.task.status !== 'open' && !data.mySubmission) notFound()

  const needsPayPalStatus =
    data.isOwner &&
    data.ownerSubmissions.some(
      ({ submission }) =>
        submission.status === 'approved' ||
        submission.status === 'payout_submitted' ||
        submission.status === 'paid',
    )
  const paypalStatus = needsPayPalStatus
    ? await getPayPalConnectionStatus(user.id)
    : 'not_connected'

  return (
    <AppShell user={user} active={data.isOwner ? 'account' : 'explore'}>
      <TaskDetailsView
        task={data.task}
        ownerName={data.ownerName}
        isOwner={data.isOwner}
        mySubmission={data.mySubmission}
        ownerSubmissions={data.ownerSubmissions}
        paypalStatus={paypalStatus}
      />
    </AppShell>
  )
}
