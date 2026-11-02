'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSignOut() {
    setPending(true)
    setError('')
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setError('Sign out did not complete. Please try again.')
        return
      }
      router.replace('/sign-in')
      router.refresh()
    } catch {
      setError('Sign out did not complete. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        aria-label={pending ? 'Signing out' : 'Sign out'}
        onClick={handleSignOut}
        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
        ) : (
          <LogOut aria-hidden="true" data-icon="inline-start" />
        )}
        <span className="hidden sm:inline">Sign out</span>
      </Button>
      {error ? <span className="sr-only" role="alert">{error}</span> : null}
    </div>
  )
}
