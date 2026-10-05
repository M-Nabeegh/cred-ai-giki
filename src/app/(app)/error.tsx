"use client"

import Link from "next/link"
import { Button, buttonClass } from "@/components/ui"

/** Shown when the configured data provider can't be reached or returns invalid data. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <div className="text-[13px] font-medium text-bad-ink">Data provider error</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">We couldn&apos;t load customer data</h1>
      <p className="mt-2 text-sm text-ink-2">The scoring engine is fine, but the upstream data source didn&apos;t respond as expected. Check the provider URL and API key, then retry.</p>
      {/* Production builds redact server error messages; the health check shows the real upstream reason. */}
      {process.env.NODE_ENV === "development" && error.message ? <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink-2">{error.message}</pre> : null}
      {error.digest ? <p className="mt-4 text-xs text-ink-3">Reference: <code className="font-mono">{error.digest}</code></p> : null}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/platform/data" className={buttonClass("secondary")}>Check data source</Link>
      </div>
    </div>
  )
}
