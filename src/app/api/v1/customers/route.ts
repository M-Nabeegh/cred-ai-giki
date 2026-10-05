import { NextResponse } from "next/server"
import { getPortfolio } from "@/lib/data/service"

export const dynamic = "force-dynamic"

export async function GET() {
  const portfolio = await getPortfolio()
  const data = portfolio.customers.map((customer) => {
    const report = portfolio.reports[customer.id]
    return { ...customer, score: report.score, grade: report.grade, confidence: report.confidence, missingSources: report.missingSources }
  })
  return NextResponse.json({ provider: portfolio.provider, count: data.length, data })
}
