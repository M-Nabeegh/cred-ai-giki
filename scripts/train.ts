/**
 * Generate the synthetic population, engineer features with the production feature
 * engine, fit the scorecard and write the artifact + evaluation the app ships with.
 *
 *   npm run model:train                # 4,000 customers (default)
 *   npm run model:train -- --count 800 # quicker run
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { trainPipeline } from "../src/lib/model/train"
import { DATASET_AS_OF } from "../src/lib/synthetic/generator"
import { FEATURE_KEYS } from "../src/lib/core/features"

const arg = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : fallback
}

const count = Number(arg("count", "4000"))
const seed = arg("seed", "credai-v2")
const out = arg("out", "src/lib/model")
const started = performance.now()

const { artifact, evaluation, rows } = trainPipeline({ count, seed, asOf: DATASET_AS_OF, version: "credai-scorecard-2.0.0", trainedAt: "2026-10-05" })
const digest = createHash("sha256").update(JSON.stringify(artifact)).digest("hex").slice(0, 16)

mkdirSync(out, { recursive: true })
writeFileSync(join(out, "artifact.json"), JSON.stringify({ ...artifact, digest }, null, 2) + "\n")
writeFileSync(join(out, "evaluation.json"), JSON.stringify(evaluation, null, 2) + "\n")

mkdirSync("data", { recursive: true })
const header = ["customer_id", "persona", "audit_group", ...FEATURE_KEYS, "repaid"]
const csv = [header.join(","), ...rows.map((row) => [row.id, row.persona, row.group, ...FEATURE_KEYS.map((key) => row.values[key] ?? ""), row.outcome].join(","))].join("\n")
writeFileSync("data/training-features.csv", csv + "\n")

const m = evaluation.metrics
console.log(`trained ${artifact.version} on ${artifact.training.rows} rows (${evaluation.dataset.transactions.toLocaleString()} raw records) in ${Math.round(performance.now() - started)}ms`)
console.log(`AUC ${m.auc}  Gini ${m.gini}  KS ${m.ks}  Brier ${m.brier}  approval ${m.approvalRate}  bad-rate approved ${m.badRateApproved} / declined ${m.badRateDeclined}`)
console.log("positive rate", evaluation.dataset.positiveRate, "grades", evaluation.gradeTable.map((g) => `${g.grade}:${g.count}/${g.badRate}`).join(" "))
console.log("ablation", evaluation.ablation.map((a) => `${a.source}:-${a.aucDrop}`).join(" "))
console.log("fairness", evaluation.fairness.map((f) => `${f.group}:${f.approvalRate}/AIR ${f.adverseImpactRatio}`).join(" "))
console.log("top weights", evaluation.coefficients.slice(0, 8).map((c) => `${c.key}=${c.weight.toFixed(3)}`).join(" "))
