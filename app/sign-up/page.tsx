import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { getCurrentSession } from '@/lib/auth-helpers'

export default async function SignUpPage() {
  const session = await getCurrentSession()
  if (session?.user) redirect('/')
  return <AuthForm mode="sign-up" />
}
