# CredAI QA Checklist

## Repository and GitHub
- [x] GitHub CLI authentication verified for `github.com`.
- [x] Remote verified as `https://github.com/M-Nabeegh/cred-ai-giki`.
- [x] Repository verified as `M-Nabeegh/cred-ai-giki`.
- [x] Work performed on `feat/credai-portal-redesign`.
- [ ] Checkpoint commits pushed after review gates.

## Static checks
- [x] `npm run lint` — clean, no rules disabled.
- [x] `npm run typecheck` — clean.
- [x] `npm run test` — deterministic data/training/evaluation/missingness/auth/fallback/fairness-snapshot checks pass. Note: the test retrains on a smaller dataset; rerun `data:generate` + `model:train` + `model:evaluate` afterwards to restore the 2000-row state.
- [x] `npm run build` — production build succeeds; middleware listed as active.
- [x] `npm run data:generate` — 2000 rows, 144,000 events, digest recorded in dataset metadata.
- [x] `npm run model:train` — artifact `logistic-demo-v1.1.0`, digest `dd998daa…86de1`, evaluation snapshot written.
- [x] `npm run model:evaluate` — accuracy 0.885, ROC-AUC 0.9612, consistency checks true.
- [x] `git diff --check` — no whitespace errors.

## Functional routes
Verified against the production build (`npm start`): every route below returns HTTP 200, unauthenticated portal routes render the demo-login-required guard, and invalid application/applicant/model IDs render not-found states for authenticated sessions (verified in code and deterministic tests rather than falling back to the first record).

- [x] `/` loads public homepage without authentication.
- [x] `/how-it-works` loads without authentication.
- [x] `/for-customers` loads without authentication.
- [x] `/for-banks` loads without authentication.
- [x] `/security` loads without authentication.
- [x] `/about` loads without authentication.
- [x] `/contact` loads without authentication.
- [x] `/login` supports role-based demo login (no default role when session is empty; logout clears session keys).
- [x] `/register` supports synthetic registration/onboarding entry with validation.
- [x] `/customer/dashboard` shows demo profile and score.
- [x] `/customer/score` shows explanations and confidence.
- [x] `/customer/data` and `/customer/data-sources` show simulated sources, consent toggles, and JSON/CSV export.
- [x] `/customer/loans` and `/customer/loans/apply` show loan status and simulation.
- [x] `/bank/dashboard` shows portfolio/workload overview with derived (not hand-coded) score-band shares.
- [x] `/bank/applications` lists applications; valid and invalid IDs handled distinctly.
- [x] `/bank/applications/[id]` shows applicant and decision-support details.
- [x] `/bank/model` explains model outputs, real artifact metrics, and human-review limits.
- [x] `/admin/dashboard` shows platform overview.
- [x] `/admin/synthetic-data` runs in-browser generation with digest and exports.
- [x] `/admin/models` and `/admin/models/[id]` show registry/model details with local publish/rollback.
- [x] `/admin/fairness` shows snapshot diagnostics with in-browser recomputation.
- [x] `/admin/audit` shows masked audit events.
- [x] Legacy redirects: `/dashboard`, `/loan/apply`, `/loan/upload`, `/admin`, `/bank`, `/customer` all redirect (307) to their portal routes.

## Safety and content checks
- [x] Every operational portal shows Demo Mode or Synthetic Data label.
- [x] Every score shows model version, confidence, and data coverage.
- [x] No page claims a real credit score or real loan approval.
- [x] No fake partnerships, regulatory badges, or customer testimonials appear.
- [x] Bank pages state human review is required.
- [x] Data sources are labeled simulated.
- [x] Identifiers are masked.
- [x] No real secrets or `.env` credentials are introduced.
- [x] Protected attributes are not model features; audit groups are diagnostics only.
- [x] High spending is not treated as automatically positive.
- [x] Low spending is not treated as automatically negative.

## Browser checks
- [ ] Public homepage desktop.
- [ ] Login desktop.
- [ ] Customer dashboard desktop.
- [ ] Customer score page desktop.
- [ ] Bank dashboard desktop.
- [ ] Applicant detail desktop.
- [ ] Admin dashboard desktop.
- [ ] Model page desktop.
- [ ] Mobile viewport at 375px.
- [ ] Tablet viewport at 768px.
