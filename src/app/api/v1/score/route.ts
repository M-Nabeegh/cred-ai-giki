import { NextResponse } from "next/server"
import { z } from "zod"
import { DEFAULT_POLICY, evaluateApplication } from "@/lib/core/policy"
import { customerRecordSchema, loanRequestSchema } from "@/lib/core/schema"
import { publicReport, scoreRecord } from "@/lib/core/scorecard"
import { artifact } from "@/lib/model"

const wrappedSchema = z.object({ customer: customerRecordSchema, loan: loanRequestSchema.optional(), policy: z.record(z.string(), z.number()).optional() })
const bareSchema = customerRecordSchema.transform((customer) => ({ customer, loan: undefined, policy: undefined }))

/**
 * Stateless scoring: send raw customer records, get a score, reason codes and (optionally)
 * a policy decision for a loan. Nothing is stored.
 */
export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  // Pick the shape up front so validation errors point at the real field, not at a union.
  const wrapped = typeof json === "object" && json !== null && "customer" in json
  const parsed = wrapped ? wrappedSchema.safeParse(json) : bareSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_customer_record", issues: parsed.error.issues.slice(0, 20).map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, { status: 422 })
  }
  const started = performance.now()
  const { customer, loan, policy } = parsed.data
  const report = scoreRecord(customer, artifact)
  const decision = loan ? evaluateApplication(report, loan, { ...DEFAULT_POLICY, ...policy }, customer.declaredMonthlyIncome) : undefined
  return NextResponse.json({ report: publicReport(report), decision, meta: { model: artifact.version, digest: artifact.digest, latencyMs: Math.round((performance.now() - started) * 10) / 10 } })
}
