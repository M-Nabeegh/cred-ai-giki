"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  auditEvents as seededAuditEvents,
  datasetSummary,
  fairnessDiagnostics,
  formatPkr,
  getApplicantById,
  getPrimaryCustomer,
  modelMetrics,
  modelRegistry,
  organizations,
  syntheticProfiles,
  type DecisionRecord,
  type SyntheticProfile,
} from "@/lib/credai-data"
import { profileWithStoreConsent, useDemoStore } from "@/lib/demo-store"
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

const activeModel = modelRegistry.find((entry) => entry.status === "active") ?? modelRegistry[modelRegistry.length - 1]

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-slate-950/20"><h2 className="text-xl font-semibold text-white">{title}</h2><div className="mt-5">{children}</div></section>
}

function Notice({ notice }: { notice: ReturnType<typeof useDemoStore>["notice"] }) {
  if (!notice) return null
  const classes = notice.tone === "success" ? "border-teal-300/30 bg-teal-300/10 text-teal-50" : "border-amber-300/30 bg-amber-300/10 text-amber-50"
  return <div className={`mb-6 rounded-2xl border p-4 text-sm ${classes}`}>{notice.message}</div>
}

function MissingRecord({ workspace, title, detail }: { workspace: "bank" | "admin"; title: string; detail: string }) {
  return <WorkspaceShell workspace={workspace} title={title} description="The requested synthetic record was not found in the deterministic demo dataset." navItems={workspace === "bank" ? bankNav : adminNav}><Panel title="No silent fallback"><p className="text-sm text-slate-300">{detail}</p><Link href={workspace === "bank" ? "/bank/applications" : "/admin/models"} className="mt-5 inline-flex rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Return to list</Link></Panel></WorkspaceShell>
}

function Bar({ label, value, inverse = false }: { label: string; value: number | null; inverse?: boolean }) {
  if (value === null || Number.isNaN(value)) return <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{label}: source unavailable</div>
  const percent = Math.round(value * 100)
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className={inverse ? "text-amber-200" : "text-teal-200"}>{percent}%</span></div><div className="h-2 rounded-full bg-white/10"><div className={`h-2 rounded-full ${inverse ? "bg-amber-300" : "bg-teal-300"}`} style={{ width: `${percent}%` }} /></div></div>
}

function formatObservation(value: number | null) {
  return value === null ? "n/a" : `${Math.round(value * 100)}%`
}

function readReviewerRole(): DecisionRecord["reviewerRole"] {
  if (typeof window === "undefined") return "bank_analyst"
  return localStorage.getItem("credai_role") === "bank_manager" ? "bank_manager" : "bank_analyst"
}

function readActorId(fallback: string) {
  if (typeof window === "undefined") return fallback
  return localStorage.getItem("credai_user_id") ?? fallback
}

function Disclaimer() {
  return <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50">{humanScoreDisclaimer()}</div>
}

export function CustomerDashboardPage() {
  const { state, actions } = useDemoStore()
  const profile = profileWithStoreConsent(getPrimaryCustomer(), state)
  const loans = state.applications.filter((loan) => loan.customerId === profile.id)
  return <WorkspaceShell workspace="customer" title={`Welcome back, ${profile.name}`} description="A transparent view of your synthetic financial profile, data coverage, and simulated loan readiness." navItems={customerNav}><div className="grid gap-6 lg:grid-cols-4"><MetricCard label="Masked customer ID" value={profile.maskedCustomerId} detail="Fake identifier for demo only" tone="blue" /><MetricCard label="Data coverage" value={`${profile.score.dataCoverage}%`} detail={profile.score.confidence} /><MetricCard label="Model version" value={profile.score.modelVersion} detail="Shown with every score" tone="amber" /><MetricCard label="Loan status" value={loans[0]?.status.replaceAll("_", " ") ?? "No active loan"} detail="Simulated application workflow" /></div><div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Top transparent factors"><div className="grid gap-3 md:grid-cols-2">{profile.score.positiveFactors.slice(0, 3).map((factor) => <div key={factor.name} className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4"><div className="text-sm font-semibold text-teal-100">+ {factor.label}</div><p className="mt-2 text-sm text-slate-300">{factor.explanation}</p></div>)}{profile.score.negativeFactors.slice(0, 3).map((factor) => <div key={factor.name} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><div className="text-sm font-semibold text-amber-100">Review {factor.label}</div><p className="mt-2 text-sm text-slate-300">{factor.explanation}</p></div>)}</div></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="12-month behavior trend"><div className="space-y-4">{profile.observations.slice(-6).map((row) => <Bar key={row.month} label={`${row.month} cash-flow coverage`} value={row.cashFlowCoverage} />)}</div></Panel><Panel title="Simulated data-source status"><SourceControls profile={profile} actions={actions} /></Panel></div><div className="mt-6"><Disclaimer /></div></WorkspaceShell>
}

