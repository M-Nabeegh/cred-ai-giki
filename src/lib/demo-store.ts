"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { calculateBaselineScore, baselineModelVersion } from "./scoring/baseline"
import { inferLogisticScore } from "./scoring/logistic"
import { activeModelArtifact, modelRegistry } from "./scoring/model-registry"
import type { BrowserTrainingResult } from "./scoring/browser-pipeline"
import {
  DEMO_TIMESTAMP,
  applySourceConsent,
  auditEvents,
  decisionRecords,
  loanApplications,
  sourceFeatureMap,
  sourceLabels,
  syntheticProfiles,
  type AuditEvent,
  type DecisionRecord,
  type LoanApplication,
  type SourceConsentState,
  type SourceKey,
  type SyntheticProfile,
} from "./credai-data"
import { confidenceFromCoverage } from "./scoring/types"
import type { Role } from "./permissions"

const STORAGE_KEY = "credai_demo_state_v1"
const sourceKeys = Object.keys(sourceFeatureMap) as SourceKey[]

type DecisionInput = {
  applicationId: string
  decision: DecisionRecord["decision"]
  reviewerRole: DecisionRecord["reviewerRole"]
  reason: string
  actorId: string
}

type ApplicationInput = {
  customerId: string
  amountPkr: number
  tenureMonths: number
  purpose: string
  actorId: string
}

export type DemoNotice = {
  id: string
  tone: "success" | "warning"
  message: string
}

export type DemoStoreState = {
  applications: LoanApplication[]
  decisions: DecisionRecord[]
  auditEvents: AuditEvent[]
  sourceConsentByProfileId: Record<string, SourceConsentState>
  nextApplicationNumber: number
  nextDecisionNumber: number
  nextAuditNumber: number
  modelTrainingRuns: number
  activeModelOverride: string | null
  registeredProfileId: string | null
  lastBrowserTraining: {
    finishedAt: string
    trainingRowCount: number
    testRowCount: number
    accuracy: number
    rocAuc: number
    artifactDigest: string
  } | null
}

function consentFromProfile(profile: SyntheticProfile): SourceConsentState {
  return Object.fromEntries(sourceKeys.map((source) => [source, profile.sources.find((item) => item.source === source)?.connected ?? false])) as SourceConsentState
}

function initialState(): DemoStoreState {
  return {
    applications: loanApplications,
    decisions: decisionRecords,
    auditEvents,
    sourceConsentByProfileId: {},
    nextApplicationNumber: 101,
    nextDecisionNumber: 101,
    nextAuditNumber: 101,
    modelTrainingRuns: 0,
    activeModelOverride: null,
    registeredProfileId: null,
    lastBrowserTraining: null,
  }
}

function parseState(value: string | null): DemoStoreState | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as DemoStoreState
    if (!Array.isArray(parsed.applications) || !Array.isArray(parsed.decisions) || !Array.isArray(parsed.auditEvents)) return null
    return { ...initialState(), ...parsed }
  } catch {
    return null
  }
}

function nextDate(sequence: number) {
  return `2026-08-${String(20 + (sequence % 8)).padStart(2, "0")}T${String(9 + (sequence % 8)).padStart(2, "0")}:30:00+05:00`
}

function decisionToStatus(decision: DecisionRecord["decision"]): LoanApplication["status"] {
  if (decision === "approve_for_demo") return "approved_for_demo"
  if (decision === "decline_for_demo") return "declined_for_demo"
  return "referred"
}

function createAuditEvent(state: DemoStoreState, event: Omit<AuditEvent, "id" | "timestamp" | "modelVersion">): AuditEvent {
  return {
    ...event,
    id: `audit-local-${String(state.nextAuditNumber).padStart(3, "0")}`,
    timestamp: nextDate(state.nextAuditNumber),
    modelVersion: activeModelArtifact.modelVersion,
  }
}

export function activeModelIdForState(state: DemoStoreState) {
  if (state.activeModelOverride && modelRegistry.some((entry) => entry.id === state.activeModelOverride)) {
    return state.activeModelOverride
  }
  return activeModelArtifact.modelVersion
}

export function primaryCustomerForState(state: DemoStoreState) {
  return syntheticProfiles.find((profile) => profile.id === state.registeredProfileId) ?? syntheticProfiles[0]
}

export function downloadDemoFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// External-store backing for the demo state so React reads localStorage
// without setState-in-effect hydration workarounds.
let memoryState: DemoStoreState = initialState()
let loadedFromStorage = false
const storeListeners = new Set<() => void>()
const serverState = initialState()

function getDemoStoreSnapshot(): DemoStoreState {
  if (!loadedFromStorage && typeof window !== "undefined") {
    loadedFromStorage = true
    memoryState = parseState(localStorage.getItem(STORAGE_KEY)) ?? initialState()
  }
  return memoryState
}

function getDemoStoreServerSnapshot(): DemoStoreState {
  return serverState
}

function subscribeDemoStore(callback: () => void) {
  storeListeners.add(callback)
  return () => {
    storeListeners.delete(callback)
  }
}

function commitDemoStore(next: DemoStoreState) {
  memoryState = next
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  storeListeners.forEach((listener) => listener())
}

