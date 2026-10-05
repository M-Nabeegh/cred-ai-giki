import { z } from "zod"

/**
 * The raw data contract. Anything that can produce a `CustomerRecord` — the built-in
 * synthetic generator, a bank's core system, a telco or wallet partner API — can be
 * scored by CredAI without touching the feature engine or the model.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Expected an ISO-8601 date (YYYY-MM-DD…)")
const amount = z.number().finite().nonnegative()

export const SOURCE_KEYS = ["utility", "telecom", "wallet", "bank", "credit"] as const
export type SourceKey = (typeof SOURCE_KEYS)[number]

export const utilityBillSchema = z.object({
  provider: z.string().optional(),
  kind: z.enum(["electricity", "gas", "water", "internet"]).default("electricity"),
  issuedAt: isoDate,
  dueDate: isoDate,
  paidAt: isoDate.nullable(),
  amount,
})

export const telecomPaymentSchema = z.object({
  date: isoDate,
  amount,
  kind: z.enum(["recharge", "postpaid_bill"]).default("recharge"),
  status: z.enum(["success", "failed"]),
})

export const walletTransactionSchema = z.object({
  date: isoDate,
  amount,
  direction: z.enum(["in", "out"]),
  status: z.enum(["success", "failed"]),
  balanceAfter: z.number().finite().optional(),
  counterparty: z.string().optional(),
})

export const bankTransactionSchema = z.object({
  date: isoDate,
  amount,
  direction: z.enum(["in", "out"]),
  category: z.string().optional(),
  balanceAfter: z.number().finite(),
})

export const installmentSchema = z.object({
  dueDate: isoDate,
  paidAt: isoDate.nullable(),
  amount,
})

export const customerRecordSchema = z.object({
  customerId: z.string().min(1),
  displayName: z.string().min(1),
  city: z.string().optional(),
  segment: z.string().optional(),
  asOf: isoDate,
  declaredMonthlyIncome: amount.optional(),
  consent: z
    .object({
      utility: z.boolean().default(true),
      telecom: z.boolean().default(true),
      wallet: z.boolean().default(true),
      bank: z.boolean().default(true),
      credit: z.boolean().default(true),
    })
    .default({ utility: true, telecom: true, wallet: true, bank: true, credit: true }),
  utility: z.object({ accountRef: z.string().optional(), bills: z.array(utilityBillSchema) }).optional(),
  telecom: z.object({ operator: z.string().optional(), accountOpenedAt: isoDate, payments: z.array(telecomPaymentSchema) }).optional(),
  wallet: z.object({ provider: z.string().optional(), transactions: z.array(walletTransactionSchema) }).optional(),
  bank: z.object({ institution: z.string().optional(), transactions: z.array(bankTransactionSchema) }).optional(),
  credit: z.object({ lender: z.string().optional(), installments: z.array(installmentSchema) }).optional(),
})

export type UtilityBill = z.infer<typeof utilityBillSchema>
export type TelecomPayment = z.infer<typeof telecomPaymentSchema>
export type WalletTransaction = z.infer<typeof walletTransactionSchema>
export type BankTransaction = z.infer<typeof bankTransactionSchema>
export type Installment = z.infer<typeof installmentSchema>
export type CustomerRecord = z.infer<typeof customerRecordSchema>
export type Consent = CustomerRecord["consent"]

export const loanRequestSchema = z.object({
  amount: z.number().positive(),
  tenureMonths: z.number().int().min(1).max(60),
  purpose: z.string().optional(),
})
export type LoanRequest = z.infer<typeof loanRequestSchema>

export const sourceMeta: Record<SourceKey, { label: string; description: string; examples: string }> = {
  utility: { label: "Utility bills", description: "Electricity, gas and water bills with due and paid dates.", examples: "LESCO, K-Electric, SNGPL" },
  telecom: { label: "Mobile account", description: "Prepaid recharges or postpaid bills and account age.", examples: "Jazz, Zong, Telenor, Ufone" },
  wallet: { label: "Mobile wallet", description: "Wallet transfers, bill payments and balances.", examples: "JazzCash, Easypaisa, SadaPay" },
  bank: { label: "Bank account", description: "Current-account inflows, outflows and running balance.", examples: "Any account with statement access" },
  credit: { label: "Repayment history", description: "Instalments on earlier microloans or BNPL plans.", examples: "Microfinance banks, BNPL" },
}
