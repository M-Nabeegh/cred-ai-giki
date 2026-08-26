# CredAI

CredAI is an interactive fintech prototype for transparent alternative credit intelligence in Pakistan. It demonstrates how synthetic utility, telecom, wallet, cash-flow, and repayment behavior can be transformed into explainable decision-support signals for customers, banks, and platform administrators.

[![Live demo](https://img.shields.io/badge/Live_Demo-Open-22c55e?style=for-the-badge)](https://cred-ai-giki.vercel.app/)

> Prototype status: CredAI is not production lending software. It uses synthetic data and demo authentication only. It does not provide a real credit score, financial advice, loan approval, or credit decision. Do not enter real CNICs, financial records, passwords, OTPs, tokens, or private account information.

## Product surfaces

- Public website: `/`, `/how-it-works`, `/for-customers`, `/for-banks`, `/security`, `/about`, `/contact`
- Demo auth: `/login`, `/register`
- Customer portal: `/customer/dashboard`, `/customer/score`, `/customer/data`, `/customer/data-sources`, `/customer/loans`, `/customer/loans/apply`, `/customer/activity`, `/customer/settings`, `/customer/help`
- Bank portal: `/bank/dashboard`, `/bank/applications`, `/bank/applications/[id]`, `/bank/applicants`, `/bank/applicants/[id]`, `/bank/portfolio`, `/bank/decisioning`, `/bank/model`, `/bank/audit`, `/bank/settings`
- Admin portal: `/admin`, `/admin/dashboard`, `/admin/users`, `/admin/organizations`, `/admin/data-sources`, `/admin/synthetic-data`, `/admin/models`, `/admin/models/[id]`, `/admin/training`, `/admin/fairness`, `/admin/audit`, `/admin/settings`

Legacy routes `/dashboard`, `/loan/apply`, `/loan/upload`, and `/onboarding` remain compatible through redirects or updated demo screens.

## Demo accounts

| Role | Login | Password | Landing route |
| --- | --- | --- | --- |
| Customer | `customer` | `demo1234` | `/customer/dashboard` |
| Bank analyst | `analyst` | `demo1234` | `/bank/dashboard` |
| Bank manager | `manager` | `demo1234` | `/bank/dashboard` |
| Admin | `admin` | `123456` | `/admin/dashboard` |

See `docs/credai-rebuild/demo-accounts.md` for the full list, including legacy demo accounts.

## Architecture

```mermaid
flowchart LR
    Public[Public marketing site] --> Login[Demo role login]
    Login --> Customer[Customer portal]
    Login --> Bank[Bank portal]
    Login --> Admin[Admin portal]
    Data[Synthetic data generator] --> Features[Typed feature engineering]
    Features --> Baseline[Transparent baseline score]
    Features --> Logistic[Small logistic model artifact]
    Baseline --> Explain[Reason codes and score explanations]
    Logistic --> Explain
    Explain --> Customer
    Explain --> Bank
    Admin --> Data
```

Key files:

- `src/lib/credai-data.ts` — deterministic synthetic profiles, source-to-feature consent mapping, applications, audit events, dataset summary, and formatting helpers. Fairness diagnostics and dataset summary are sourced from the generated evaluation snapshot, not static literals.
- `src/lib/demo-store.ts` — browser-local typed demo workflow state for consent toggles, loan submissions, review decisions, model publish/rollback, browser training records, and audit events. Includes JSON/CSV export helpers.
- `src/lib/permissions.ts` — central role and permission map for customer, bank analyst, bank manager, and admin roles.
- `src/lib/scoring/` — feature definitions, baseline score, logistic inference, explanations, model registry, checked-in trained artifact, a generated evaluation snapshot, and a browser-side pipeline port (`browser-pipeline.ts`) used by admin generate/train/evaluate panels.
- `src/components/portal/` — public marketing pages, portal shells, score cards, dashboard panels, application tables, and admin views.
- `scripts/` — reproducible synthetic-data, model-training, model-evaluation, and deterministic test commands.
- `docs/credai-rebuild/` — discovery, product, architecture, data dictionary, model card, demo accounts, compliance notes, and QA checklist.

## Scoring model

CredAI includes two scoring paths:

1. Transparent baseline scorecard using these category weights:
   - Repayment behavior: 30%
   - Utility payment consistency: 15%
   - Wallet cash-flow stability: 20%
   - Telecom continuity: 10%
   - General financial stability: 15%
   - Account tenure: 5%
   - Data completeness: 5%
2. Small logistic regression artifact (`logistic-demo-v1.1.0`) for `simulated_repayment_success`, trained only on synthetic features and mapped to the 300–850 demo score range. `npm run data:generate` writes a deterministic 2000-profile dataset (seed `credai-demo-v1`), `npm run model:train` performs an 80/20 digest-ordered split, fits normalization on the training rows only, runs full-batch gradient descent, and writes `data/generated/logistic-demo-v1.1.0.json` plus refreshed `src/lib/scoring/model-artifact.ts` and `src/lib/scoring/evaluation-snapshot.ts`. The checked-in artifact reports test accuracy 0.885, ROC-AUC 0.9612, and Brier 0.0742 over 400 held-out rows; see `docs/credai-rebuild/model-card.md` for full numbers and the artifact digest.

Disconnected demo sources null their mapped features, reduce coverage, and emit missing-data warnings through logistic imputation. Demo workspaces require an explicit local demo login; they no longer assign a default role when local storage is empty.

The model excludes protected attributes and obvious proxies. Synthetic audit groups are used only for fairness diagnostics, not as model inputs.

## Local commands

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run data:generate
npm run model:train
npm run model:evaluate
npm run build
```

## Verification notes

All checks were run with Node.js v22 (nvm) and pass: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run data:generate`, `npm run model:train`, `npm run model:evaluate`, and `npm run build`. Note that `npm run test` regenerates a smaller 200-row dataset and retrains; run `data:generate`, `model:train`, and `model:evaluate` afterwards to restore the full 2000-row state. The full dataset JSON is git-ignored because it is regenerable from the seed; the features CSV and the trained model artifact are committed. Browser workflow actions persist only in localStorage and are resettable from the customer/admin settings views.

## Production work still required

Before real use, replace demo authentication with production authentication, move data access to a secure backend, implement encrypted persistence, perform privacy/security/credit-law reviews, validate models on representative real-world data, define governance and monitoring, and complete accessibility and usability testing with target users.

## License

MIT. See `LICENSE`.