export function useDemoStore() {
  const state = useSyncExternalStore(subscribeDemoStore, getDemoStoreSnapshot, getDemoStoreServerSnapshot)
  const [notice, setNotice] = useState<DemoNotice | null>(null)

  const actions = useMemo(() => ({
    reset() {
      commitDemoStore(initialState())
      setNotice({ id: "reset", tone: "warning", message: "Demo state reset to the deterministic seed data." })
    },
    setSourceConsent(profile: SyntheticProfile, source: SourceKey, connected: boolean, actorId: string) {
      const current = getDemoStoreSnapshot()
      const currentConsent = current.sourceConsentByProfileId[profile.id] ?? consentFromProfile(profile)
      const nextConsent = { ...currentConsent, [source]: connected }
      const auditEvent = createAuditEvent(current, {
        actorId,
        organization: "CredAI",
        role: "customer",
        action: connected ? "Consent granted" : "Consent revoked",
        resource: `simulated-${source}`,
        result: connected ? "success" : "warning",
      })
      commitDemoStore({
        ...current,
        sourceConsentByProfileId: { ...current.sourceConsentByProfileId, [profile.id]: nextConsent },
        auditEvents: [auditEvent, ...current.auditEvents],
        nextAuditNumber: current.nextAuditNumber + 1,
      })
      setNotice({ id: `${source}-${connected}`, tone: connected ? "success" : "warning", message: `${sourceLabels[source]} is now ${connected ? "connected" : "paused"} for this local demo session.` })
    },
    submitApplication(input: ApplicationInput) {
      if (!Number.isFinite(input.amountPkr) || input.amountPkr < 10000) {
        setNotice({ id: "loan-invalid", tone: "warning", message: "Enter a valid synthetic loan amount of at least PKR 10,000." })
        return
      }
      const current = getDemoStoreSnapshot()
      const application: LoanApplication = {
        id: `loan-demo-local-${String(current.nextApplicationNumber).padStart(3, "0")}`,
        customerId: input.customerId,
        amountPkr: Math.round(input.amountPkr),
        tenureMonths: Math.max(3, Math.min(36, Math.round(input.tenureMonths))),
        purpose: input.purpose.trim() || "Demo loan request",
        status: "submitted",
        createdAt: nextDate(current.nextApplicationNumber),
        humanReviewRequired: true,
      }
      const auditEvent = createAuditEvent(current, {
        actorId: input.actorId,
        organization: "CredAI",
        role: "customer",
        action: "Loan application submitted",
        resource: application.id,
        result: "success",
      })
      commitDemoStore({
        ...current,
        applications: [application, ...current.applications],
        auditEvents: [auditEvent, ...current.auditEvents],
        nextApplicationNumber: current.nextApplicationNumber + 1,
        nextAuditNumber: current.nextAuditNumber + 1,
      })
      setNotice({ id: "loan-submitted", tone: "success", message: "Synthetic loan application added to the bank review queue." })
    },
    recordDecision(input: DecisionInput) {
      const reason = input.reason.trim()
      if (reason.length < 12) {
        setNotice({ id: "decision-invalid", tone: "warning", message: "A human review note of at least 12 characters is required before recording a demo decision." })
        return
      }
      const current = getDemoStoreSnapshot()
      const application = current.applications.find((item) => item.id === input.applicationId)
      if (!application) {
        setNotice({ id: "decision-missing", tone: "warning", message: `No application ${input.applicationId} exists in the local demo state.` })
        return
      }
      const decision: DecisionRecord = {
        id: `decision-local-${String(current.nextDecisionNumber).padStart(3, "0")}`,
        applicationId: input.applicationId,
        reviewerRole: input.reviewerRole,
        decision: input.decision,
        reason,
        createdAt: nextDate(current.nextDecisionNumber),
      }
      const auditEvent = createAuditEvent(current, {
        actorId: input.actorId,
        organization: "Crescent Bank Demo Review Unit",
        role: input.reviewerRole,
        action: "Decision recorded",
        resource: decision.id,
        result: "success",
      })
      commitDemoStore({
        ...current,
        applications: current.applications.map((item) => item.id === input.applicationId ? { ...item, status: decisionToStatus(input.decision) } : item),
        decisions: [decision, ...current.decisions],
        auditEvents: [auditEvent, ...current.auditEvents],
        nextDecisionNumber: current.nextDecisionNumber + 1,
        nextAuditNumber: current.nextAuditNumber + 1,
      })
      setNotice({ id: "decision-recorded", tone: "success", message: "Human-reviewed demo decision recorded and audit logged." })
    },
    simulateTrainingRun(actorId: string, role: Role) {
      const current = getDemoStoreSnapshot()
      const auditEvent = createAuditEvent(current, {
        actorId,
        organization: "CredAI Platform Admin",
        role,
        action: "Model training simulated",
        resource: activeModelArtifact.modelVersion,
        result: "success",
      })
      commitDemoStore({ ...current, auditEvents: [auditEvent, ...current.auditEvents], nextAuditNumber: current.nextAuditNumber + 1, modelTrainingRuns: current.modelTrainingRuns + 1 })
      setNotice({ id: "training-run", tone: "success", message: "Recorded a local training-run audit event. CLI training remains the source of the checked-in artifact." })
    },
    recordBrowserTraining(result: BrowserTrainingResult, actorId: string) {
      const current = getDemoStoreSnapshot()
      const auditEvent = createAuditEvent(current, {
        actorId,
        organization: "CredAI Platform Admin",
        role: "admin",
        action: "Browser mini training run completed",
        resource: result.artifactDigest.slice(0, 16),
        result: "success",
      })
      commitDemoStore({
        ...current,
        auditEvents: [auditEvent, ...current.auditEvents],
        nextAuditNumber: current.nextAuditNumber + 1,
        modelTrainingRuns: current.modelTrainingRuns + 1,
        lastBrowserTraining: {
          finishedAt: new Date().toISOString(),
          trainingRowCount: result.trainingRowCount,
          testRowCount: result.testRowCount,
          accuracy: result.metrics.accuracy,
          rocAuc: result.metrics.rocAuc,
          artifactDigest: result.artifactDigest,
        },
      })
      setNotice({ id: "browser-training", tone: "success", message: "Browser mini-run fitted a real logistic model on freshly generated synthetic rows. The checked-in artifact still comes from npm run model:train." })
    },
    publishModel(modelId: string, actorId: string, role: Role) {
      if (!modelRegistry.some((entry) => entry.id === modelId)) {
        setNotice({ id: "publish-invalid", tone: "warning", message: `No registry entry exists for model ${modelId}.` })
        return
      }
      const current = getDemoStoreSnapshot()
      const auditEvent = createAuditEvent(current, {
        actorId,
        organization: "CredAI Platform Admin",
        role,
        action: "Model published to demo",
        resource: modelId,
        result: "success",
      })
      commitDemoStore({ ...current, activeModelOverride: modelId, auditEvents: [auditEvent, ...current.auditEvents], nextAuditNumber: current.nextAuditNumber + 1 })
      setNotice({ id: `publish-${modelId}`, tone: "success", message: `${modelId} is now the active demo model for this local session only.` })
    },
    rollbackModel(actorId: string, role: Role) {
      const current = getDemoStoreSnapshot()
      const auditEvent = createAuditEvent(current, {
        actorId,
        organization: "CredAI Platform Admin",
        role,
        action: "Model rolled back to baseline",
        resource: baselineModelVersion,
        result: "warning",
      })
      commitDemoStore({ ...current, activeModelOverride: baselineModelVersion, auditEvents: [auditEvent, ...current.auditEvents], nextAuditNumber: current.nextAuditNumber + 1 })
      setNotice({ id: "rollback", tone: "warning", message: `Rolled back to ${baselineModelVersion} for this local session. Scores now use the rule-based baseline.` })
    },
    registerDemoCustomer(profileId: string, displayName: string, actorId: string) {
      const current = getDemoStoreSnapshot()
      const auditEvent = createAuditEvent(current, {
        actorId,
        organization: "CredAI",
        role: "customer",
        action: "Demo customer registered",
        resource: profileId,
        result: "success",
      })
      commitDemoStore({ ...current, registeredProfileId: profileId, auditEvents: [auditEvent, ...current.auditEvents], nextAuditNumber: current.nextAuditNumber + 1 })
      setNotice({ id: "registered", tone: "success", message: `${displayName} is linked to synthetic profile ${profileId} for this demo session.` })
    },
  }), [])

  return { state, ready: true, notice, actions }
}

