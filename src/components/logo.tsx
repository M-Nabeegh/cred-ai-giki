import { cn } from "@/lib/utils"

/** The mark is the score gauge itself: a 3/4 arc with the needle-dot at "good". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M9.2 21.6a9 9 0 1 1 13.6 0" fill="none" stroke="var(--logo-arc, #fff)" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
      <path d="M9.2 21.6a9 9 0 0 1 13.4-12.4" fill="none" stroke="var(--logo-arc, #fff)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22.6" cy="9.2" r="2.2" fill="#3987e5" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-[-0.02em]", className)}>
      <LogoMark className="text-ink [--logo-arc:var(--bg)]" />
      <span className="text-[17px]">CredAI</span>
    </span>
  )
}
