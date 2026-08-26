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
The training script generates deterministic synthetic rows, performs a deterministic train/test split, fits normalization on the training set only, trains a small logistic regression model, and writes a versioned artifact for browser inference.

## Metrics
Evaluation reports accuracy, precision, recall, F1, ROC-AUC, Brier score, confusion matrix, calibration bins, train/test sizes, model version, seed, and positive-label rate. Synthetic metrics do not prove real-world lending performance.

## Fairness audit
Synthetic audit groups are generated for diagnostic evaluation only and are not fed into the model. The fairness page and evaluation script report group sample size, selection rate, true-positive rate, false-positive rate, average score, and missing-data rate.

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