export function profileWithStoreConsent(profile: SyntheticProfile, state: DemoStoreState): SyntheticProfile {
  const consent = state.sourceConsentByProfileId[profile.id] ?? consentFromProfile(profile)
  const features = applySourceConsent(profile.features, consent)
  const useBaseline = state.activeModelOverride === baselineModelVersion
  const score = useBaseline
    ? calculateBaselineScore(features)
    : inferLogisticScore(features, activeModelArtifact) ?? calculateBaselineScore(features)
  const dataCoverage = Math.round(Number(features.data_completeness ?? 0) * 100)
  return {
    ...profile,
    features,
    score: { ...score, dataCoverage, confidence: confidenceFromCoverage(dataCoverage) },
    sources: sourceKeys.map((source) => ({
      source,
      label: sourceLabels[source],
      connected: consent[source],
      coverage: consent[source] ? dataCoverage : 0,
      lastSynced: consent[source] ? DEMO_TIMESTAMP : "Not connected in demo",
      contributes: sourceFeatureMap[source],
    })),
    observations: profile.observations.map((row) => ({
      ...row,
      utilityOnTimeRatio: consent.utility ? row.utilityOnTimeRatio : null,
      telecomContinuity: consent.telecom ? row.telecomContinuity : null,
      walletInflowRegularity: consent.jazzcash ? row.walletInflowRegularity : null,
      walletOutflowVolatility: consent.easypaisa ? row.walletOutflowVolatility : null,
      cashFlowCoverage: consent.cashflow ? row.cashFlowCoverage : null,
      repaymentRatio: consent.repayment ? row.repaymentRatio : null,
    })),
  }
}
