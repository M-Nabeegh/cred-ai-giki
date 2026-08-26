# CredAI QA Checklist

## Repository and GitHub
- [x] GitHub CLI authentication verified for `github.com`.
- [x] Remote verified as `https://github.com/M-Nabeegh/cred-ai-giki`.
- [x] Repository verified as `M-Nabeegh/cred-ai-giki`.
- [x] Work performed on `feat/credai-portal-redesign`.
- [ ] Checkpoint commits pushed after review gates.

## Static checks
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run data:generate`
- [ ] `npm run model:train`
- [ ] `npm run model:evaluate`
- [ ] `git diff --check`

## Functional routes
- [ ] `/` loads public homepage without authentication.
- [ ] `/how-it-works` loads without authentication.
- [ ] `/for-customers` loads without authentication.
- [ ] `/for-banks` loads without authentication.
- [ ] `/security` loads without authentication.
- [ ] `/about` loads without authentication.
- [ ] `/contact` loads without authentication.
- [ ] `/login` supports role-based demo login.
- [ ] `/register` supports synthetic registration/onboarding entry.
- [ ] `/customer/dashboard` shows demo profile and score.
- [ ] `/customer/score` shows explanations and confidence.
- [ ] `/customer/data` and `/customer/data-sources` show simulated sources and controls.
- [ ] `/customer/loans` and `/customer/loans/apply` show loan status and simulation.
- [ ] `/bank/dashboard` shows portfolio/workload overview.
- [ ] `/bank/applications` lists applications.
- [ ] `/bank/applications/[id]` shows applicant and decision-support details.
- [ ] `/bank/model` explains model outputs and human-review limits.
- [ ] `/admin/dashboard` shows platform overview.
- [ ] `/admin/synthetic-data` shows generator controls and preview.
- [ ] `/admin/models` and `/admin/models/[id]` show registry/model details.
- [ ] `/admin/fairness` shows synthetic diagnostics.
- [ ] `/admin/audit` shows masked audit events.

## Safety and content checks
- [ ] Every operational portal shows Demo Mode or Synthetic Data label.
- [ ] Every score shows model version, confidence, and data coverage.
- [ ] No page claims a real credit score or real loan approval.
- [ ] No fake partnerships, regulatory badges, or customer testimonials appear.
- [ ] Bank pages state human review is required.
- [ ] Data sources are labeled simulated.
- [ ] Identifiers are masked.
- [ ] No real secrets or `.env` credentials are introduced.
- [ ] Protected attributes are not model features.
- [ ] High spending is not treated as automatically positive.
- [ ] Low spending is not treated as automatically negative.

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
