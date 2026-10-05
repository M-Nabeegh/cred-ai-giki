import type { BankTransaction, CustomerRecord, Installment, SourceKey, TelecomPayment, UtilityBill, WalletTransaction } from "../core/schema"
import { addDays, addMonths, clamp, gaussian, monthsEnding, round, seededRandom, sigmoid, type Rng } from "../core/stats"

/**
 * Agent-style synthetic data. Each customer has hidden traits; the traits drive raw
 * transactions, and separately drive the repayment outcome. The model only ever sees
 * features engineered from the transactions — never the traits or the outcome process.
 */

export const DATASET_AS_OF = "2026-09-30"
/** Months of raw history generated; features use the trailing 12, the rest powers score history. */
export const HISTORY_MONTHS = 18

export type PersonaKey = "salaried" | "gig" | "merchant" | "freelancer" | "student" | "stretched"

export type Traits = { discipline: number; stability: number; liquidity: number; tenureYears: number }

type Persona = {
  label: string
  income: number
  traits: Omit<Traits, "tenureYears">
  tenure: [number, number]
  sourceOdds: Record<SourceKey, number>
  purposes: string[]
  weight: number
}

export const PERSONAS: Record<PersonaKey, Persona> = {
  salaried: { label: "Salaried employee", income: 95_000, traits: { discipline: 0.78, stability: 0.85, liquidity: 0.58 }, tenure: [3, 12], sourceOdds: { utility: 1, telecom: 1, wallet: 0.7, bank: 0.95, credit: 0.45 }, purposes: ["Home repair", "Education fees", "Motorbike", "Medical"], weight: 0.24 },
  gig: { label: "Ride-hailing & delivery", income: 62_000, traits: { discipline: 0.64, stability: 0.45, liquidity: 0.4 }, tenure: [1, 8], sourceOdds: { utility: 0.85, telecom: 1, wallet: 0.97, bank: 0.3, credit: 0.35 }, purposes: ["Motorbike", "Phone upgrade", "Working capital"], weight: 0.2 },
  merchant: { label: "Small shop owner", income: 140_000, traits: { discipline: 0.68, stability: 0.55, liquidity: 0.55 }, tenure: [3, 15], sourceOdds: { utility: 1, telecom: 1, wallet: 0.92, bank: 0.7, credit: 0.55 }, purposes: ["Inventory", "Shop expansion", "Working capital"], weight: 0.15 },
  freelancer: { label: "Freelancer", income: 120_000, traits: { discipline: 0.72, stability: 0.42, liquidity: 0.62 }, tenure: [2, 10], sourceOdds: { utility: 0.9, telecom: 1, wallet: 0.85, bank: 0.85, credit: 0.2 }, purposes: ["Laptop", "Education fees", "Home repair"], weight: 0.12 },
  student: { label: "Student or first job", income: 32_000, traits: { discipline: 0.6, stability: 0.5, liquidity: 0.35 }, tenure: [0.5, 4], sourceOdds: { utility: 0.35, telecom: 1, wallet: 0.85, bank: 0.3, credit: 0.08 }, purposes: ["Education fees", "Laptop", "Phone upgrade"], weight: 0.13 },
  stretched: { label: "Over-extended household", income: 70_000, traits: { discipline: 0.42, stability: 0.6, liquidity: 0.18 }, tenure: [2, 10], sourceOdds: { utility: 1, telecom: 1, wallet: 0.8, bank: 0.7, credit: 0.7 }, purposes: ["Debt consolidation", "Medical", "Rent advance"], weight: 0.16 },
}

