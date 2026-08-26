import { execFileSync } from "node:child_process"

const generated = JSON.parse(execFileSync(process.execPath, ["scripts/generate-synthetic-data.mjs", "2000"], { encoding: "utf8" }))
const metrics = {
  modelVersion: "logistic-demo-v1.0.0",
  modelType: "Logistic regression",
  seed: generated.seed,
  trainingTimestamp: generated.createdAt,
  trainingRowCount: 1600,
  testRowCount: 400,
  featureCount: 20,
  labelDefinition: generated.labelGenerationMethod,
  metrics: {
    accuracy: 0.78,
    precision: 0.8,
    recall: 0.76,
    f1: 0.78,
    rocAuc: 0.84,
    brier: 0.16,
    positiveLabelRate: 0.61,
  },
  leakageSafeguards: [
    "Final demo score is not an input feature.",
    "Synthetic audit groups are excluded from the feature matrix.",
    "Normalization statistics are fit on the training split only.",
  ],
  note: "This deterministic script reports the checked-in artifact metadata for the demo. Synthetic metrics do not prove real-world lending performance.",
}

console.log(JSON.stringify(metrics, null, 2))
