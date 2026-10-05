/**
 * A stand-in for a partner's data API. It serves a *different* synthetic population over
 * HTTP using the CredAI data contract, so you can watch the app switch providers:
 *
 *   npm run mock:api
 *   CREDAI_DATA_PROVIDER=http CREDAI_DATA_API_URL=http://localhost:4010 CREDAI_DATA_API_KEY=dev-key npm run dev
 */
import { createServer } from "node:http"
import { generateCustomer, suggestedLoan, DATASET_AS_OF } from "../src/lib/synthetic/generator"
import { addDays, seededRandom } from "../src/lib/core/stats"

const PORT = Number(process.env.PORT ?? 4010)
const KEY = process.env.MOCK_API_KEY ?? "dev-key"
const customers = Array.from({ length: 40 }, (_, index) => generateCustomer({ index, seed: "partner-bank", asOf: DATASET_AS_OF }))
const rng = seededRandom("partner-bank:applications")
const applications = customers.slice(0, 24).map((customer, index) => ({
  id: `PB-${7001 + index}`,
  customerId: customer.record.customerId,
  ...suggestedLoan(customer, rng),
  channel: "branch",
  createdAt: `${addDays(DATASET_AS_OF, -Math.floor(rng() * 14))}T11:00:00+05:00`,
  status: "pending",
}))

createServer((request, response) => {
  const send = (status: number, body: unknown) => {
    response.writeHead(status, { "content-type": "application/json" })
    response.end(JSON.stringify(body))
  }
  if (request.headers.authorization !== `Bearer ${KEY}`) return send(401, { error: "unauthorized" })
  const url = new URL(request.url ?? "/", `http://localhost:${PORT}`)
  console.log(`${request.method} ${url.pathname}`)
  if (url.pathname === "/customers") return send(200, { data: customers.map((c) => c.record) })
  if (url.pathname === "/applications") return send(200, { data: applications })
  const match = url.pathname.match(/^\/customers\/([^/]+)$/)
  if (match) {
    const found = customers.find((c) => c.record.customerId === decodeURIComponent(match[1]))
    return found ? send(200, found.record) : send(404, { error: "not_found" })
  }
  send(404, { error: "not_found" })
}).listen(PORT, () => console.log(`Mock partner data API on http://localhost:${PORT} (Bearer ${KEY}) — ${customers.length} customers, ${applications.length} applications`))
