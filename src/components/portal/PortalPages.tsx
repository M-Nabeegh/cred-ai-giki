import type { ReactNode } from "react"
import Link from "next/link"
import { auditEvents, datasetSummary, decisionRecords, fairnessDiagnostics, formatPkr, getApplicantById, getApplicationById, getPrimaryCustomer, loanApplications, modelMetrics, modelRegistry, organizations, syntheticProfiles } from "@/lib/credai-data"
import { featureDefinitions } from "@/lib/scoring/features"
import { humanReviewDisclaimer, humanScoreDisclaimer } from "@/lib/scoring/explanations"
import { permissionMap } from "@/lib/permissions"
import { MetricCard, ScoreRing, WorkspaceShell } from "./WorkspaceShell"

const customerNav = [
  { href: "/customer/dashboard", label: "Dashboard" },
  { href: "/customer/score", label: "Score" },
  { href: "/customer/data", label: "Data" },
  { href: "/customer/data-sources", label: "Sources" },
  { href: "/customer/loans", label: "Loans" },
  { href: "/customer/activity", label: "Activity" },
  { href: "/customer/settings", label: "Settings" },
  { href: "/customer/help", label: "Help" },
]

const bankNav = [
  { href: "/bank/dashboard", label: "Dashboard" },
  { href: "/bank/applications", label: "Applications" },
  { href: "/bank/applicants", label: "Applicants" },
  { href: "/bank/portfolio", label: "Portfolio" },
  { href: "/bank/decisioning", label: "Decisioning" },
  { href: "/bank/model", label: "Model" },
  { href: "/bank/audit", label: "Audit" },
  { href: "/bank/settings", label: "Settings" },
]

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/data-sources", label: "Data sources" },
  { href: "/admin/synthetic-data", label: "Synthetic data" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/training", label: "Training" },
  { href: "/admin/fairness", label: "Fairness" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/settings", label: "Settings" },
]

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-950/20"><h2 className="text-xl font-semibold text-white">{title}</h2><div className="mt-5">{children}</div></section>
}

