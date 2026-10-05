import { NextResponse } from "next/server"
import { openApiSpec } from "@/lib/openapi"

export async function GET(request: Request) {
  return NextResponse.json(openApiSpec(new URL(request.url).origin))
}