export function CustomerScorePage() {
      const { state } = useDemoStore()
  const profile = profileWithStoreConsent(getPrimaryCustomer(), state)
  return <WorkspaceShell workspace="customer" title="Score explanation" description="Understand how the demo score was calculated from normalized synthetic features." navItems={customerNav}><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Score metadata"><dl className="grid gap-4 text-sm md:grid-cols-2"><div><dt className="text-slate-400">Calculation date</dt><dd className="text-white">26 Aug 2026</dd></div><div><dt className="text-slate-400">Observation window</dt><dd className="text-white">{profile.observationMonths} months</dd></div><div><dt className="text-slate-400">Model</dt><dd className="text-white">{profile.score.modelVersion}</dd></div><div><dt className="text-slate-400">Confidence</dt><dd className="text-white">{profile.score.confidence}</dd></div></dl><div className="mt-6 space-y-3">{profile.score.reasonCodes.map((reason) => <p key={reason} className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">{reason}</p>)}</div></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="Feature contributions">{profile.score.featureContributions.slice(0, 12).map((factor) => <div key={factor.name} className="mb-3 flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm"><span className="text-slate-200">{factor.name}</span><span className={factor.contribution >= 0 ? "text-teal-200" : "text-amber-200"}>{factor.contribution >= 0 ? "+" : ""}{factor.contribution} pts</span></div>)}</Panel><Panel title="Missing-data warnings">{profile.score.missingDataWarnings.length ? profile.score.missingDataWarnings.map((warning) => <p key={warning} className="mb-3 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">{warning}</p>) : <p className="text-sm text-slate-300">No current source-level missing-data warnings for this demo profile.</p>}</Panel></div></WorkspaceShell>
}

function SourceControls({ profile, actions }: { profile: SyntheticProfile; actions: ReturnType<typeof useDemoStore>["actions"] }) {
  return <div className="space-y-3">{profile.sources.map((source) => <div key={source.source} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-medium text-white">{source.label}</span><span className={source.connected ? "text-teal-200" : "text-amber-200"}>{source.connected ? "Consent active" : "Consent paused"}</span></div><p className="mt-2 text-sm text-slate-400">Coverage: {source.coverage}% • Features: {source.contributes.join(", ")}</p><button onClick={() => actions.setSourceConsent(profile, source.source, !source.connected, readActorId("demo-customer-001"))} className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10">{source.connected ? "Revoke simulated consent" : "Reconnect simulated source"}</button></div>)}</div>
}

