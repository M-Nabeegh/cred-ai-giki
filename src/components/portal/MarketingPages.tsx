import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Building2, CheckCircle2, Database, LockKeyhole, ShieldCheck, Smartphone, Users, type LucideIcon } from "lucide-react"

const publicLinks = [
  ["How it works", "/how-it-works"],
  ["For customers", "/for-customers"],
  ["For banks", "/for-banks"],
  ["Security", "/security"],
  ["About", "/about"],
  ["Contact", "/contact"],
]

function Shell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#111827)] text-slate-100"><main>{children}</main><Footer /></div>
}

function PublicNav() {
  return <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-400 font-black text-slate-950">C</span><span className="text-xl font-bold">CredAI</span></Link><div className="hidden gap-6 md:flex">{publicLinks.map(([label, href]) => <Link key={href} href={href} className="text-sm text-slate-300 hover:text-white">{label}</Link>)}</div><Link href="/login" className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Open demo</Link></nav>
}

function Footer() {
  return <footer className="border-t border-white/10 px-4 py-10 text-sm text-slate-400"><div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3"><div><div className="text-lg font-bold text-white">CredAI</div><p className="mt-2">Transparent alternative credit intelligence for everyday financial behavior.</p></div><div className="flex flex-wrap gap-3">{publicLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}</div><p>Prototype disclaimer: CredAI uses synthetic data and does not provide a real credit score, financial advice, loan approval, or credit decision.</p></div></footer>
}

function Section({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="max-w-3xl"><div className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-200">{eyebrow}</div><h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">{title}</h1><p className="mt-5 text-lg leading-8 text-slate-300">{text}</p></div>{children}</section>
}

function Card({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-950/30"><Icon className="h-8 w-8 text-teal-300" /><h3 className="mt-5 text-xl font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{text}</p></div>
}

export function HomePage() {
  return <Shell><PublicNav /><Section eyebrow="Synthetic-data prototype" title="Transparent alternative credit intelligence for everyday financial behavior." text="CredAI demonstrates how consent-led, simulated utility, telecom, wallet, cash-flow, and repayment patterns could support fairer human credit review in Pakistan."><div className="mt-10 flex flex-col gap-3 sm:flex-row"><Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-teal-400 px-6 py-3 font-semibold text-slate-950">Launch demo <ArrowRight className="ml-2 h-4 w-4" /></Link><Link href="/how-it-works" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 font-semibold text-white hover:bg-white/10">See how it works</Link></div><div className="mt-12 grid gap-6 md:grid-cols-3"><Card icon={Smartphone} title="Customer clarity" text="Customers see a whole-number demo score, score band, data coverage, top factors, missing-data warnings, and educational recommendations." /><Card icon={Building2} title="Bank decision support" text="Reviewers inspect applicants, simulate loan terms, record reasons, and keep the model output separate from final human decisions." /><Card icon={Database} title="Admin governance" text="Admins manage synthetic datasets, feature weights, model versions, fairness diagnostics, and masked audit events." /></div></Section><Section eyebrow="Signals" title="What the demo evaluates" text="CredAI scores consistency, payment discipline, regularity, stability, tenure, repayment behavior, and data completeness. It does not treat raw transaction volume as proof of creditworthiness."><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{["Payment consistency", "Cash-flow regularity", "Utility bill behavior", "Telecom continuity", "Digital wallet patterns", "Simulated repayment behavior"].map((item) => <div key={item} className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4 text-teal-50"><CheckCircle2 className="mb-3 h-5 w-5" />{item}</div>)}</div></Section><Section eyebrow="Safety" title="Built to be honest about limits" text="All data is synthetic, all integrations are simulated, and every score is a teaching artifact. The product never claims real partnerships, regulatory status, or automated lending authority." /></Shell>
}

export function MarketingPage({ page }: { page: "how" | "customers" | "banks" | "security" | "about" | "contact" }) {
  const copy = {
    how: ["How CredAI works", "Customers grant simulated consent, choose fake data sources, preview generated records, and receive a transparent score explanation tied to model-versioned features."],
    customers: ["For customers", "Explore a simulated financial profile with masked identifiers, source controls, improvement suggestions, and loan-application education."],
    banks: ["For banks", "Review synthetic applicants with explainability, affordability context, model metadata, and required human review notes."],
    security: ["Security and privacy posture", "CredAI stores no real credentials, connects to no real financial accounts, masks demo identifiers, and clearly labels every source as simulated."],
    about: ["About CredAI", "CredAI is a coursework and portfolio prototype exploring transparent credit-intelligence design for Pakistan without claiming production readiness."],
    contact: ["Contact", "For demo feedback, use the repository workflow. Do not send real CNICs, financial statements, OTPs, passwords, or bank credentials."],
  }[page]
  return <Shell><PublicNav /><Section eyebrow="CredAI" title={copy[0]} text={copy[1]}><div className="mt-10 grid gap-6 md:grid-cols-3"><Card icon={ShieldCheck} title="Transparent scoring" text="Feature contributions, reason codes, confidence, and model version appear with every score." /><Card icon={LockKeyhole} title="Consent-first demo" text="Source status, revoke controls, export/reset language, and synthetic provenance stay visible." /><Card icon={Users} title="Human oversight" text="Bank workflows require qualified reviewer judgment and never automate real lending decisions." /></div><div className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6 text-amber-50">CredAI is a synthetic-data prototype. It does not provide a real credit score, financial advice, loan approval, or credit decision.</div></Section></Shell>
}
