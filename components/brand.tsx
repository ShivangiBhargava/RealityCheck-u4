import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <img
        src="https://thesvg.org/icons/paypal/wordmarkLight.svg"
        alt="PayPal"
        width={64}
        height={22}
        className="h-5 w-auto"
      />
      <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
        RealityCheck
      </span>
    </Link>
  )
}
