import Image from 'next/image'
import Link from 'next/link'

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
      <Image
        src="/icon.svg"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        priority
        className="size-8 shrink-0 rounded-lg"
      />
      <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
        RealityCheck
      </span>
    </Link>
  )
}
