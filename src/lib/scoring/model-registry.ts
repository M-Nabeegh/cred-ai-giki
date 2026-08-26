import { trainedModelArtifact } from "./model-artifact"

export const modelRegistry = [
  {
    id: "baseline-demo-v1.0.0",
    name: "Transparent baseline demo model",
    status: "fallback",
    type: "Rule-based weighted scorecard",
    trainingDate: "2026-08-26",
    summary: "Versioned baseline that applies transparent category weights and direction-aware normalization.",
  },
  {
    id: trainedModelArtifact.modelVersion,
    name: "Synthetic repayment logistic model",
    status: "active",
    type: "Logistic regression",
    trainingDate: trainedModelArtifact.trainingTimestamp.slice(0, 10),
    summary: "Small interpretable model trained only on deterministic synthetic repayment-success labels.",
  },
]

export const activeModelArtifact = trainedModelArtifact
