import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <span className="inline-flex h-7 items-center rounded-full bg-[#00b8e4] px-3 text-sm font-bold tracking-tight text-[#062f40]">
        PayPal
      </span>
      <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
        RealityCheck
      </span>
    </Link>
  )
}
