# CredAI Model Card

## Intended use
CredAI demonstrates transparent alternative credit-intelligence concepts using synthetic data. It is intended for coursework, portfolio demonstration, product walkthroughs, and engineering discussion.

## Demo-only scope
The model output is a demo profile score. It is not a real credit score, financial recommendation, credit bureau output, loan approval, or automated decision.

## Out-of-scope use
Do not use this prototype for production lending, real customer eligibility, pricing, collections, fraud detection, legal compliance, or regulatory reporting.

## Synthetic data source
The dataset is deterministically generated from seed `credai-demo-v1`. It simulates utility behavior, telecom continuity, JazzCash-like wallet patterns, Easypaisa-like wallet patterns, bank cash-flow behavior, and repayment behavior. It does not use real customer data.

## Label-generation method
The learned model predicts `simulated_repayment_success`, a synthetic label generated from a latent behavior process involving repayment discipline, payment consistency, income stability, cash-flow coverage, tenure, and controlled noise. The final demo score is not used as an input feature.

## Features
Model-eligible features include utility payment ratios, telecom regularity, wallet stability, repayment ratios, cash-flow coverage, income stability, expense volatility, negative-balance days, account age, and data completeness.

## Excluded features
Religion, ethnicity, gender, marital status, political affiliation, contact-list contents, SMS text, message sentiment, social-media content, exact GPS history, device fingerprint, protected personal characteristics, and proxy features designed to infer protected characteristics are excluded.

## Training process
The training script generates 2000 deterministic synthetic rows from seed `credai-demo-v1` (144,000 monthly observations, measured missingness ≈ 8.2%), performs a deterministic digest-ordered 80/20 train/test split (1600 train / 400 test), fits normalization statistics on the training rows only, trains a small logistic regression model with full-batch gradient descent (learning rate 0.08, 900 iterations, L2 0.001), and writes a versioned artifact (`logistic-demo-v1.1.0`) for browser inference. Positive-label rate: 0.6894 train / 0.72 test. Decision threshold: 0.58. A browser-side port of the same pipeline (`src/lib/scoring/browser-pipeline.ts`) lets the admin UI regenerate data, retrain a smaller model, and recompute evaluation without leaving the demo; those runs are clearly labeled local-only and never replace the checked-in artifact.

## Metrics
Measured on the held-out 400-row test split of the checked-in artifact:

| Metric | Value |
| --- | --- |
| Accuracy | 0.885 |
| Precision | 0.9549 |
| Recall | 0.8819 |
| F1 | 0.917 |
| ROC-AUC | 0.9612 |
| Brier score | 0.0742 |
| Confusion matrix | TP 254 / FP 12 / TN 100 / FN 34 |
| Artifact digest (SHA-256) | `dd998daa0d71ab02426f4876528ce1c9b6eb3a2207fc9362d89dd02f7e686de1` |

Calibration bins and consistency checks (accuracy vs. confusion matrix, calibration coverage vs. test rows) are reported by `npm run model:evaluate`. Synthetic metrics do not prove real-world lending performance.

## Fairness audit
Synthetic audit groups are generated for diagnostic evaluation only and are not fed into the model. Fairness diagnostics are computed from actual test-split predictions grouped by `synthetic_audit_group` and persisted in the generated `src/lib/scoring/evaluation-snapshot.ts`; the UI renders that snapshot rather than any static numbers. Per group the snapshot reports sample size, selection rate, true-positive rate, false-positive rate, average score, and missing-data rate.

## Limitations
- Synthetic data cannot validate real predictive performance.
- Client-side role checks are not production security.
- No real banking, wallet, utility, telecom, or credit-bureau integrations exist.
- No legal, privacy, or regulatory compliance claim is made.
- Model weights and synthetic labels are demonstration artifacts.

## Data leakage safeguards
The final score is not included in the learned model feature matrix. Audit groups are separated from model features. Normalization statistics are fit on training data only.

## Human-review requirement
CredAI provides decision-support signals. A qualified human reviewer must make the final lending decision.

## Production work still required
Production authentication, secure backend persistence, consent records, encryption, privacy review, security review, credit-law review, independent model validation, monitoring, audit retention policy, and user support procedures are required before any real deployment.
