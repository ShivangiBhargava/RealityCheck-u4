import { AppShell } from '@/components/app-shell'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { getDashboardData } from '@/lib/queries'
import { requireUser } from '@/lib/auth-helpers'

export default async function DashboardPage() {
  const user = await requireUser()
  const data = await getDashboardData(user.id)
  const firstName = user.name.trim().split(/\s+/)[0] || 'neighbor'

  return (
    <AppShell user={user} active="dashboard">
      <DashboardView firstName={firstName} stats={data.stats} recentTasks={data.recentTasks} />
    </AppShell>
  )
}
