import { ARTIFACT_JSON_PATH, DATASET_PATH, THRESHOLD, deterministicSplit, evaluateRows, fairnessDiagnostics, loadDataset } from "./credai-ml-utils.mjs"

const dataset = loadDataset(DATASET_PATH)
const artifact = loadDataset(ARTIFACT_JSON_PATH)
const { test } = deterministicSplit(dataset.rows)
const evaluation = evaluateRows(test, artifact, artifact.threshold ?? THRESHOLD)
const { scored, ...metrics } = evaluation
const fairness = fairnessDiagnostics(scored, artifact.threshold ?? THRESHOLD)

console.log(JSON.stringify({
  modelVersion: artifact.modelVersion,
  seed: artifact.seed,
  datasetPath: DATASET_PATH,
  artifactPath: ARTIFACT_JSON_PATH,
  testRowCount: test.length,
  metrics,
  syntheticFairnessDiagnostics: fairness,
  consistencyChecks: {
    accuracyMatchesConfusionMatrix: metrics.accuracy === Number(((metrics.confusionMatrix.truePositive + metrics.confusionMatrix.trueNegative) / test.length).toFixed(4)),
    calibrationCountMatchesTestRows: metrics.calibrationBins.reduce((sum, bin) => sum + bin.count, 0) === test.length,
  },
  disclaimer: "Synthetic evaluation only. These results do not establish real-world lending accuracy, fairness, or regulatory suitability.",
}, null, 2))