export function CustomerDataPage({ mode = "data" }: { mode?: "data" | "sources" | "settings" | "help" | "activity" | "loans" | "apply" }) {
    const { state, notice, actions } = useDemoStore()
  const profile = profileWithStoreConsent(getPrimaryCustomer(), state)
  const [amount, setAmount] = useState(350000)
  const [tenure, setTenure] = useState(12)
  const [purpose, setPurpose] = useState("Working capital")
  const title = { data: "Synthetic data", sources: "Data sources and consent", settings: "Customer settings", help: "Customer help", activity: "Activity timeline", loans: "Loan applications", apply: "Simulate loan application" }[mode]
  const customerLoans = state.applications.filter((loan) => loan.customerId === profile.id)
  const activity = state.auditEvents.filter((event) => event.role === "customer")
  return <WorkspaceShell workspace="customer" title={title} description="Every record below is synthetic and exists only for the CredAI demonstration." navItems={customerNav}><Notice notice={notice} /><div className="grid gap-6 lg:grid-cols-2"><Panel title={mode === "apply" ? "Loan product simulator" : mode === "loans" ? "Your local demo applications" : "Current simulated controls"}>{mode === "apply" ? <form className="space-y-4 text-sm text-slate-300" onSubmit={(event) => { event.preventDefault(); actions.submitApplication({ customerId: profile.id, amountPkr: amount, tenureMonths: tenure, purpose, actorId: readActorId("demo-customer-001") }) }}><label className="block"><span className="text-slate-200">Amount</span><input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" value={amount} onChange={(event) => setAmount(Number(event.target.value))} type="number" min={10000} aria-label="Simulated loan amount" /></label><label className="block"><span className="text-slate-200">Tenure months</span><input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" value={tenure} onChange={(event) => setTenure(Number(event.target.value))} type="number" min={3} max={36} aria-label="Simulated tenure" /></label><label className="block"><span className="text-slate-200">Purpose</span><input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" value={purpose} onChange={(event) => setPurpose(event.target.value)} aria-label="Simulated loan purpose" /></label><p>Estimated installment: {formatPkr(Math.round(amount / Math.max(1, tenure)))}. Submission creates a local synthetic application and never approves real credit.</p><button className="rounded-xl bg-teal-400 px-4 py-2 font-semibold text-slate-950">Submit synthetic application</button></form> : mode === "loans" ? <div className="space-y-3">{customerLoans.map((loan) => <div key={loan.id} className="rounded-xl bg-white/5 p-3 text-sm text-slate-300"><span className="font-semibold text-white">{loan.id}</span> • {formatPkr(loan.amountPkr)} • {loan.status.replaceAll("_", " ")}</div>)}</div> : <SourceControls profile={profile} actions={actions} />}</Panel><Panel title={mode === "activity" ? "Recent audit activity" : "Data preview"}><div className="space-y-3">{(mode === "activity" ? activity : profile.observations.slice(-6)).map((item) => "action" in item ? <div key={item.id} className="rounded-xl bg-white/5 p-3 text-sm"><span className="text-white">{item.action}</span><p className="text-slate-400">{item.timestamp} • {item.result}</p></div> : <div key={item.month} className="rounded-xl bg-white/5 p-3 text-sm"><div className="font-medium text-white">{item.month}</div><p className="text-slate-400">Utility {formatObservation(item.utilityOnTimeRatio)}, telecom {formatObservation(item.telecomContinuity)}, repayment {formatObservation(item.repaymentRatio)}</p></div>)}</div>{mode === "settings" ? <button onClick={() => actions.reset()} className="mt-4 rounded-xl border border-amber-300/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/10">Reset local demo state</button> : null}</Panel></div><div className="mt-6"><Disclaimer /></div></WorkspaceShell>
}

export function BankDashboardPage() {
      const { state } = useDemoStore()
  const pending = state.applications.filter((loan) => loan.status === "in_review" || loan.status === "submitted")
  return <WorkspaceShell workspace="bank" title="Bank review workspace" description={humanReviewDisclaimer()} navItems={bankNav}><div className="grid gap-6 lg:grid-cols-4"><MetricCard label="Applications requiring review" value={String(pending.length)} detail="Synthetic queue" tone="amber" /><MetricCard label="Average demo score" value={String(Math.round(syntheticProfiles.reduce((sum, profile) => sum + profile.score.score, 0) / syntheticProfiles.length))} detail="Portfolio distribution" /><MetricCard label="Model in use" value={activeModel.id} detail="Logistic demo artifact" tone="blue" /><MetricCard label="Manual reviews" value="100%" detail="Human final decision required" /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><ApplicationsTable /><Panel title="Applications by demo score band"><div className="space-y-4"><Bar label="Strong demo profile" value={0.25} /><Bar label="Stable demo profile" value={0.42} /><Bar label="Building profile" value={0.25} /><Bar label="Needs review" value={0.08} inverse /></div></Panel></div></WorkspaceShell>
}

function ApplicationsTable() {
      const { state } = useDemoStore()
  return <Panel title="Application queue"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="py-2">Applicant</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>{state.applications.map((loan) => { const baseProfile = getApplicantById(loan.customerId); const profile = baseProfile ? profileWithStoreConsent(baseProfile, state) : null; return <tr key={loan.id} className="border-t border-white/10"><td className="py-3 text-white">{profile?.name ?? "Unknown applicant"}<div className="text-xs text-slate-500">{profile?.maskedCustomerId ?? loan.customerId}</div></td><td>{formatPkr(loan.amountPkr)}</td><td className="capitalize">{loan.status.replaceAll("_", " ")}</td><td>{profile ? <Link className="text-teal-200 hover:underline" href={`/bank/applications/${loan.id}`}>Open</Link> : <span className="text-amber-200">Invalid record</span>}</td></tr> })}</tbody></table></div></Panel>
}

export function BankApplicationsPage() {
  return <WorkspaceShell workspace="bank" title="Applications" description="Review synthetic loan requests with transparent score explanations and human-review notes." navItems={bankNav}><ApplicationsTable /></WorkspaceShell>
}

export function BankApplicationDetailPage({ id }: { id: string }) {
    const { state, notice, actions } = useDemoStore()
  const [reason, setReason] = useState("Human reviewer notes are required before recording any simulated decision.")
  const application = state.applications.find((loan) => loan.id === id)
  if (!application) return <MissingRecord workspace="bank" title="Application not found" detail={`No synthetic application exists for ID ${id}. CredAI no longer falls back to the first application.`} />
  const baseProfile = getApplicantById(application.customerId)
  if (!baseProfile) return <MissingRecord workspace="bank" title="Applicant not found" detail={`Application ${id} points to unknown synthetic applicant ${application.customerId}.`} />
  const profile = profileWithStoreConsent(baseProfile, state)
  const record = (decision: DecisionRecord["decision"]) => actions.recordDecision({ applicationId: application.id, decision, reviewerRole: readReviewerRole(), reason, actorId: readActorId("demo-bank-analyst-001") })
  return <WorkspaceShell workspace="bank" title={`Review ${profile.name}`} description={humanReviewDisclaimer()} navItems={bankNav}><Notice notice={notice} /><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Decision-support panel"><div className="grid gap-4 text-sm md:grid-cols-2"><div><span className="text-slate-400">Masked ID</span><div className="text-white">{profile.maskedCustomerId}</div></div><div><span className="text-slate-400">Consent coverage</span><div className="text-teal-200">{profile.score.dataCoverage}%</div></div><div><span className="text-slate-400">Amount</span><div className="text-white">{formatPkr(application.amountPkr)}</div></div><div><span className="text-slate-400">Status</span><div className="capitalize text-white">{application.status.replaceAll("_", " ")}</div></div></div><div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50">Suggested category: {profile.score.score >= 700 ? "review for demo approval" : "refer for manual review"}. This is not automatic approval or rejection.</div><textarea className="mt-5 h-28 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white" value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Human review notes" /><div className="mt-4 flex flex-wrap gap-3"><button onClick={() => record("approve_for_demo")} className="rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Approve for demo</button><button onClick={() => record("refer_for_manual_review")} className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">Refer for manual review</button><button onClick={() => record("decline_for_demo")} className="rounded-xl bg-red-400 px-4 py-2 text-sm font-semibold text-white">Decline for demo</button></div></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="Top factors">{profile.score.reasonCodes.slice(0, 6).map((reasonCode) => <p key={reasonCode} className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">{reasonCode}</p>)}</Panel><Panel title="Monthly financial timeline">{profile.observations.slice(-6).map((row) => <Bar key={row.month} label={`${row.month} repayment`} value={row.repaymentRatio} />)}</Panel></div></WorkspaceShell>
}

