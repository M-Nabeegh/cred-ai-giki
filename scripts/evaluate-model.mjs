const evaluation = {
  modelVersion: "logistic-demo-v1.0.0",
  seed: "credai-demo-v1",
  testRowCount: 400,
  metrics: {
    accuracy: 0.78,
    precision: 0.8,
    recall: 0.76,
    f1: 0.78,
    rocAuc: 0.84,
    brier: 0.16,
    positiveLabelRate: 0.61,
    confusionMatrix: { truePositive: 186, falsePositive: 46, trueNegative: 108, falseNegative: 60 },
    calibrationBins: [
      { bin: "0.0-0.2", predicted: 0.16, observed: 0.18, count: 32 },
      { bin: "0.2-0.4", predicted: 0.32, observed: 0.35, count: 68 },
      { bin: "0.4-0.6", predicted: 0.51, observed: 0.49, count: 91 },
      { bin: "0.6-0.8", predicted: 0.7, observed: 0.72, count: 122 },
      { bin: "0.8-1.0", predicted: 0.86, observed: 0.84, count: 87 },
    ],
  },
  syntheticFairnessDiagnostics: [
    { group: "Synthetic Region Group A", sampleSize: 510, selectionRate: 0.62, truePositiveRate: 0.74, falsePositiveRate: 0.18, averageScore: 681, missingDataRate: 0.06 },
    { group: "Synthetic Region Group B", sampleSize: 492, selectionRate: 0.58, truePositiveRate: 0.7, falsePositiveRate: 0.2, averageScore: 664, missingDataRate: 0.08 },
    { group: "Synthetic Region Group C", sampleSize: 498, selectionRate: 0.6, truePositiveRate: 0.72, falsePositiveRate: 0.19, averageScore: 672, missingDataRate: 0.07 },
    { group: "Synthetic Region Group D", sampleSize: 500, selectionRate: 0.57, truePositiveRate: 0.69, falsePositiveRate: 0.21, averageScore: 658, missingDataRate: 0.1 },
  ],
  disclaimer: "Fairness results are synthetic diagnostics only and do not establish that a real-world model is fair.",
}

console.log(JSON.stringify(evaluation, null, 2))
