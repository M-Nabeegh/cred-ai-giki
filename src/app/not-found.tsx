import Link from "next/link"
import { Logo } from "@/components/logo"
import { buttonClass } from "@/components/ui"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center px-6">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">Page not found</h1>
      <p className="mt-2 text-sm text-ink-2">That record or page doesn&apos;t exist in this dataset.</p>
      <div className="mt-6 flex gap-2"><Link href="/demo" className={buttonClass()}>Open the demo</Link><Link href="/" className={buttonClass("secondary")}>Home</Link></div>
    </main>
  )
}
