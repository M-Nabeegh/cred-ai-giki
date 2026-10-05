/** Writes examples/customer-record.json — a real, valid payload for POST /api/v1/score. */
import { writeFileSync } from "node:fs"
import { syntheticPortfolio } from "../src/lib/synthetic/portfolio"

const bilal = syntheticPortfolio().customers[1].record
writeFileSync("examples/customer-record.json", JSON.stringify({ customer: bilal, loan: { amount: 80000, tenureMonths: 9, purpose: "Motorbike" } }, null, 2) + "\n")
console.log(`wrote examples/customer-record.json for ${bilal.displayName}`)
