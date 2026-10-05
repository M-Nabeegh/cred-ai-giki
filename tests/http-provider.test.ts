import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpProvider } from "@/lib/data/http-provider"
import { syntheticPortfolio } from "@/lib/synthetic/portfolio"

const good = syntheticPortfolio().customers[0].record

afterEach(() => vi.unstubAllGlobals())

describe("HttpProvider", () => {
  it("sends the bearer token and drops records that fail the contract", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [good, { customerId: "broken" }] }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const provider = new HttpProvider("https://data.example.test/v1", "secret")
    const customers = await provider.listCustomers()
    expect(customers).toHaveLength(1)
    expect(customers[0].customerId).toBe(good.customerId)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://data.example.test/v1/customers")
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret")
  })

  it("treats a missing applications endpoint as no applications", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })))
    expect(await new HttpProvider("https://data.example.test").listApplications()).toEqual([])
  })

  it("reports an unreachable upstream as unhealthy instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 502 })))
    const health = await new HttpProvider("https://data.example.test").health()
    expect(health.ok).toBe(false)
    expect(health.detail).toContain("502")
  })
})