function Bar({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const percent = Math.round(value * 100)
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className={inverse ? "text-amber-200" : "text-teal-200"}>{percent}%</span></div><div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${inverse ? "bg-amber-300" : "bg-teal-300"}`} style={{ width: `${percent}%` }} /></div></div>
}

function Disclaimer() {
  return <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50">{humanScoreDisclaimer()}</div>
}

export function CustomerDashboardPage() {
  const profile = getPrimaryCustomer()
  const loans = loanApplications.filter((loan) => loan.customerId === profile.id)
  return <WorkspaceShell workspace="customer" title={`Welcome back, ${profile.name}`} description="A transparent view of your synthetic financial profile, data coverage, and simulated loan readiness." navItems={customerNav}><div className="grid gap-6 lg:grid-cols-4"><MetricCard label="Masked customer ID" value={profile.maskedCustomerId} detail="Fake identifier for demo only" tone="blue" /><MetricCard label="Data coverage" value={`${profile.score.dataCoverage}%`} detail={profile.score.confidence} /><MetricCard label="Model version" value={profile.score.modelVersion} detail="Shown with every score" tone="amber" /><MetricCard label="Loan status" value={loans[0]?.status.replaceAll("_", " ") ?? "No active loan"} detail="Simulated application workflow" /></div><div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Top transparent factors"><div className="grid gap-3 md:grid-cols-2">{profile.score.positiveFactors.slice(0, 3).map((factor) => <div key={factor.name} className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4"><div className="text-sm font-semibold text-teal-100">+ {factor.label}</div><p className="mt-2 text-sm text-slate-300">{factor.explanation}</p></div>)}{profile.score.negativeFactors.slice(0, 3).map((factor) => <div key={factor.name} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><div className="text-sm font-semibold text-amber-100">Review {factor.label}</div><p className="mt-2 text-sm text-slate-300">{factor.explanation}</p></div>)}</div></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="12-month behavior trend"><div className="space-y-4">{profile.observations.slice(-6).map((row) => <Bar key={row.month} label={`${row.month} cash-flow coverage`} value={row.cashFlowCoverage} />)}</div></Panel><Panel title="Simulated data-source status"><div className="space-y-3">{profile.sources.map((source) => <div key={source.source} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="flex justify-between gap-3"><span className="font-medium text-white">{source.label}</span><span className={source.connected ? "text-teal-200" : "text-amber-200"}>{source.connected ? "Consent active" : "Consent paused"}</span></div><p className="mt-2 text-sm text-slate-400">Contributes: {source.contributes.join(", ")}</p></div>)}</div></Panel></div><div className="mt-6"><Disclaimer /></div></WorkspaceShell>
}

export function CustomerScorePage() {
  const profile = getPrimaryCustomer()
  return <WorkspaceShell workspace="customer" title="Score explanation" description="Understand how the demo score was calculated from normalized synthetic features." navItems={customerNav}><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Score metadata"><dl className="grid gap-4 text-sm md:grid-cols-2"><div><dt className="text-slate-400">Calculation date</dt><dd className="text-white">26 Aug 2026</dd></div><div><dt className="text-slate-400">Observation window</dt><dd className="text-white">{profile.observationMonths} months</dd></div><div><dt className="text-slate-400">Model</dt><dd className="text-white">{profile.score.modelVersion}</dd></div><div><dt className="text-slate-400">Confidence</dt><dd className="text-white">{profile.score.confidence}</dd></div></dl><div className="mt-6 space-y-3">{profile.score.reasonCodes.map((reason) => <p key={reason} className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">{reason}</p>)}</div></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="Feature contributions">{profile.score.featureContributions.slice(0, 12).map((factor) => <div key={factor.name} className="mb-3 flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm"><span className="text-slate-200">{factor.name}</span><span className={factor.contribution >= 0 ? "text-teal-200" : "text-amber-200"}>{factor.contribution >= 0 ? "+" : ""}{factor.contribution} pts</span></div>)}</Panel><Panel title="How to improve this simulated profile"><ul className="space-y-3 text-sm text-slate-300">{profile.recommendations.map((item) => <li key={item} className="rounded-xl bg-white/5 p-3">{item}</li>)}<li className="rounded-xl bg-white/5 p-3">Suggestions are educational demo guidance, not guaranteed lending advice.</li></ul></Panel></div></WorkspaceShell>
}

export function CustomerDataPage({ mode = "data" }: { mode?: "data" | "sources" | "settings" | "help" | "activity" | "loans" | "apply" }) {
  const profile = getPrimaryCustomer()
  const title = { data: "Synthetic data", sources: "Data sources and consent", settings: "Customer settings", help: "Customer help", activity: "Activity timeline", loans: "Loan applications", apply: "Simulate loan application" }[mode]
  return <WorkspaceShell workspace="customer" title={title} description="Every record below is synthetic and exists only for the CredAI demonstration." navItems={customerNav}><div className="grid gap-6 lg:grid-cols-2"><Panel title={mode === "apply" ? "Loan product simulator" : "Current simulated controls"}><div className="space-y-4 text-sm text-slate-300">{mode === "apply" ? <><label className="block"><span className="text-slate-200">Amount</span><input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" defaultValue="350000" aria-label="Simulated loan amount" /></label><label className="block"><span className="text-slate-200">Tenure months</span><input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" defaultValue="12" aria-label="Simulated tenure" /></label><p>Estimated installment: {formatPkr(32000)}. Affordability: review recommended. Submission creates a simulated application only.</p></> : profile.sources.map((source) => <div key={source.source} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between"><span>{source.label}</span><span>{source.coverage}% coverage</span></div><p className="mt-2 text-slate-400">Controls: view features, export demo data, revoke simulated consent, reset demo data.</p></div>)}</div></Panel><Panel title={mode === "activity" ? "Recent audit activity" : "Data preview"}><div className="space-y-3">{(mode === "activity" ? auditEvents : profile.observations.slice(-6)).map((item) => "action" in item ? <div key={item.id} className="rounded-xl bg-white/5 p-3 text-sm"><span className="text-white">{item.action}</span><p className="text-slate-400">{item.timestamp} • {item.result}</p></div> : <div key={item.month} className="rounded-xl bg-white/5 p-3 text-sm"><div className="font-medium text-white">{item.month}</div><p className="text-slate-400">Utility {Math.round(item.utilityOnTimeRatio * 100)}%, telecom {Math.round(item.telecomContinuity * 100)}%, repayment {Math.round(item.repaymentRatio * 100)}%</p></div>)}</div></Panel></div><div className="mt-6"><Disclaimer /></div></WorkspaceShell>
}

export function BankDashboardPage() {
  const pending = loanApplications.filter((loan) => loan.status === "in_review" || loan.status === "submitted")
  return <WorkspaceShell workspace="bank" title="Bank review workspace" description={humanReviewDisclaimer()} navItems={bankNav}><div className="grid gap-6 lg:grid-cols-4"><MetricCard label="Applications requiring review" value={String(pending.length)} detail="Synthetic queue" tone="amber" /><MetricCard label="Average demo score" value={String(Math.round(syntheticProfiles.reduce((sum, profile) => sum + profile.score.score, 0) / syntheticProfiles.length))} detail="Portfolio distribution" /><MetricCard label="Model in use" value="v1.0" detail="Logistic demo artifact" tone="blue" /><MetricCard label="Manual reviews" value="100%" detail="Human final decision required" /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><ApplicationsTable /><Panel title="Applications by demo score band"><div className="space-y-4"><Bar label="Strong demo profile" value={0.25} /><Bar label="Stable demo profile" value={0.42} /><Bar label="Building profile" value={0.25} /><Bar label="Needs review" value={0.08} inverse /></div></Panel></div></WorkspaceShell>
}

function ApplicationsTable() {
  return <Panel title="Application queue"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="py-2">Applicant</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>{loanApplications.map((loan) => { const profile = getApplicantById(loan.customerId); return <tr key={loan.id} className="border-t border-white/10"><td className="py-3 text-white">{profile.name}<div className="text-xs text-slate-500">{profile.maskedCustomerId}</div></td><td>{formatPkr(loan.amountPkr)}</td><td className="capitalize">{loan.status.replaceAll("_", " ")}</td><td><Link className="text-teal-200 hover:underline" href={`/bank/applications/${loan.id}`}>Open</Link></td></tr> })}</tbody></table></div></Panel>
}

export function BankApplicationsPage() {
  return <WorkspaceShell workspace="bank" title="Applications" description="Review synthetic loan requests with transparent score explanations and human-review notes." navItems={bankNav}><ApplicationsTable /></WorkspaceShell>
}

export function BankApplicationDetailPage({ id }: { id: string }) {
  const application = getApplicationById(id)
  const profile = getApplicantById(application.customerId)
  return <WorkspaceShell workspace="bank" title={`Review ${profile.name}`} description={humanReviewDisclaimer()} navItems={bankNav}><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Decision-support panel"><div className="grid gap-4 text-sm md:grid-cols-2"><div><span className="text-slate-400">Masked ID</span><div className="text-white">{profile.maskedCustomerId}</div></div><div><span className="text-slate-400">Consent</span><div className="text-teal-200">Simulated consent active</div></div><div><span className="text-slate-400">Amount</span><div className="text-white">{formatPkr(application.amountPkr)}</div></div><div><span className="text-slate-400">Tenure</span><div className="text-white">{application.tenureMonths} months</div></div></div><div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50">Suggested category: {profile.score.score >= 700 ? "review for demo approval" : "refer for manual review"}. This is not automatic approval or rejection.</div><textarea className="mt-5 h-28 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white" defaultValue="Human reviewer notes are required before recording any simulated decision." aria-label="Human review notes" /><div className="mt-4 flex flex-wrap gap-3"><button className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Approve for demo</button><button className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">Refer for manual review</button><button className="rounded-xl bg-red-400 px-4 py-2 text-sm font-semibold text-white">Decline for demo</button></div></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="Top factors">{profile.score.reasonCodes.slice(0, 6).map((reason) => <p key={reason} className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">{reason}</p>)}</Panel><Panel title="Monthly financial timeline">{profile.observations.slice(-6).map((row) => <Bar key={row.month} label={`${row.month} repayment`} value={row.repaymentRatio} />)}</Panel></div></WorkspaceShell>
}

export function BankApplicantDetailPage({ id }: { id: string }) {
  const profile = getApplicantById(id)
  const application = loanApplications.find((loan) => loan.customerId === profile.id) ?? loanApplications[0]
  return <BankApplicationDetailPage id={application.id} />
}

export function BankGenericPage({ page }: { page: "applicants" | "portfolio" | "decisioning" | "model" | "audit" | "settings" }) {
  const title = { applicants: "Applicants", portfolio: "Synthetic portfolio", decisioning: "Decisioning policy", model: "Model transparency", audit: "Bank audit", settings: "Bank settings" }[page]
  return <WorkspaceShell workspace="bank" title={title} description={page === "model" ? "Model outputs are transparent decision-support signals, not real-world predictive claims." : humanReviewDisclaimer()} navItems={bankNav}><div className="grid gap-6 lg:grid-cols-2">{page === "model" ? <><Panel title="Model metrics">{Object.entries(modelMetrics).filter(([, value]) => typeof value === "number").map(([key, value]) => <div key={key} className="mb-3 flex justify-between rounded-xl bg-white/5 p-3 text-sm"><span>{key}</span><span>{String(value)}</span></div>)}</Panel><Panel title="Feature list">{featureDefinitions.slice(0, 12).map((feature) => <p key={feature.name} className="mb-2 rounded-xl bg-white/5 p-3 text-sm text-slate-300">{feature.name} • {feature.direction}</p>)}</Panel></> : page === "audit" ? <AuditTable /> : page === "applicants" ? <Panel title="Synthetic applicants">{syntheticProfiles.slice(0, 10).map((profile) => <Link key={profile.id} href={`/bank/applicants/${profile.id}`} className="mb-3 block rounded-xl bg-white/5 p-3 text-sm text-slate-200 hover:bg-white/10">{profile.name} • {profile.maskedCustomerId} • {profile.score.score}</Link>)}</Panel> : <><MetricCard label="Synthetic records" value={String(syntheticProfiles.length)} detail="Demo portfolio sample" /><MetricCard label="Human decisions" value={String(decisionRecords.length)} detail="Recorded demo decisions" tone="amber" /><Panel title="Policy notes"><p className="text-sm text-slate-300">Decision options require a reason. Model output cannot automatically approve or decline a real loan.</p></Panel></>}</div></WorkspaceShell>
}

export function AdminDashboardPage({ page = "dashboard", id }: { page?: string; id?: string }) {
  const title = page === "dashboard" ? "Admin dashboard" : page.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
  return <WorkspaceShell workspace="admin" title={title} description="Manage synthetic data, demo users, model versions, fairness diagnostics, and audit events." navItems={adminNav}><div className="grid gap-6 lg:grid-cols-4"><MetricCard label="Demo customers" value={String(datasetSummary.profileCount)} detail="Deterministic synthetic profiles" /><MetricCard label="Active demo banks" value={String(organizations.filter((org) => org.type === "bank").length)} detail="Synthetic organizations" tone="blue" /><MetricCard label="Current model" value="v1.0" detail={modelRegistry[1].type} tone="amber" /><MetricCard label="Audit events" value={String(auditEvents.length)} detail="Masked synthetic records" /></div><div className="mt-6 grid gap-6 lg:grid-cols-2">{page === "synthetic-data" ? <SyntheticDataPanel /> : page === "models" || id ? <ModelRegistryPanel id={id} /> : page === "fairness" ? <FairnessPanel /> : page === "audit" ? <AuditTable /> : page === "users" ? <Panel title="Demo users and permissions">{Object.entries(permissionMap).map(([role, permissions]) => <div key={role} className="mb-3 rounded-xl bg-white/5 p-3 text-sm"><div className="font-semibold text-white">{role}</div><div className="text-slate-400">{permissions.join(", ")}</div></div>)}</Panel> : <><Panel title="System status"><div className="space-y-3 text-sm text-slate-300"><p>Generator seed: {datasetSummary.seed}</p><p>Last training run: {datasetSummary.createdAt}</p><p>Data-source health: simulated connectors online.</p><p>Review queue: {loanApplications.filter((loan) => loan.status === "in_review").length} pending manual reviews.</p></div></Panel><Panel title="Recent audit events"><AuditRows /></Panel></>}</div></WorkspaceShell>
}

function SyntheticDataPanel() {
  return <><Panel title="Generator controls"><div className="grid gap-4 text-sm text-slate-300"><label>Dataset seed<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" defaultValue={datasetSummary.seed} /></label><label>Customers<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" defaultValue={datasetSummary.profileCount} /></label><label>Months<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" defaultValue="12" /></label><p>Actions are demo-only: generate dataset, reset demo data, export JSON, export CSV.</p></div></Panel><Panel title="Provenance"><pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify(datasetSummary, null, 2)}</pre></Panel></>
}

function ModelRegistryPanel({ id }: { id?: string }) {
  const model = modelRegistry.find((entry) => entry.id === id) ?? modelRegistry[1]
  return <><Panel title="Model registry">{modelRegistry.map((entry) => <Link key={entry.id} href={`/admin/models/${entry.id}`} className="mb-3 block rounded-xl bg-white/5 p-3 text-sm text-slate-200 hover:bg-white/10">{entry.name} • {entry.status}</Link>)}</Panel><Panel title={model.name}><p className="text-sm text-slate-300">{model.summary}</p><div className="mt-4 space-y-2 text-sm text-slate-300"><p>Training rows: 1,600</p><p>Test rows: 400</p><p>Train/test split: deterministic 80/20</p><p>Actions: publish to demo, rollback previous demo model.</p></div></Panel></>
}

function FairnessPanel() {
  return <Panel title="Synthetic fairness diagnostics"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th>Group</th><th>Selection</th><th>TPR</th><th>FPR</th><th>Average</th></tr></thead><tbody>{fairnessDiagnostics.map((group) => <tr key={group.group} className="border-t border-white/10"><td className="py-3">{group.group}</td><td>{Math.round(group.selectionRate * 100)}%</td><td>{Math.round(group.truePositiveRate * 100)}%</td><td>{Math.round(group.falsePositiveRate * 100)}%</td><td>{group.averageScore}</td></tr>)}</tbody></table><p className="mt-4 text-sm text-amber-100">Synthetic diagnostics only; this does not prove a real model is fair.</p></div></Panel>
}

function AuditRows() {
  return <div className="space-y-3">{auditEvents.map((event) => <div key={event.id} className="rounded-xl bg-white/5 p-3 text-sm"><div className="flex justify-between gap-3"><span className="text-white">{event.action}</span><span className="text-slate-400">{event.timestamp}</span></div><p className="text-slate-400">{event.organization} • {event.role} • {event.resource}</p></div>)}</div>
}

function AuditTable() {
  return <Panel title="Masked audit events"><AuditRows /></Panel>
}