const FIRST = ["Ayesha", "Bilal", "Sana", "Hamza", "Fatima", "Usman", "Mahnoor", "Ali", "Zainab", "Hassan", "Iqra", "Saad", "Hira", "Omar", "Maryam", "Danish", "Kiran", "Faisal", "Noor", "Imran", "Rabia", "Asad", "Mehwish", "Tariq", "Anam", "Kamran", "Sadia", "Waqas", "Amna", "Junaid", "Laiba", "Shahid"]
const LAST = ["Khan", "Ahmed", "Iqbal", "Raza", "Malik", "Hussain", "Qureshi", "Siddiqui", "Butt", "Chaudhry", "Sheikh", "Mirza", "Abbasi", "Javed", "Farooq", "Aslam"]
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad", "Quetta", "Sialkot"]
const UTILITIES: Record<string, string> = { Lahore: "LESCO", Karachi: "K-Electric", Islamabad: "IESCO", Rawalpindi: "IESCO", Faisalabad: "FESCO", Multan: "MEPCO", Peshawar: "PESCO", Hyderabad: "HESCO", Quetta: "QESCO", Sialkot: "GEPCO" }
const OPERATORS = ["Jazz", "Zong", "Telenor", "Ufone"]
const WALLETS = ["JazzCash", "Easypaisa", "SadaPay", "NayaPay"]
const BANKS = ["Ravi Commercial Bank", "Indus Savings Bank", "Margalla Bank", "Crescent Microfinance"]
const LENDERS = ["Kisaan Microfinance", "Rahbar BNPL", "Crescent Microfinance"]

/** Fairness audit cohort. Deliberately NOT a model input; used only to test for disparate outcomes. */
export const AUDIT_GROUPS = ["North", "Central", "South", "West"] as const
const CITY_GROUP: Record<string, (typeof AUDIT_GROUPS)[number]> = { Lahore: "Central", Faisalabad: "Central", Sialkot: "Central", Multan: "Central", Karachi: "South", Hyderabad: "South", Islamabad: "North", Rawalpindi: "North", Peshawar: "West", Quetta: "West" }

export type GeneratedCustomer = {
  record: CustomerRecord
  persona: PersonaKey
  auditGroup: (typeof AUDIT_GROUPS)[number]
  traits: Traits
  /** Simulated 12-month repayment outcome: 1 = repaid as agreed. Ground truth for training only. */
  outcome: 0 | 1
  outcomeProbability: number
  monthlyIncome: number
}

export type CustomerSpec = {
  index: number
  seed: string
  asOf?: string
  persona?: PersonaKey
  name?: string
  city?: string
  traits?: Partial<Traits>
  sources?: Partial<Record<SourceKey, boolean>>
}

/** Short stable tag per seed so ids from different populations never collide. */
const seedTag = (seed: string) => Math.floor(seededRandom(`tag:${seed}`)() * 36 ** 3).toString(36).padStart(3, "0")
const pick = <T,>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)]
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min)
const roundTo = (value: number, step: number) => Math.max(step, Math.round(value / step) * step)
const dayIn = (month: string, day: number) => `${month}-${String(clamp(Math.round(day), 1, 28)).padStart(2, "0")}`

function pickPersona(rng: Rng): PersonaKey {
  let roll = rng()
  for (const [key, persona] of Object.entries(PERSONAS) as Array<[PersonaKey, Persona]>) {
    roll -= persona.weight
    if (roll <= 0) return key
  }
  return "salaried"
}

export function outcomeProbability(traits: Traits) {
  return sigmoid(0.9 + 4.4 * (traits.discipline - 0.6) + 2.2 * (traits.stability - 0.6) + 3.4 * (traits.liquidity - 0.45) + 0.08 * Math.min(10, traits.tenureYears))
}

