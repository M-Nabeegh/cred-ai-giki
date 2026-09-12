# Project Handover: CredAI (cred-ai-giki)

You are taking over the CredAI project, a fintech prototype for transparent alternative credit
scoring in Pakistan. This document describes the full current state of the repository, what has
been built, how it works, and what remains to be done. Read it fully before making changes.

## 1. Repository & Git State

- Remote: https://github.com/M-Nabeegh/cred-ai-giki (public, default branch `main`)
- Live demo (Vercel auto-deploy from main): https://cred-ai-giki.vercel.app/
- Local branches: `main` (at merge commit `86d095f`) and `feat/credai-portal-redesign`
  (at `b2318e9`, fully merged into main via PR #1). Working tree is clean; nothing unpushed.
- The entire redesign was delivered on `feat/credai-portal-redesign` across these commits:
  1. `95591d4` docs: add CredAI rebuild discovery
  2. `d738bf5` feat: add CredAI data and portal backbone
  3. `b567832` docs: document CredAI portal workflow
  4. `b0e673a` feat: implement deterministic CredAI demo workflows
  5. `db9a631` feat(scoring): train real logistic artifact and persist evaluation snapshot
  6. `4596260` feat(data): source fairness diagnostics and dataset summary from evaluation snapshot
  7. `594b731` feat(demo-store): add publish/rollback, browser training, registration, exports
  8. `3947b0a` feat(portal): functional admin/bank/customer panels and logout
  9. `c974b0f` feat(auth): functional registration with validation and demo session
  10. `e134714` chore(lint): resolve all lint errors and warnings without disabling rules
  11. `316c288` docs: record verified pipeline metrics and complete QA checklist
  12. `b2318e9` chore: ignore regenerable 33MB dataset JSON, keep CSV and artifact
- `.qoder/` and the regenerable full dataset JSON (`data/generated/credai-demo-v1.json`, ~33MB)
  are git-ignored. The features CSV and the trained model artifact ARE committed.

## 2. What the Project Is

CredAI demonstrates how synthetic utility, telecom, wallet, cash-flow, and repayment data can be
turned into explainable credit decision-support signals for three audiences:

- **Customers** — see their demo score, connected data sources, consent toggles, loan applications
- **Banks** — review applications, applicant detail, portfolio, model info, audit trail
- **Platform admins** — manage users, organizations, data sources, synthetic data, model
  training/publish/rollback, fairness diagnostics, audit

It is a **prototype only**: demo auth via localStorage, no real backend, no real credit decisions.
All data is synthetic and deterministic (seed `credai-demo-v1`).

## 3. Tech Stack

- Next.js 16 (App Router), React 19, TypeScript 5 (strict)
- Tailwind CSS 4 (dark fintech theme, teal/mint accents, amber attention states, focus-visible
  and reduced-motion support in `src/app/globals.css`)
- Radix UI primitives + class-variance-authority + clsx + tailwind-merge (`src/components/ui/`)
- framer-motion (animation), lucide-react (icons), recharts (charts)
- Path alias `@/*` → `./src/*`; Node.js 20+ required (verified on Node 22)

## 4. Route Structure (all under `src/app/`)

- Public marketing: `/`, `/how-it-works`, `/for-customers`, `/for-banks`, `/security`, `/about`, `/contact`
- Demo auth: `/login` (role-based demo selector), `/register` (functional validation + demo session)
- Customer portal: `/customer/dashboard`, `/customer/score`, `/customer/data`, `/customer/data-sources`,
  `/customer/loans`, `/customer/loans/apply`, `/customer/activity`, `/customer/settings`, `/customer/help`
- Bank portal: `/bank/dashboard`, `/bank/applications`, `/bank/applications/[id]`, `/bank/applicants`,
  `/bank/applicants/[id]`, `/bank/portfolio`, `/bank/decisioning`, `/bank/model`, `/bank/audit`, `/bank/settings`
- Admin portal: `/admin/dashboard`, `/admin/users`, `/admin/organizations`, `/admin/data-sources`,
  `/admin/synthetic-data`, `/admin/models`, `/admin/models/[id]`, `/admin/training`, `/admin/fairness`,
  `/admin/audit`, `/admin/settings`
- Root portal routes (`/customer`, `/bank`, `/admin`) redirect to their dashboards
- Legacy routes `/dashboard`, `/loan/apply`, `/loan/upload`, `/onboarding` kept compatible via
  redirects or updated demo screens

Most route pages are thin (~3–6 line) wrappers that render reusable views from
`src/components/portal/PortalPages.tsx` inside `src/components/portal/WorkspaceShell.tsx`
(role gating, sidebar nav, "Demo Mode" labels). Public pages render from
`src/components/portal/MarketingPages.tsx`.

## 5. Core Modules

- `src/lib/credai-data.ts` — deterministic synthetic profiles, source-to-feature consent mapping,
  applications, audit events, dataset summary, formatting helpers. Fairness diagnostics and
  dataset summary read from the generated evaluation snapshot, not static literals.
- `src/lib/demo-store.ts` — browser-local (localStorage) typed workflow state: consent toggles,
  loan submissions, review decisions, model publish/rollback, browser training runs, audit events,
  JSON/CSV export helpers. Resettable from customer/admin settings.
- `src/lib/permissions.ts` — central role & permission map (customer, bank analyst, bank manager,
  admin). Demo workspaces require explicit demo login; no default role when localStorage is empty.
- `src/lib/scoring/`:
  - `types.ts` — shared types
  - `features.ts` — typed feature engineering
  - `baseline.ts` — transparent baseline scorecard (weights: repayment 30%, utility 15%,
    wallet cash-flow 20%, telecom 10%, financial stability 15%, tenure 5%, data completeness 5%)
  - `logistic.ts` — logistic inference
  - `model-artifact.ts` — checked-in trained artifact `logistic-demo-v1.1.0` (test accuracy 0.885,
    ROC-AUC 0.9612, Brier 0.0742 on 400 held-out rows; scores mapped to 300–850)
  - `model-registry.ts` — model registry
  - `evaluation-snapshot.ts` — generated evaluation snapshot (metrics + fairness diagnostics)
  - `explanations.ts` — reason codes / score explanations
  - `browser-pipeline.ts` — browser-side port of the generate/train/evaluate pipeline used by
    admin panels
- `src/middleware.ts` — legacy admin domain root rewrites (pre-existing)
- `src/lib/db.ts` — legacy in-memory mock DB (pre-existing, minimally touched)

## 6. ML Scripts (reproducible, deterministic)

- `scripts/credai-ml-utils.mjs` — shared utilities (seeded RNG, feature math, training loop)
- `scripts/generate-synthetic-data.mjs` — `npm run data:generate` writes 2000-profile dataset
  (seed `credai-demo-v1`); full JSON is git-ignored, features CSV committed
- `scripts/train-model.mjs` — `npm run model:train`: 80/20 digest-ordered split, normalization fit
  on training rows only, full-batch gradient descent; writes
  `data/generated/logistic-demo-v1.1.0.json` and regenerates `src/lib/scoring/model-artifact.ts`
  and `src/lib/scoring/evaluation-snapshot.ts`
- `scripts/evaluate-model.mjs` — `npm run model:evaluate`
- `scripts/test.mjs` — `npm run test`: end-to-end deterministic check (regenerates a smaller
  200-row dataset and retrains — afterwards rerun data:generate → model:train → model:evaluate
  to restore the full 2000-row state)

The model excludes protected attributes and obvious proxies; synthetic audit groups are used only
for fairness diagnostics, never as model inputs.

## 7. Demo Accounts

| Role | Login | Password | Landing |
| --- | --- | --- | --- |
| Customer | `customer` | `demo1234` | `/customer/dashboard` |
| Bank analyst | `analyst` | `demo1234` | `/bank/dashboard` |
| Bank manager | `manager` | `demo1234` | `/bank/dashboard` |
| Admin | `admin` | `123456` | `/admin/dashboard` |

Full list incl. legacy accounts: `docs/credai-rebuild/demo-accounts.md`.

## 8. Commands

```bash
npm install
npm run dev          # dev server
npm run lint         # ESLint — currently zero errors AND zero warnings (no rules disabled)
npm run typecheck    # tsc --noEmit — passes
npm run test         # deterministic pipeline test — passes
npm run data:generate
npm run model:train
npm run model:evaluate
npm run build        # production build — passes
```

All of the above were verified green on Node 22 before the final push.

## 9. Documentation (in `docs/credai-rebuild/`)

`discovery.md`, `product-spec.md`, `architecture.md`, `data-dictionary.md`, `model-card.md`,
`demo-accounts.md`, `compliance-notes.md`, `qa-checklist.md` — plus an updated `README.md` at the
repo root documenting architecture, routes, accounts, model, commands, and limitations.

## 10. Conventions to Preserve

- Match the existing dark fintech theme; use the existing `src/components/ui/` primitives
  (button, card, dialog, input) instead of adding new UI libraries
- Keep route pages thin; put real views in `src/components/portal/PortalPages.tsx` or new
  components under `src/components/`
- All client data mutations go through `src/lib/demo-store.ts` (localStorage) — there is no backend
- Keep data flows typed via `src/lib/scoring/types.ts` and `src/lib/credai-data.ts`
- Determinism matters: never introduce randomness without a seed; regenerating data must produce
  identical output
- Client-side errors use native `Error` + `alert()` in mock-DB code paths — this is an intentional
  prototype pattern (see existing knowledge docs), not an oversight
- Never commit `data/generated/credai-demo-v1.json` (33MB, regenerable, git-ignored)
- Prototype disclaimers (no real scores, no real financial data) must stay in the UI and README

## 11. Known Gaps / Production TODO (documented, intentionally deferred)

Replace demo auth with production auth; move data access to a secure backend; encrypted
persistence; privacy/security/credit-law review; validate the model on real representative data;
governance and monitoring; full accessibility & usability testing with target users. Details in
`docs/credai-rebuild/compliance-notes.md` and `docs/credai-rebuild/qa-checklist.md`.

## 12. First Steps for You (Codex)

1. Run `npm install`, then `npm run lint && npm run typecheck && npm run test` to confirm the
   baseline is green before changing anything.
2. Read `README.md`, then `docs/credai-rebuild/architecture.md` and `data-dictionary.md`.
3. Explore `src/components/portal/WorkspaceShell.tsx` → `PortalPages.tsx` to understand how every
   screen renders, then `src/lib/demo-store.ts` for state, then `src/lib/scoring/` for the model.
4. Work on a feature branch off `main` and keep commits small and descriptive, matching the
   existing `type(scope): message` convention.
