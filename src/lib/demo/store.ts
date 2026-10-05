"use client"

import { useCallback, useSyncExternalStore } from "react"
import { DEFAULT_POLICY, type Policy } from "../core/policy"
import type { Consent } from "../core/schema"
import type { Application, DecisionEntry } from "../data/types"

/**
 * Demo workflow state. Decisions, new applications, consent changes, policy edits and
 * the audit trail live in this browser's localStorage so the whole loop — customer
 * applies, analyst decides, admin audits — works without a database.
 */

export type AuditEntry = { id: string; at: string; actor: string; role: "customer" | "analyst" | "admin" | "system"; action: string; target: string; detail?: string }
export type TourStep = "score" | "consent" | "apply" | "review" | "policy" | "model"

export type DemoState = {
  decisions: Record<string, DecisionEntry>
  submitted: Application[]
  consent: Record<string, Consent>
  policy: Policy
  audit: AuditEntry[]
  tour: TourStep[]
  tourHidden: boolean
}

const KEY = "credai.demo.v2"
const empty: DemoState = { decisions: {}, submitted: [], consent: {}, policy: DEFAULT_POLICY, audit: [], tour: [], tourHidden: false }

export const ANALYST = "Sara Mirza"
let cachedRaw: string | null | undefined
let cachedState: DemoState = empty
const listeners = new Set<() => void>()

function read(): DemoState {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    raw = null
  }
  if (raw === cachedRaw) return cachedState
  cachedRaw = raw
  try {
    cachedState = raw ? { ...empty, ...JSON.parse(raw), policy: { ...DEFAULT_POLICY, ...JSON.parse(raw).policy } } : empty
  } catch {
    cachedState = empty
  }
  return cachedState
}

function write(next: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage blocked (private mode): keep working in memory for this page view.
    cachedRaw = JSON.stringify(next)
    cachedState = next
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => event.key === KEY && listener()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

const nowIso = () => new Date().toISOString()
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export function useDemo() {
  const state = useSyncExternalStore(subscribe, read, () => empty)

  const update = useCallback((fn: (current: DemoState) => DemoState) => write(fn(read())), [])

  const log = (current: DemoState, entry: Omit<AuditEntry, "id" | "at">): AuditEntry[] => [{ id: id("evt"), at: nowIso(), ...entry }, ...current.audit].slice(0, 200)
  const complete = (current: DemoState, step: TourStep) => (current.tour.includes(step) ? current.tour : [...current.tour, step])

  const actions = {
    setConsent: (customerId: string, name: string, consent: Consent, changed: keyof Consent) =>
      update((current) => ({
        ...current,
        consent: { ...current.consent, [customerId]: consent },
        tour: complete(current, "consent"),
        audit: log(current, { actor: name, role: "customer", action: consent[changed] ? "Granted data access" : "Revoked data access", target: changed, detail: `Consent for ${changed} ${consent[changed] ? "granted" : "revoked"}; score recomputed` }),
      })),
    submitApplication: (application: Omit<Application, "id" | "createdAt" | "status" | "channel">, name: string) => {
      const created: Application = { ...application, id: `APP-${String(30_000 + Math.floor(Math.random() * 9_000))}`, createdAt: nowIso(), status: "pending", channel: "app" }
      update((current) => ({
        ...current,
        submitted: [created, ...current.submitted],
        tour: complete(current, "apply"),
        audit: log(current, { actor: name, role: "customer", action: "Submitted application", target: created.id, detail: `PKR ${application.amount.toLocaleString("en-US")} over ${application.tenureMonths} months` }),
      }))
      return created
    },
    decide: (applicationId: string, entry: Omit<DecisionEntry, "at" | "by">) =>
      update((current) => ({
        ...current,
        decisions: { ...current.decisions, [applicationId]: { ...entry, by: ANALYST, at: nowIso() } },
        tour: complete(current, "review"),
        audit: log(current, { actor: ANALYST, role: "analyst", action: `Marked ${entry.outcome}`, target: applicationId, detail: entry.note }),
      })),
    setPolicy: (policy: Policy) =>
      update((current) => {
        const entry = { actor: ANALYST, role: "analyst" as const, action: "Updated policy", target: "underwriting-policy", detail: `Approve ≥ ${policy.approveMinScore}, decline < ${policy.declineBelowScore}, DTI ≤ ${Math.round(policy.maxDebtToIncome * 100)}%, instant ≤ PKR ${policy.instantLimit.toLocaleString("en-US")}` }
        // Slider drags arrive many times a second; keep one audit entry per editing burst.
        const recent = current.audit[0]?.action === "Updated policy" && Date.now() - Date.parse(current.audit[0].at) < 60_000
        return { ...current, policy, tour: complete(current, "policy"), audit: recent ? [{ ...current.audit[0], ...entry, at: nowIso() }, ...current.audit.slice(1)] : log(current, entry) }
      }),
    resetPolicy: () => update((current) => ({ ...current, policy: DEFAULT_POLICY })),
    markTour: (step: TourStep) => update((current) => (current.tour.includes(step) ? current : { ...current, tour: [...current.tour, step] })),
    setTourHidden: (hidden: boolean) => update((current) => ({ ...current, tourHidden: hidden })),
    reset: () => write(empty),
  }

  return { state, actions }
}

export function statusOf(application: Application, decisions: DemoState["decisions"], seeded?: DecisionEntry) {
  return decisions[application.id] ?? seeded ?? null
}
