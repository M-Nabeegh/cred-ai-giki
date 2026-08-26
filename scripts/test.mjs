import { existsSync, readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { ARTIFACT_JSON_PATH, DATASET_PATH, EVALUATION_SNAPSHOT_TS_PATH, FEATURES_PATH, THRESHOLD, deterministicSplit, evaluateRows, generateDataset, loadDataset, modelFeatureNames, sourceFeatureMap } from "./credai-ml-utils.mjs"

const runJson = (args) => JSON.parse(execFileSync(process.execPath, args, { encoding: "utf8" }))

const first = generateDataset({ count: 80, months: 12 })
const second = generateDataset({ count: 80, months: 12 })
if (first.metadata.deterministicDigest !== second.metadata.deterministicDigest) throw new Error("Synthetic generation digest is not stable")
if (first.rows.length !== 80) throw new Error("Generated row count mismatch")
if (first.events.length !== 80 * 12 * Object.keys(sourceFeatureMap).length) throw new Error("Generated event count mismatch")

const generated = runJson(["scripts/generate-synthetic-data.mjs", "200", "12"])
if (!existsSync(DATASET_PATH) || !existsSync(FEATURES_PATH)) throw new Error("Data generation did not write expected files")
if (generated.actualRowCount !== 200) throw new Error("Generated output row count is wrong")

const trained = runJson(["scripts/train-model.mjs"])
if (!existsSync(ARTIFACT_JSON_PATH)) throw new Error("Training did not write an artifact JSON file")
if (trained.modelVersion !== "logistic-demo-v1.1.0") throw new Error("Unexpected model version")
if (!/^[0-9a-f]{64}$/.test(trained.artifactDigest)) throw new Error("Artifact digest is not a real SHA-256 hex value")
if (!existsSync(EVALUATION_SNAPSHOT_TS_PATH)) throw new Error("Training did not write the evaluation snapshot")

const dataset = loadDataset(DATASET_PATH)
const artifact = loadDataset(ARTIFACT_JSON_PATH)
const { train, test } = deterministicSplit(dataset.rows)
if (train.length !== 160 || test.length !== 40) throw new Error("Stable 80/20 split failed for 200 generated rows")
if (artifact.featureNames.includes("simulated_repayment_success")) throw new Error("Label leakage into feature list")
if (artifact.featureNames.includes("synthetic_audit_group")) throw new Error("Audit group leakage into feature list")
if (artifact.featureNames.some((name) => !modelFeatureNames.includes(name))) throw new Error("Artifact contains undocumented features")
const consentMappedFeatures = new Set(Object.values(sourceFeatureMap).flat())
const unmappedSourceFeatures = modelFeatureNames.filter((name) => !["account_age_months", "data_completeness"].includes(name) && !consentMappedFeatures.has(name))
if (unmappedSourceFeatures.length) throw new Error(`Model features missing from source consent map: ${unmappedSourceFeatures.join(", ")}`)

const evaluation = evaluateRows(test, artifact, artifact.threshold ?? THRESHOLD)
const cm = evaluation.confusionMatrix
const expectedAccuracy = Number(((cm.truePositive + cm.trueNegative) / test.length).toFixed(4))
if (evaluation.accuracy !== expectedAccuracy) throw new Error("Accuracy and confusion matrix disagree")
const expectedPrecision = Number((cm.truePositive / Math.max(1, cm.truePositive + cm.falsePositive)).toFixed(4))
if (evaluation.precision !== expectedPrecision) throw new Error("Precision and confusion matrix disagree")
const expectedRecall = Number((cm.truePositive / Math.max(1, cm.truePositive + cm.falseNegative)).toFixed(4))
if (evaluation.recall !== expectedRecall) throw new Error("Recall and confusion matrix disagree")
const expectedF1 = expectedPrecision + expectedRecall ? Number(((2 * expectedPrecision * expectedRecall) / (expectedPrecision + expectedRecall)).toFixed(4)) : 0
if (Math.abs(evaluation.f1 - expectedF1) > 0.0002) throw new Error("F1 is inconsistent with precision and recall")
if (evaluation.accuracy < 0 || evaluation.accuracy > 1 || evaluation.rocAuc < 0 || evaluation.rocAuc > 1) throw new Error("Metric bounds are invalid")
if (evaluation.brier < 0 || evaluation.brier > 1) throw new Error("Brier score is out of bounds")
if (evaluation.calibrationBins.reduce((sum, bin) => sum + bin.count, 0) !== test.length) throw new Error("Calibration bins do not cover the test split")

const thin = dataset.rows.find((row) => row.behaviorProfile === "thin_file" && !row.sourceAvailability.repayment)
if (!thin) throw new Error("Expected a thin-file row with missing repayment source")
for (const feature of sourceFeatureMap.repayment) {
  if (thin[feature] !== null) throw new Error("Disconnected repayment source did not null its features")
}
if (thin.data_completeness >= 0.9) throw new Error("Thin-file completeness is too high")

const evaluated = runJson(["scripts/evaluate-model.mjs"])
if (!evaluated.consistencyChecks.accuracyMatchesConfusionMatrix) throw new Error("Evaluation consistency check failed")
if (!evaluated.syntheticFairnessDiagnostics.length) throw new Error("Fairness diagnostics were not computed")

const portalPages = readFileSync("src/components/portal/PortalPages.tsx", "utf8")
const workspaceShell = readFileSync("src/components/portal/WorkspaceShell.tsx", "utf8")
const credaiData = readFileSync("src/lib/credai-data.ts", "utf8")
const demoStore = readFileSync("src/lib/demo-store.ts", "utf8")
if (workspaceShell.includes("defaultRoleByWorkspace")) throw new Error("Workspace shell still grants a default role")
if (portalPages.includes("?? loanApplications[0]") || portalPages.includes("?? modelRegistry[1]")) throw new Error("Portal pages still contain silent unknown-ID fallbacks")

// Fairness diagnostics and dataset statistics must come from the computed snapshot, not static literals.
if (!credaiData.includes("evaluationSnapshot.fairnessDiagnostics")) throw new Error("Fairness diagnostics are not sourced from the computed evaluation snapshot")
if (!credaiData.includes("evaluationSnapshot.datasetRowCount")) throw new Error("Dataset summary is not sourced from the computed evaluation snapshot")
const snapshotSource = readFileSync(EVALUATION_SNAPSHOT_TS_PATH, "utf8")
if (!snapshotSource.includes("evaluationSnapshot")) throw new Error("Evaluation snapshot file is malformed")
if (!snapshotSource.includes("Synthetic Region Group")) throw new Error("Evaluation snapshot is missing computed fairness groups")

// Demo role authorization: stored roles must be validated and logout must clear the session.
if (!workspaceShell.includes("validRoles.includes")) throw new Error("Stored role values are not validated against the known role list")
if (!workspaceShell.includes("localStorage.removeItem")) throw new Error("Logout does not clear the stored demo session")

// Loan decision state transitions must be centralized in the demo store.
for (const transition of ["approve_for_demo\") return \"approved_for_demo\"", "decline_for_demo\") return \"declined_for_demo\""]) {
  if (!demoStore.includes(transition)) throw new Error(`Decision state transition missing: ${transition}`)
}
if (!demoStore.includes("reason.length < 12")) throw new Error("Decision recording no longer validates the reviewer note")

console.log("CredAI deterministic data, training, evaluation, missingness, auth, fallback, fairness-snapshot, and leakage checks passed")