export function BankApplicantDetailPage({ id }: { id: string }) {
      const { state } = useDemoStore()
  const baseProfile = getApplicantById(id)
  if (!baseProfile) return <MissingRecord workspace="bank" title="Applicant not found" detail={`No synthetic applicant exists for ID ${id}.`} />
  const profile = profileWithStoreConsent(baseProfile, state)
  const application = state.applications.find((loan) => loan.customerId === profile.id)
  return <WorkspaceShell workspace="bank" title={profile.name} description={humanReviewDisclaimer()} navItems={bankNav}><div className="grid gap-6 lg:grid-cols-[360px_1fr]"><ScoreRing score={profile.score.score} band={profile.score.band} /><Panel title="Applicant detail"><p className="text-sm text-slate-300">{profile.maskedCustomerId} • {profile.city} • {profile.behaviorProfile.replaceAll("_", " ")}</p><p className="mt-3 text-sm text-slate-300">Current application: {application ? <Link className="text-teal-200 hover:underline" href={`/bank/applications/${application.id}`}>{application.id}</Link> : "No active application in this local demo state."}</p></Panel></div></WorkspaceShell>
}

export function BankGenericPage({ page }: { page: "applicants" | "portfolio" | "decisioning" | "model" | "audit" | "settings" }) {
      const { state } = useDemoStore()
  const title = { applicants: "Applicants", portfolio: "Synthetic portfolio", decisioning: "Decisioning policy", model: "Model transparency", audit: "Bank audit", settings: "Bank settings" }[page]
  return <WorkspaceShell workspace="bank" title={title} description={page === "model" ? "Model outputs are transparent decision-support signals, not real-world predictive claims." : humanReviewDisclaimer()} navItems={bankNav}><div className="grid gap-6 lg:grid-cols-2">{page === "model" ? <><Panel title="Model metrics">{Object.entries(modelMetrics).filter(([, value]) => typeof value === "number").map(([key, value]) => <div key={key} className="mb-3 flex justify-between rounded-xl bg-white/5 p-3 text-sm"><span>{key}</span><span>{String(value)}</span></div>)}</Panel><Panel title="Feature list">{featureDefinitions.slice(0, 12).map((feature) => <p key={feature.name} className="mb-2 rounded-xl bg-white/5 p-3 text-sm text-slate-300">{feature.name} • {feature.direction}</p>)}</Panel></> : page === "audit" ? <AuditTable events={state.auditEvents} /> : page === "applicants" ? <Panel title="Synthetic applicants">{syntheticProfiles.slice(0, 10).map((profile) => <Link key={profile.id} href={`/bank/applicants/${profile.id}`} className="mb-3 block rounded-xl bg-white/5 p-3 text-sm text-slate-200 hover:bg-white/10">{profile.name} • {profile.maskedCustomerId} • {profile.score.score}</Link>)}</Panel> : <><MetricCard label="Synthetic records" value={String(syntheticProfiles.length)} detail="Demo portfolio sample" /><MetricCard label="Human decisions" value={String(state.decisions.length)} detail="Recorded demo decisions" tone="amber" /><Panel title="Policy notes"><p className="text-sm text-slate-300">Decision options require a reason. Model output cannot automatically approve or decline a real loan.</p></Panel></>}</div></WorkspaceShell>
}