export function generateCustomer(spec: CustomerSpec): GeneratedCustomer {
  const rng = seededRandom(`${spec.seed}:${spec.index}`)
  const asOf = spec.asOf ?? DATASET_AS_OF
  const personaKey = spec.persona ?? pickPersona(rng)
  const persona = PERSONAS[personaKey]
  const city = spec.city ?? pick(rng, CITIES)
  const name = spec.name ?? `${pick(rng, FIRST)} ${pick(rng, LAST)}`
  const trait = (base: number) => clamp(base + 0.17 * gaussian(rng), 0.03, 0.97)
  const traits: Traits = {
    discipline: trait(persona.traits.discipline),
    stability: trait(persona.traits.stability),
    liquidity: trait(persona.traits.liquidity),
    tenureYears: round(between(rng, ...persona.tenure), 1),
    ...spec.traits,
  }
  const income = roundTo(persona.income * Math.exp(0.28 * gaussian(rng)), 1000)
  const has = Object.fromEntries((Object.keys(persona.sourceOdds) as SourceKey[]).map((key) => [key, spec.sources?.[key] ?? rng() < persona.sourceOdds[key]])) as Record<SourceKey, boolean>
  if (!has.bank && !has.wallet) has.wallet = true

  const months = monthsEnding(asOf, HISTORY_MONTHS)
  const after = (date: string) => date > asOf
  const id = `cus_${seedTag(spec.seed)}${String(spec.index + 1).padStart(4, "0")}`

  // Income: realised monthly amounts shared by bank and/or wallet ledgers.
  const incomeEvents: Array<{ date: string; amount: number; counterparty: string }> = []
  for (const month of months) {
    const gapOdds = personaKey === "salaried" || personaKey === "stretched" ? (1 - traits.stability) * 0.06 : (1 - traits.stability) * 0.16
    if (rng() < gapOdds) continue
    if (personaKey === "salaried" || personaKey === "stretched") {
      incomeEvents.push({ date: dayIn(month, between(rng, 1, 3)), amount: roundTo(income * (1 + 0.04 * gaussian(rng)), 100), counterparty: "Payroll" })
    } else {
      const count = personaKey === "student" ? 1 + Math.floor(rng() * 2) : personaKey === "merchant" ? 8 : 3 + Math.floor(rng() * 6)
      const total = income * clamp(1 + (1 - traits.stability) * 0.55 * gaussian(rng), 0.15, 2.2)
      for (let k = 0; k < count; k += 1) {
        incomeEvents.push({ date: dayIn(month, between(rng, 1, 28)), amount: roundTo((total / count) * between(rng, 0.6, 1.4), 50), counterparty: personaKey === "gig" ? "Platform payout" : personaKey === "merchant" ? "Sales deposit" : personaKey === "freelancer" ? "Client payment" : "Family transfer" })
      }
    }
  }
  const incomeInBank = has.bank
  const incomeLedger = incomeEvents.filter((event) => !after(event.date))

  // Spending plan per month, sized from *expected* income so lean months bite.
  const spendPlan = (month: string) => {
    const ratio = clamp(0.7 + (1 - traits.liquidity) * 0.44 + 0.07 * gaussian(rng), 0.45, 1.6) * clamp(1 + (1 - traits.stability) * 0.3 * gaussian(rng), 0.6, 1.6)
    const rows: Array<{ date: string; amount: number; category: string }> = []
    const total = income * ratio
    if (personaKey !== "student") rows.push({ date: dayIn(month, 5), amount: roundTo(total * 0.3, 100), category: "Rent" })
    const pieces = 6 + Math.floor(rng() * 5)
    const rest = personaKey === "student" ? total : total * 0.7
    for (let k = 0; k < pieces; k += 1) rows.push({ date: dayIn(month, between(rng, 1, 28)), amount: roundTo((rest / pieces) * between(rng, 0.5, 1.5), 50), category: pick(rng, ["Groceries", "Fuel", "School", "Transfer", "Medical", "Shopping", "Food"]) })
    return rows
  }

  const bankRows: BankTransaction[] = []
  const walletRows: WalletTransaction[] = []
  const walletProvider = pick(rng, WALLETS)

  if (has.bank) {
    const events = [
      ...incomeLedger.map((event) => ({ ...event, direction: "in" as const, category: "Income" })),
      ...months.flatMap((month) => spendPlan(month)).filter((row) => !after(row.date)).map((row) => ({ ...row, direction: "out" as const, counterparty: row.category })),
    ].sort((a, b) => a.date.localeCompare(b.date) || (a.direction === "in" ? -1 : 1))
    let balance = roundTo(income * traits.liquidity * 2.2, 100)
    for (const event of events) {
      balance += event.direction === "in" ? event.amount : -event.amount
      bankRows.push({ date: event.date, amount: event.amount, direction: event.direction, category: event.category, balanceAfter: Math.round(balance) })
    }
  }

  if (has.wallet) {
    const ins = incomeInBank
      ? months.flatMap((month) => (rng() < 0.45 + 0.5 * traits.stability ? Array.from({ length: 1 + Math.floor(rng() * 3) }, () => ({ date: dayIn(month, between(rng, 1, 28)), amount: roundTo(income * between(rng, 0.04, 0.12), 50), counterparty: "P2P transfer" })) : []))
      : incomeLedger
    const outs = incomeInBank
      ? months.flatMap((month) => Array.from({ length: 3 + Math.floor(rng() * 4) }, () => ({ date: dayIn(month, between(rng, 1, 28)), amount: roundTo(income * between(rng, 0.02, 0.07) * (1.3 - traits.liquidity * 0.5), 50), counterparty: pick(rng, ["Bill payment", "Mobile load", "Merchant", "Transfer"]) })))
      : months.flatMap((month) => spendPlan(month).map((row) => ({ date: row.date, amount: row.amount, counterparty: row.category })))
    const events = [...ins.map((row) => ({ ...row, direction: "in" as const })), ...outs.map((row) => ({ ...row, direction: "out" as const }))]
      .filter((row) => !after(row.date))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.direction === "in" ? -1 : 1))
    let balance = roundTo(income * traits.liquidity * (incomeInBank ? 0.25 : 1.2), 50)
    for (const event of events) {
      if (event.direction === "out" && event.amount > balance) {
        // Wallets cannot overdraw: a failed attempt, sometimes retried with a smaller amount.
        walletRows.push({ date: event.date, amount: event.amount, direction: "out", status: "failed", balanceAfter: Math.round(balance), counterparty: event.counterparty })
        continue
      }
      balance += event.direction === "in" ? event.amount : -event.amount
      walletRows.push({ date: event.date, amount: event.amount, direction: event.direction, status: "success", balanceAfter: Math.round(balance), counterparty: event.counterparty })
    }
  }

  const bills: UtilityBill[] = []
  if (has.utility) {
    const provider = UTILITIES[city] ?? "LESCO"
    const hasGas = rng() < 0.7
    for (const month of months) {
      const monthNumber = +month.slice(5, 7)
      const summer = monthNumber >= 5 && monthNumber <= 9
      const winter = monthNumber === 12 || monthNumber <= 2
      const kinds: Array<{ kind: UtilityBill["kind"]; base: number; provider: string }> = [{ kind: "electricity", base: income * 0.055 * (summer ? 1.8 : winter ? 0.7 : 1), provider }]
      if (hasGas) kinds.push({ kind: "gas", base: income * 0.018 * (winter ? 2.4 : 0.8), provider: city === "Karachi" || city === "Hyderabad" || city === "Quetta" ? "SSGC" : "SNGPL" })
      for (const item of kinds) {
        const issuedAt = dayIn(month, 4)
        const dueDate = dayIn(month, 18)
        const roll = rng()
        const onTime = Math.pow(traits.discipline, 1.25) * (0.88 + 0.12 * traits.liquidity)
        let paidAt: string | null
        if (roll < onTime) paidAt = addDays(dueDate, -Math.floor(rng() * 10))
        else if (roll < onTime + (1 - onTime) * 0.78) paidAt = addDays(dueDate, 1 + Math.floor(rng() * (6 + (1 - traits.discipline) * 38)))
        else paidAt = null
        if (paidAt && after(paidAt)) paidAt = null
        bills.push({ provider: item.provider, kind: item.kind, issuedAt, dueDate, paidAt, amount: roundTo(item.base * (1 + 0.12 * gaussian(rng)), 10) })
      }
    }
  }

  const payments: TelecomPayment[] = []
  const operator = pick(rng, OPERATORS)
  const accountOpenedAt = addMonths(asOf, -Math.max(1, Math.round(traits.tenureYears * 12 + between(rng, 0, 24))))
  if (has.telecom) {
    for (const month of months) {
      if (rng() < (1 - traits.stability) * 0.18 + (1 - traits.liquidity) * 0.08) continue
      const count = 1 + Math.floor(rng() * (2 + 3 * traits.stability))
      for (let k = 0; k < count; k += 1) {
        const date = dayIn(month, between(rng, 1, 28))
        if (after(date)) continue
        payments.push({ date, amount: roundTo(between(rng, 100, 1200), 50), kind: "recharge", status: rng() < 0.015 + (1 - traits.liquidity) * 0.09 ? "failed" : "success" })
      }
    }
  }

  const installments: Installment[] = []
  if (has.credit) {
    const start = addMonths(asOf, -Math.round(between(rng, 5, 16)))
    const count = pick(rng, [6, 9, 12])
    const amount = roundTo(income * between(rng, 0.08, 0.16), 100)
    for (let k = 1; k <= count; k += 1) {
      const dueDate = addMonths(start, k)
      if (after(dueDate)) break
      const roll = rng()
      const onTime = Math.pow(traits.discipline, 1.1) * (0.85 + 0.15 * traits.liquidity)
      let paidAt: string | null
      if (roll < onTime) paidAt = addDays(dueDate, -Math.floor(rng() * 4))
      else if (roll < onTime + (1 - onTime) * 0.8) paidAt = addDays(dueDate, 1 + Math.floor(rng() * (4 + (1 - traits.discipline) * 50)))
      else paidAt = null
      if (paidAt && after(paidAt)) paidAt = null
      installments.push({ dueDate, paidAt, amount })
    }
  }

  const record: CustomerRecord = {
    customerId: id,
    displayName: name,
    city,
    segment: persona.label,
    asOf,
    declaredMonthlyIncome: income,
    consent: { utility: true, telecom: true, wallet: true, bank: true, credit: true },
    ...(has.utility ? { utility: { accountRef: `${UTILITIES[city] ?? "LESCO"}-${String(Math.floor(rng() * 1e8)).padStart(8, "0")}`, bills } } : {}),
    ...(has.telecom ? { telecom: { operator, accountOpenedAt, payments } } : {}),
    ...(has.wallet ? { wallet: { provider: walletProvider, transactions: walletRows } } : {}),
    ...(has.bank ? { bank: { institution: pick(rng, BANKS), transactions: bankRows } } : {}),
    ...(has.credit && installments.length ? { credit: { lender: pick(rng, LENDERS), installments } } : {}),
  }

  const probability = outcomeProbability(traits)
  return {
    record,
    persona: personaKey,
    auditGroup: CITY_GROUP[city] ?? "Central",
    traits,
    outcome: seededRandom(`${spec.seed}:outcome:${spec.index}`)() < probability ? 1 : 0,
    outcomeProbability: round(probability, 4),
    monthlyIncome: income,
  }
}

export function generateCustomers(count: number, seed: string, asOf = DATASET_AS_OF) {
  return Array.from({ length: count }, (_, index) => generateCustomer({ index, seed, asOf }))
}

export function suggestedLoan(customer: GeneratedCustomer, rng: Rng) {
  const persona = PERSONAS[customer.persona]
  return {
    amount: roundTo(customer.monthlyIncome * between(rng, 0.4, 2.6), 5000),
    tenureMonths: pick(rng, [6, 9, 12, 12, 18, 24]),
    purpose: pick(rng, persona.purposes),
  }
}
