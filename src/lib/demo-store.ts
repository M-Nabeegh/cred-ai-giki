"use client"

import { useEffect, useMemo, useState } from "react"
import { calculateBaselineScore } from "./scoring/baseline"
import { inferLogisticScore } from "./scoring/logistic"
import { activeModelArtifact } from "./scoring/model-registry"
import {
  DEMO_TIMESTAMP,
  applySourceConsent,
  auditEvents,
  decisionRecords,
  loanApplications,
  sourceFeatureMap,
  sourceLabels,
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

export function useDemoStore() {
  const [state, setState] = useState<DemoStoreState>(() => initialState())
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<DemoNotice | null>(null)

  useEffect(() => {
    setState(parseState(localStorage.getItem(STORAGE_KEY)) ?? initialState())
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [ready, state])

  const actions = useMemo(() => ({
    reset() {
      const fresh = initialState()
      setState(fresh)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
      setNotice({ id: "reset", tone: "warning", message: "Demo state reset to the deterministic seed data." })
    },
    setSourceConsent(profile: SyntheticProfile, source: SourceKey, connected: boolean, actorId: string) {
      setState((current) => {
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
        return {
          ...current,
          sourceConsentByProfileId: { ...current.sourceConsentByProfileId, [profile.id]: nextConsent },
          auditEvents: [auditEvent, ...current.auditEvents],
          nextAuditNumber: current.nextAuditNumber + 1,
        }
      })
      setNotice({ id: `${source}-${connected}`, tone: connected ? "success" : "warning", message: `${sourceLabels[source]} is now ${connected ? "connected" : "paused"} for this local demo session.` })
    },
    submitApplication(input: ApplicationInput) {
      if (!Number.isFinite(input.amountPkr) || input.amountPkr < 10000) {
        setNotice({ id: "loan-invalid", tone: "warning", message: "Enter a valid synthetic loan amount of at least PKR 10,000." })
        return
      }
      setState((current) => {
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
        return {
          ...current,
          applications: [application, ...current.applications],
          auditEvents: [auditEvent, ...current.auditEvents],
          nextApplicationNumber: current.nextApplicationNumber + 1,
          nextAuditNumber: current.nextAuditNumber + 1,
        }
      })
      setNotice({ id: "loan-submitted", tone: "success", message: "Synthetic loan application added to the bank review queue." })
    },
    recordDecision(input: DecisionInput) {
      const reason = input.reason.trim()
      if (reason.length < 12) {
        setNotice({ id: "decision-invalid", tone: "warning", message: "A human review note of at least 12 characters is required before recording a demo decision." })
        return
      }
      setState((current) => {
        const application = current.applications.find((item) => item.id === input.applicationId)
        if (!application) return current
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
        return {
          ...current,
          applications: current.applications.map((item) => item.id === input.applicationId ? { ...item, status: decisionToStatus(input.decision) } : item),
          decisions: [decision, ...current.decisions],
          auditEvents: [auditEvent, ...current.auditEvents],
          nextDecisionNumber: current.nextDecisionNumber + 1,
          nextAuditNumber: current.nextAuditNumber + 1,
        }
      })
      setNotice({ id: "decision-recorded", tone: "success", message: "Human-reviewed demo decision recorded and audit logged." })
    },
    simulateTrainingRun(actorId: string, role: Role) {
      setState((current) => {
        const auditEvent = createAuditEvent(current, {
          actorId,
          organization: "CredAI Platform Admin",
          role,
          action: "Model training simulated",
          resource: activeModelArtifact.modelVersion,
          result: "success",
        })
        return { ...current, auditEvents: [auditEvent, ...current.auditEvents], nextAuditNumber: current.nextAuditNumber + 1, modelTrainingRuns: current.modelTrainingRuns + 1 }
      })
      setNotice({ id: "training-run", tone: "success", message: "Recorded a local training-run audit event. CLI training remains the source of the checked-in artifact." })
    },
  }), [])

  return { state, ready, notice, actions }
}

export function profileWithStoreConsent(profile: SyntheticProfile, state: DemoStoreState): SyntheticProfile {
  const consent = state.sourceConsentByProfileId[profile.id] ?? consentFromProfile(profile)
  const features = applySourceConsent(profile.features, consent)
  const score = inferLogisticScore(features, activeModelArtifact) ?? calculateBaselineScore(features)
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
