import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Brand } from '@/components/brand'
import { SignOutButton } from '@/components/sign-out-button'
import { cn } from '@/lib/utils'

type AppUser = {
  name: string
  email: string
}

type NavItem = {
  href: string
  label: string
  mobileLabel: string
  icon: LucideIcon
  key: 'dashboard' | 'explore' | 'account'
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', mobileLabel: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/explore', label: 'Explore tasks', mobileLabel: 'Explore', icon: Compass, key: 'explore' },
  { href: '/account', label: 'My activity', mobileLabel: 'Activity', icon: ClipboardCheck, key: 'account' },
]

function NavLinks({ active, mobile = false }: { active: NavItem['key']; mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}
      className={cn('flex gap-1.5', mobile ? 'overflow-x-auto md:hidden' : 'flex-col')}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const selected = item.key === active
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              mobile && 'shrink-0 whitespace-nowrap',
              selected
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {mobile ? item.mobileLabel : item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({
  children,
  user,
  active,
}: {
  children: ReactNode
  user: AppUser
  active: NavItem['key']
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/65">{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 pb-10 pt-5 sm:px-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8 md:pt-8">
        <aside className="hidden md:block">
          <div className="sticky top-24 flex flex-col gap-5">
            <NavLinks active={active} />
            <div className="rounded-2xl border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <UserRound aria-hidden="true" className="size-4 text-sidebar-primary" />
                Clear proof. Fair rewards.
              </div>
              <p className="text-xs leading-relaxed text-sidebar-foreground/70">
                Every submission stays private. A person always makes the final review.
              </p>
              <Link
                href="/tasks/new"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sidebar-primary hover:underline"
              >
                Post a neighborhood check
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <NavLinks active={active} mobile />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
