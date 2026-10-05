"use client"

import { useMemo } from "react"
import { scoreHistory, scoreRecord } from "@/lib/core/scorecard"
import { SOURCE_KEYS, type CustomerRecord, type SourceKey } from "@/lib/core/schema"
import { useDemo } from "@/lib/demo/store"
import { artifact } from "@/lib/model"

/** The customer's record with their in-demo consent choices applied, re-scored client-side. */
export function useCustomerReport(base: CustomerRecord) {
  const demo = useDemo()
  const consent = demo.state.consent[base.customerId] ?? base.consent
  const record = useMemo(() => ({ ...base, consent }), [base, consent])
  const report = useMemo(() => scoreRecord(record, artifact), [record])
  const history = useMemo(() => scoreHistory(record, artifact), [record])
  /** Points each source is worth right now: score with it on minus score with it off. */
  const sourceValue = useMemo(() => Object.fromEntries(SOURCE_KEYS.map((key) => {
    const on = scoreRecord({ ...record, consent: { ...consent, [key]: true } }, artifact).score
    const off = scoreRecord({ ...record, consent: { ...consent, [key]: false } }, artifact).score
    return [key, on - off]
  })) as Record<SourceKey, number>, [record, consent])
  return { record, report, history, sourceValue, consent, demo }
}
