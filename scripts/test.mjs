import { execFileSync } from "node:child_process"

const run = (args) => JSON.parse(execFileSync(process.execPath, args, { encoding: "utf8" }))
const first = run(["scripts/generate-synthetic-data.mjs", "50"])
const second = run(["scripts/generate-synthetic-data.mjs", "50"])

if (first.deterministicDigest !== second.deterministicDigest) {
  throw new Error("Synthetic data generation is not deterministic")
}

if (first.profileCount !== 50 || first.preview.length !== 3) {
  throw new Error("Synthetic data script returned an unexpected shape")
}

const evaluation = run(["scripts/evaluate-model.mjs"])
if (evaluation.metrics.accuracy < 0 || evaluation.metrics.accuracy > 1) {
  throw new Error("Evaluation metric bounds are invalid")
}

console.log("CredAI deterministic script checks passed")
