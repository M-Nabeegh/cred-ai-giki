import type { Application } from "../data/types"
import { DATASET_AS_OF, generateCustomer, suggestedLoan, type CustomerSpec, type GeneratedCustomer } from "./generator"
import { addDays, seededRandom } from "../core/stats"

export const PORTFOLIO_SEED = "credai-portfolio"

/** Hand-picked profiles that make the demo tell a story; the rest are random draws. */
const SHOWCASE: Array<Omit<CustomerSpec, "index" | "seed">> = [
  { name: "Ayesha Khan", city: "Lahore", persona: "freelancer", traits: { discipline: 0.86, stability: 0.52, liquidity: 0.58, tenureYears: 6 }, sources: { utility: true, telecom: true, wallet: true, bank: true, credit: false } },
  { name: "Bilal Ahmed", city: "Karachi", persona: "gig", traits: { discipline: 0.84, stability: 0.6, liquidity: 0.5, tenureYears: 7 }, sources: { utility: true, telecom: true, wallet: true, bank: false, credit: false } },
  { name: "Sana Iqbal", city: "Faisalabad", persona: "stretched", traits: { discipline: 0.38, stability: 0.62, liquidity: 0.12, tenureYears: 4 }, sources: { utility: true, telecom: true, wallet: true, bank: true, credit: true } },
  { name: "Hamza Qureshi", city: "Islamabad", persona: "salaried", traits: { discipline: 0.84, stability: 0.86, liquidity: 0.6, tenureYears: 9 }, sources: { utility: true, telecom: true, wallet: true, bank: true, credit: true } },
  { name: "Mahnoor Siddiqui", city: "Rawalpindi", persona: "student", traits: { discipline: 0.74, stability: 0.55, liquidity: 0.4, tenureYears: 2 }, sources: { utility: false, telecom: true, wallet: true, bank: false, credit: false } },
  { name: "Usman Butt", city: "Sialkot", persona: "merchant", traits: { discipline: 0.66, stability: 0.5, liquidity: 0.48, tenureYears: 11 } },
]

export const DEMO_CUSTOMER_ID_INDEX = 0

let cache: { customers: GeneratedCustomer[]; applications: Application[] } | null = null

export function syntheticPortfolio(count = 60) {
  if (cache) return cache
  const customers = Array.from({ length: count }, (_, index) => generateCustomer({ index, seed: PORTFOLIO_SEED, asOf: DATASET_AS_OF, ...(SHOWCASE[index] ?? {}) }))
  const rng = seededRandom(`${PORTFOLIO_SEED}:applications`)
  const channels: Application["channel"][] = ["app", "app", "app", "agent", "branch"]
  const applications: Application[] = customers.slice(0, 36).map((customer, index) => {
    const loan = index === 0 ? { amount: 150_000, tenureMonths: 12, purpose: "Laptop" } : index === 1 ? { amount: 80_000, tenureMonths: 9, purpose: "Motorbike" } : suggestedLoan(customer, rng)
    const daysAgo = Math.floor(rng() * 21)
    // The oldest third already carry a decision so the audit trail and portfolio aren't empty.
    const decided = index >= 6 && daysAgo > 12
    return {
      id: `APP-${String(24_101 + index)}`,
      customerId: customer.record.customerId,
      ...loan,
      channel: channels[Math.floor(rng() * channels.length)],
      createdAt: `${addDays(DATASET_AS_OF, -daysAgo)}T${String(9 + Math.floor(rng() * 9)).padStart(2, "0")}:${String(Math.floor(rng() * 60)).padStart(2, "0")}:00+05:00`,
      status: decided ? "decided" : "pending",
    }
  })
  cache = { customers, applications }
  return cache
}
