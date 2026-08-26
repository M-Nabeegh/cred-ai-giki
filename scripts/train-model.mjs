import { ARTIFACT_JSON_PATH, ARTIFACT_TS_PATH, CREATED_AT, DATASET_PATH, MODEL_VERSION, SEED, THRESHOLD, artifactToTs, deterministicSplit, digest, ensureDir, evaluateRows, generateDataset, loadDataset, modelFeatureNames, trainLogisticModel, writeDataset } from "./credai-ml-utils.mjs"
import { writeFileSync } from "node:fs"

let dataset
try {
  dataset = loadDataset(DATASET_PATH)
} catch {
  dataset = generateDataset()
  writeDataset(dataset)
}

const { train, test } = deterministicSplit(dataset.rows)
const model = trainLogisticModel(train)
const provisionalArtifact = {
  modelVersion: MODEL_VERSION,
  modelType: "Logistic regression",
  seed: SEED,
  trainingTimestamp: CREATED_AT,
  featureNames: modelFeatureNames,
  featureDirections: Object.fromEntries(modelFeatureNames.map((name) => [name, ["utility_missed_payment_rate", "utility_amount_volatility", "telecom_failed_payment_rate", "wallet_outflow_volatility", "wallet_failed_transaction_rate", "simulated_days_late_average", "expense_volatility", "negative_balance_days"].includes(name) ? "negative" : "positive"])),
  means: model.means,
  standardDeviations: model.standardDeviations,
  imputationValues: model.imputationValues,
  coefficients: model.coefficients,
  intercept: model.intercept,
  threshold: THRESHOLD,
  trainingRowCount: train.length,
  testRowCount: test.length,
  trainingPositiveRate: train.reduce((sum, row) => sum + row.simulated_repayment_success, 0) / train.length,
  testPositiveRate: test.reduce((sum, row) => sum + row.simulated_repayment_success, 0) / test.length,
  labelDefinition: dataset.metadata.labelGenerationDescription,
  generatorVersion: dataset.metadata.generatorVersion,
  leakageSafeguards: [
    "Final demo score is not included in model features.",
    "simulated_repayment_success is used only as the training label.",
    "synthetic_audit_group is excluded from model features and used only for diagnostics.",
    "Normalization and imputation statistics are fit on the training split only.",
  ],
}
const evaluation = evaluateRows(test, provisionalArtifact, THRESHOLD)
const { scored, ...metrics } = evaluation
const artifact = {
  ...provisionalArtifact,
  trainingPositiveRate: Number(provisionalArtifact.trainingPositiveRate.toFixed(4)),
  testPositiveRate: Number(provisionalArtifact.testPositiveRate.toFixed(4)),
  metrics,
}
artifact.artifactDigest = digest(artifact)

ensureDir(ARTIFACT_JSON_PATH)
writeFileSync(ARTIFACT_JSON_PATH, `${JSON.stringify(artifact, null, 2)}\n`)
writeFileSync(ARTIFACT_TS_PATH, artifactToTs(artifact))

console.log(JSON.stringify({
  artifactPath: ARTIFACT_JSON_PATH,
  typescriptArtifactPath: ARTIFACT_TS_PATH,
  modelVersion: artifact.modelVersion,
  trainingRowCount: artifact.trainingRowCount,
  testRowCount: artifact.testRowCount,
  artifactDigest: artifact.artifactDigest,
  metrics: artifact.metrics,
  note: "Synthetic evaluation only. These results do not establish real-world lending accuracy, fairness, or regulatory suitability.",
}, null, 2))