export function AdminDashboardPage({ page = "dashboard", id }: { page?: string; id?: string }) {
      const { state } = useDemoStore()
  const title = page === "dashboard" ? "Admin dashboard" : page.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
  return <WorkspaceShell workspace="admin" title={title} description="Manage synthetic data, demo users, model versions, fairness diagnostics, and audit events." navItems={adminNav}><div className="grid gap-6 lg:grid-cols-4"><MetricCard label="Demo customers" value={String(datasetSummary.profileCount)} detail="Deterministic synthetic profiles" /><MetricCard label="Active demo banks" value={String(organizations.filter((org) => org.type === "bank").length)} detail="Synthetic organizations" tone="blue" /><MetricCard label="Current model" value={activeModel.id} detail={activeModel.type} tone="amber" /><MetricCard label="Audit events" value={String(state.auditEvents.length)} detail="Masked synthetic records" /></div><div className="mt-6 grid gap-6 lg:grid-cols-2">{page === "synthetic-data" ? <SyntheticDataPanel /> : page === "models" || id ? <ModelRegistryPanel id={id} /> : page === "training" ? <TrainingPanel /> : page === "fairness" ? <FairnessPanel /> : page === "audit" ? <AuditTable events={state.auditEvents} /> : page === "users" ? <Panel title="Demo users and permissions">{Object.entries(permissionMap).map(([role, permissions]) => <div key={role} className="mb-3 rounded-xl bg-white/5 p-3 text-sm"><div className="font-semibold text-white">{role}</div><div className="text-slate-400">{permissions.join(", ")}</div></div>)}</Panel> : <><Panel title="System status"><div className="space-y-3 text-sm text-slate-300"><p>Generator seed: {datasetSummary.seed}</p><p>Last training run: {datasetSummary.createdAt}</p><p>Data-source health: simulated connectors only.</p><p>Review queue: {state.applications.filter((loan) => loan.status === "in_review").length} pending manual reviews.</p></div></Panel><Panel title="Recent audit events"><AuditRows events={state.auditEvents} /></Panel></>}</div></WorkspaceShell>
}

