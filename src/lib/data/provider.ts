import "server-only"
import { HttpProvider } from "./http-provider"
import { SyntheticProvider } from "./synthetic-provider"
import type { DataProvider } from "./types"

let provider: DataProvider | null = null

/**
 * Choose where customer data comes from.
 *
 *   CREDAI_DATA_PROVIDER=synthetic   (default) seeded in-process generator
 *   CREDAI_DATA_PROVIDER=http        any service implementing the data contract
 *     CREDAI_DATA_API_URL=https://data.your-bank.example/v1
 *     CREDAI_DATA_API_KEY=...        sent as a Bearer token (optional)
 */
export function getProvider(): DataProvider {
  if (provider) return provider
  const kind = process.env.CREDAI_DATA_PROVIDER ?? "synthetic"
  if (kind === "http") {
    const url = process.env.CREDAI_DATA_API_URL
    if (!url) throw new Error("CREDAI_DATA_PROVIDER=http requires CREDAI_DATA_API_URL")
    provider = new HttpProvider(url, process.env.CREDAI_DATA_API_KEY, Number(process.env.CREDAI_DATA_REVALIDATE ?? 60))
  } else {
    provider = new SyntheticProvider()
  }
  return provider
}
