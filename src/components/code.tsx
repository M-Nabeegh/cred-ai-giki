import { cn } from "@/lib/utils"

export function Code({ children, title, className }: { children: string; title?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-line bg-[#0f1013] text-[#e6e6e3]", className)}>
      {title ? <div className="border-b border-white/10 px-4 py-2 text-xs text-white/50">{title}</div> : null}
      <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed"><code className="font-mono">{children}</code></pre>
    </div>
  )
}
