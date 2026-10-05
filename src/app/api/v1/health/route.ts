import { NextResponse } from "next/server"
import { getProvider } from "@/lib/data/provider"
import { artifact } from "@/lib/model"

export const dynamic = "force-dynamic"

export async function GET() {
  const health = await getProvider().health()
  return NextResponse.json({ status: health.ok ? "ok" : "degraded", data: health, model: { version: artifact.version, digest: artifact.digest } }, { status: health.ok ? 200 : 503 })
}
