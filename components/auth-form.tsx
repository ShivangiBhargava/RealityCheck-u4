'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const isSignUp = mode === 'sign-up'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const password = String(formData.get('password') ?? '')
    const name = String(formData.get('name') ?? '').trim()

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError('We could not complete that request. Check your details and try again.')
        return
      }

      router.replace('/')
      router.refresh()
    } catch {
      setError('We could not complete that request. Check your details and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(28rem,0.9fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Image
          src="/realitycheck-neighborhood.png"
          alt="A local volunteer documenting an accessible curb ramp"
          fill
          priority
          className="object-cover opacity-65"
          sizes="55vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar/90 via-sidebar/65 to-sidebar/80" />
        <div className="relative z-10"><Brand /></div>
        <div className="relative z-10 max-w-xl pb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar/50 px-3 py-1.5 text-xs font-medium text-sidebar-foreground">
            <ShieldCheck aria-hidden="true" className="size-4 text-sidebar-primary" />
            Proof that moves a neighborhood forward
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-sidebar-foreground xl:text-5xl">
            Local eyes.
            <br />
            Real impact.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-sidebar-foreground/75">
            Share a clear task, collect private evidence, and let people make the final call.
          </p>
        </div>
        <p className="relative z-10 text-xs text-sidebar-foreground/60">
          PayPal payouts run in sandbox mode during this preview.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden"><Brand /></div>
          <Card className="border-border/80 shadow-xl shadow-foreground/5">
            <CardHeader className="gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                RealityCheck
              </p>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? 'Join your neighborhood and make local checks count.'
                  : 'Sign in to manage tasks, evidence, and rewards.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <Alert variant="destructive" className="mb-5">
                  <AlertTitle>We could not sign you in</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {isSignUp ? (
                    <Field>
                      <FieldLabel htmlFor="name">Name</FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        minLength={2}
                        maxLength={80}
                        required
                        placeholder="Jordan Lee"
                      />
                    </Field>
                  ) : null}
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      minLength={8}
                      maxLength={128}
                      required
                      placeholder="At least 8 characters"
                    />
                    {isSignUp ? (
                      <FieldDescription>Use at least 8 characters.</FieldDescription>
                    ) : null}
                  </Field>
                  <Button type="submit" size="lg" disabled={pending} className="mt-2 w-full">
                    {pending ? (
                      <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <ArrowRight aria-hidden="true" data-icon="inline-start" />
                    )}
                    {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter className="justify-center border-t border-border bg-muted/30 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : 'New to RealityCheck?'}{' '}
              <Link
                href={isSignUp ? '/sign-in' : '/sign-up'}
                className="ml-1 font-semibold text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  )
}