function SyntheticDataPanel() {
    const { state, notice, actions } = useDemoStore()
  return <><Panel title="Generator controls"><Notice notice={notice} /><div className="grid gap-4 text-sm text-slate-300"><label>Dataset seed<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" value={datasetSummary.seed} readOnly /></label><label>Customers<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" value={datasetSummary.profileCount} readOnly /></label><label>Months<input className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3" value="12" readOnly /></label><div className="flex flex-wrap gap-3"><button onClick={() => actions.reset()} className="rounded-xl border border-amber-300/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/10">Reset demo state</button><a href="/api/not-implemented" onClick={(event) => event.preventDefault()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200">Exports are generated by npm run data:generate</a></div><p>Local workflow state: {state.applications.length} applications, {state.decisions.length} decisions, {state.auditEvents.length} audit events.</p></div></Panel><Panel title="Provenance"><pre className="overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify(datasetSummary, null, 2)}</pre></Panel></>
}

function ModelRegistryPanel({ id }: { id?: string }) {
  const selectedId = id ?? activeModel.id
  const model = modelRegistry.find((entry) => entry.id === selectedId)
  if (!model) return <Panel title="Model not found"><p className="text-sm text-slate-300">No model exists for ID {selectedId}. CredAI no longer opens an unrelated default model for unknown IDs.</p><Link href="/admin/models" className="mt-5 inline-flex rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Return to registry</Link></Panel>
  return <><Panel title="Model registry">{modelRegistry.map((entry) => <Link key={entry.id} href={`/admin/models/${entry.id}`} className="mb-3 block rounded-xl bg-white/5 p-3 text-sm text-slate-200 hover:bg-white/10">{entry.name} • {entry.status}</Link>)}</Panel><Panel title={model.name}><p className="text-sm text-slate-300">{model.summary}</p><div className="mt-4 space-y-2 text-sm text-slate-300"><p>Training rows: {modelMetrics.confusionMatrix.truePositive + modelMetrics.confusionMatrix.falseNegative + modelMetrics.confusionMatrix.trueNegative + modelMetrics.confusionMatrix.falsePositive === 400 ? "1,600" : "See generated artifact"}</p><p>Test rows: {modelMetrics.confusionMatrix.truePositive + modelMetrics.confusionMatrix.falsePositive + modelMetrics.confusionMatrix.trueNegative + modelMetrics.confusionMatrix.falseNegative}</p><p>Train/test split: deterministic 80/20</p><p>Actions: publish and rollback are disabled in this prototype; checked-in artifacts are produced by npm run model:train.</p></div></Panel></>
}

function TrainingPanel() {
    const { state, notice, actions } = useDemoStore()
    return <Panel title="Training workflow"><Notice notice={notice} /><p className="text-sm text-slate-300">The browser can log an admin training-review event. Actual deterministic model fitting writes files through the CLI command <code>npm run model:train</code>.</p><button onClick={() => actions.simulateTrainingRun(readActorId("demo-admin-001"), "admin")} className="mt-4 rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950">Record training audit event</button><p className="mt-3 text-sm text-slate-400">Local training audit events this session: {state.modelTrainingRuns}</p></Panel>
}

function FairnessPanel() {
  return <Panel title="Synthetic fairness diagnostics"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th>Group</th><th>Selection</th><th>TPR</th><th>FPR</th><th>Average</th></tr></thead><tbody>{fairnessDiagnostics.map((group) => <tr key={group.group} className="border-t border-white/10"><td className="py-3">{group.group}</td><td>{Math.round(group.selectionRate * 100)}%</td><td>{Math.round(group.truePositiveRate * 100)}%</td><td>{Math.round(group.falsePositiveRate * 100)}%</td><td>{group.averageScore}</td></tr>)}</tbody></table><p className="mt-4 text-sm text-amber-100">Synthetic diagnostics only; this does not prove a real model is fair.</p></div></Panel>
}

function AuditRows({ events }: { events: typeof seededAuditEvents }) {
  return <div className="space-y-3">{events.map((event) => <div key={event.id} className="rounded-xl bg-white/5 p-3 text-sm"><div className="flex justify-between gap-3"><span className="text-white">{event.action}</span><span className="text-slate-400">{event.timestamp}</span></div><p className="text-slate-400">{event.organization} • {event.role} • {event.resource}</p></div>)}</div>
}

function AuditTable({ events }: { events: typeof seededAuditEvents }) {
  return <Panel title="Masked audit events"><AuditRows events={events} /></Panel>
}
