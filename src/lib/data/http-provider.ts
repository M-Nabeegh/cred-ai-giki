import { z } from "zod"
import { customerRecordSchema, type CustomerRecord } from "../core/schema"
import type { Application, DataProvider } from "./types"

const applicationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number().positive(),
  tenureMonths: z.number().int().positive(),
  purpose: z.string().default("Not specified"),
  channel: z.enum(["app", "agent", "branch"]).default("app"),
  createdAt: z.string(),
  status: z.enum(["pending", "decided"]).default("pending"),
})

/** Accept either a bare array or the common `{ data: [...] }` envelope. */
const listOf = <T extends z.ZodTypeAny>(item: T) => z.union([z.array(z.unknown()), z.object({ data: z.array(z.unknown()) })]).transform((body) => (Array.isArray(body) ? body : body.data)).pipe(z.array(z.unknown())).transform((rows) => rows.map((row) => item.safeParse(row)))

/**
 * Reads customer data from any HTTP service that implements the CredAI data contract:
 *
 *   GET {base}/customers           -> CustomerRecord[]   (or { data: CustomerRecord[] })
 *   GET {base}/customers/{id}      -> CustomerRecord
 *   GET {base}/applications        -> Application[]      (optional; 404 = none)
 *
 * Every record is validated against the same schema the scoring API uses. Records that
 * fail validation are dropped and counted, never silently coerced.
 */
export class HttpProvider implements DataProvider {
  readonly kind = "http" as const
  readonly label: string
  private rejected = 0

  constructor(private readonly baseUrl: string, private readonly apiKey?: string, private readonly revalidateSeconds = 60) {
    this.label = `HTTP · ${new URL(baseUrl).host}`
  }

  private async get(path: string) {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
      headers: { accept: "application/json", ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
      next: { revalidate: this.revalidateSeconds },
    })
    return response
  }

  async listCustomers(): Promise<CustomerRecord[]> {
    const response = await this.get("/customers")
    if (!response.ok) throw new Error(`Data API responded ${response.status} for /customers`)
    const results = listOf(customerRecordSchema).parse(await response.json())
    const valid = results.filter((result) => result.success).map((result) => result.data as CustomerRecord)
    this.rejected = results.length - valid.length
    if (this.rejected) console.warn(`[credai] ${this.rejected} customer records failed schema validation and were skipped`)
    return valid
  }

  async getCustomer(id: string) {
    const response = await this.get(`/customers/${encodeURIComponent(id)}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Data API responded ${response.status} for /customers/${id}`)
    const parsed = customerRecordSchema.safeParse(await response.json())
    if (!parsed.success) throw new Error(`Customer ${id} failed schema validation: ${parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ")}`)
    return parsed.data
  }

  async listApplications(): Promise<Application[]> {
    const response = await this.get("/applications")
    if (response.status === 404) return []
    if (!response.ok) throw new Error(`Data API responded ${response.status} for /applications`)
    return listOf(applicationSchema).parse(await response.json()).filter((result) => result.success).map((result) => result.data as Application)
  }

  async health() {
    const started = performance.now()
    try {
      const customers = await this.listCustomers()
      return { ok: true, provider: this.label, detail: `Connected. ${customers.length} customers validated against the data contract.`, latencyMs: Math.round(performance.now() - started), customers: customers.length, rejected: this.rejected }
    } catch (error) {
      return { ok: false, provider: this.label, detail: error instanceof Error ? error.message : "Unknown error", latencyMs: Math.round(performance.now() - started), customers: 0, rejected: 0 }
    }
  }
}
