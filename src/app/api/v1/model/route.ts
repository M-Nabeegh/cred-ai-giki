import { NextResponse } from "next/server"
import { artifact, evaluation } from "@/lib/model"

export async function GET() {
  return NextResponse.json({ artifact, metrics: evaluation.metrics, threshold: evaluation.threshold, fairness: evaluation.fairness, dataset: evaluation.dataset })
}
