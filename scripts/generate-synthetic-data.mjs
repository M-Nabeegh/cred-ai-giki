import { DATASET_PATH, DEFAULT_MONTHS, DEFAULT_PROFILE_COUNT, FEATURES_PATH, SEED, generateDataset, writeDataset } from "./credai-ml-utils.mjs"

const count = Number(process.argv[2] ?? process.env.CREDAI_PROFILE_COUNT ?? DEFAULT_PROFILE_COUNT)
const months = Number(process.argv[3] ?? process.env.CREDAI_OBSERVATION_MONTHS ?? DEFAULT_MONTHS)

if (!Number.isInteger(count) || count < 10 || count > 10000) {
  throw new Error("Profile count must be an integer between 10 and 10000")
}

if (!Number.isInteger(months) || months < 3 || months > 36) {
  throw new Error("Observation months must be an integer between 3 and 36")
}

const dataset = generateDataset({ count, months, seed: SEED })
writeDataset(dataset)

console.log(JSON.stringify({
  ...dataset.metadata,
  datasetPath: DATASET_PATH,
  featurePath: FEATURES_PATH,
  previewRows: dataset.rows.slice(0, 3),
}, null, 2))
