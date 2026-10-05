import { NextResponse } from "next/server"
import { loanRequestSchema } from "@/lib/core/schema"
import { evaluateApplication } from "@/lib/core/policy"
import { getCustomerBundle } from "@/lib/data/service"
import { publicReport } from "@/lib/core/scorecard"

export const dynamic = "force-dynamic"

/** GET /api/v1/customers/{id}?amount=150000&tenureMonths=12 — score report, plus a policy decision when a loan is given. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bundle = await getCustomerBundle(id)
  if (!bundle) return NextResponse.json({ error: "customer_not_found", id }, { status: 404 })
  const url = new URL(request.url)
  const loan = url.searchParams.has("amount") ? loanRequestSchema.safeParse({ amount: Number(url.searchParams.get("amount")), tenureMonths: Number(url.searchParams.get("tenureMonths") ?? 12) }) : null
  if (loan && !loan.success) return NextResponse.json({ error: "invalid_loan", issues: loan.error.issues }, { status: 400 })
  return NextResponse.json({
    customer: { id: bundle.record.customerId, name: bundle.record.displayName, city: bundle.record.city, segment: bundle.record.segment, asOf: bundle.record.asOf },
    report: publicReport(bundle.report),
    decision: loan?.success ? evaluateApplication(bundle.report, loan.data, undefined, bundle.record.declaredMonthlyIncome) : undefined,
  })
}
