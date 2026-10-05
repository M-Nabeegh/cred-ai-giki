import Link from "next/link"
import { Logo } from "../logo"
import { ButtonLink } from "../ui"

export const REPO_URL = "https://github.com/M-Nabeegh/cred-ai-giki"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/"><Logo /></Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-2 md:flex">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#try" className="hover:text-ink">Try the model</Link>
          <Link href="/platform" className="hover:text-ink">Model card</Link>
          <Link href="/developers" className="hover:text-ink">API</Link>
          <a href={REPO_URL} className="hover:text-ink">GitHub</a>
        </nav>
        <ButtonLink href="/demo" size="sm">Open the demo</ButtonLink>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3"><Logo className="text-ink" /><span>Open-source credit scoring from everyday payments.</span></div>
        <div className="flex gap-5"><Link href="/developers" className="hover:text-ink">API</Link><Link href="/platform" className="hover:text-ink">Model card</Link><a href={REPO_URL} className="hover:text-ink">Source</a></div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ink-3 sm:px-6">Research prototype. The public demo runs on simulated customers; it stores no personal data and makes no real lending decisions. Bank, lender and customer names are fictional.</div>
    </footer>
  )
}
