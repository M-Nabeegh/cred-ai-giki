import Link from "next/link"
import { ArrowRight, Building2, ShieldCheck, Smartphone } from "lucide-react"
import { SiteFooter, SiteHeader } from "@/components/site/chrome"
import { Avatar } from "@/components/ui"

export const metadata = { title: "Live demo" }

const roles = [
  { icon: Smartphone, name: "Ayesha Khan", role: "Customer", href: "/customer", body: "Freelance designer in Lahore with no loan history. See her score, switch data sources on and off, and apply for a laptop loan." },
  { icon: Building2, name: "Sara Mirza", role: "Credit analyst", href: "/lender", body: "Works the application queue at a microfinance lender. Review scores and cash flow, record decisions, adjust the credit policy." },
  { icon: ShieldCheck, name: "Platform team", role: "Model risk", href: "/platform", body: "Owns the model. Check discrimination, calibration and fairness, the live data-source connection, and the audit trail." },
]

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.03em]">Pick a seat</h1>
        <p className="mt-3 max-w-2xl text-ink-2">No sign-up. Everything you do is saved in this browser only, so you can apply as Ayesha and then review the same application as Sara. A checklist in the sidebar walks you through the full loop.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Link key={role.role} href={role.href} className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-ink-3">
              <div className="flex items-center gap-3">
                <Avatar name={role.name} className="h-10 w-10" />
                <div><div className="font-semibold">{role.name}</div><div className="text-[13px] text-ink-3">{role.role}</div></div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-2">{role.body}</p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-medium">Continue as {role.name.split(" ")[0]}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
            </Link>
          ))}
        </div>
        <div className="mt-10 rounded-xl border border-line bg-surface p-5 text-sm text-ink-2">
          <div className="font-medium text-ink">Suggested path (3 minutes)</div>
          <ol className="mt-2 grid gap-1 sm:grid-cols-2">
            <li>1. As Ayesha, turn off the bank account and watch the score move.</li>
            <li>2. Apply for PKR 150,000 over 12 months.</li>
            <li>3. As Sara, open the new application and decide it.</li>
            <li>4. Raise the approval threshold under Policy; see the queue shift.</li>
            <li>5. Open the Platform model card and fairness audit.</li>
            <li>6. Find all of it in the audit log.</li>
          </ol>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
