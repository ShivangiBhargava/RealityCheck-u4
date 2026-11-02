import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <span className="inline-flex h-7 items-center rounded-md bg-sidebar-primary px-2.5 text-sm font-bold tracking-tight text-sidebar-primary-foreground">
        PayPal
      </span>
      <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
        RealityCheck
      </span>
    </Link>
  )
}
