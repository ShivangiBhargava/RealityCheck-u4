import { AppShell } from '@/components/app-shell'
import { AccountView } from '@/components/account-view'
import { requireUser } from '@/lib/auth-helpers'
import { getAccountData } from '@/lib/queries'
import { getPayPalConnectionStatus } from '@/lib/paypal'

export default async function AccountPage() {
  const user = await requireUser()
  const [data, paypalStatus] = await Promise.all([
    getAccountData(user.id),
    getPayPalConnectionStatus(user.id),
  ])

  return (
    <AppShell user={user} active="account">
      <AccountView
        user={{ name: user.name, email: user.email }}
        paypalStatus={paypalStatus}
        data={data}
      />
    </AppShell>
  )
}
