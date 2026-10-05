# Audit: v1 prototype → v2

An audit of the v1 codebase (`main` at `86d095f`, October 2026) and what v2 changed in response.

## What v1 did well

- A clean toolchain: Next.js 16, React 19, strict TypeScript, with lint, typecheck and build all passing.
- A trained logistic model with a model card, an evaluation snapshot and fairness diagnostics.
- Consent toggles that masked the corresponding features.
- Honest disclaimers about synthetic data.

## Findings

| # | Area | Finding | Impact |
| --- | --- | --- | --- |
| 1 | Data | **No raw data anywhere.** The generator produced the 20 model *features* directly. The "events" were placeholders with no dates or amounts. | The core claim, "feed it real data and it works", was impossible. No code path existed to turn a bank statement or bill history into features. |
| 2 | Model | **Circular evaluation.** The labels were a formula over the same features the model saw, so the 0.96 AUC measured how well logistic regression recovers its own formula. | The headline metric was not meaningful. |
| 3 | Architecture | **No backend or API.** All state and logic ran in the browser. | There was nowhere to plug in a data source and no way to score from another system. |
| 4 | Architecture | **Duplicated ML code.** Feature lists and training lived in both `scripts/*.mjs` and `browser-pipeline.ts`. | Two implementations could drift; train/serve skew was possible by construction. |
| 5 | Deployment | **Stale live link.** `cred-ai-giki.vercel.app` pointed at a disconnected Vercel project still serving the pre-redesign site. The repo actually deployed to other projects. | Anyone following the README saw the old app. |
| 6 | UI | **About 40 near-identical panel pages.** Each component was a single 2–5 KB line of JSX. Recharts and Framer Motion were installed but unused on live pages. | Hard to maintain, and it read as a template rather than a product. |
| 7 | UI | **Disclaimer overload.** Nearly every sentence said "demo", "synthetic" or "simulated". All-caps tracking eyebrows and gradient washes everywhere. | Undermined credibility; the product story got lost. |
| 8 | Code health | **Dead code:** `lib/db.ts` (444 lines), `components/dashboard/*`, `components/onboarding/*`, a `Navbar` returning `null`, and legacy host-rewrite middleware. | Noise for reviewers. |
| 9 | Explainability | Reason codes were generic templates ("This supports the synthetic repayment-success estimate"), and per-feature points didn't add up to the score. | Explanations couldn't be checked or trusted. |
| 10 | Product | No affordability check, no underwriting policy, no score history, and no link between a customer's application and the lender queue. | The lender workflow was a status toggle, not underwriting. |

## What v2 changed

| Finding | Change |
| --- | --- |
| 1, 3 | A Zod-validated **raw-data contract** (`CustomerRecord`) and a `DataProvider` interface with **synthetic** and **HTTP** implementations, selected by `CREDAI_DATA_PROVIDER`. A REST API (`/api/v1/*`) with an OpenAPI 3.1 spec. A mock partner API shows the HTTP path working end to end. |
| 2 | An **agent-style simulator**. Hidden traits drive raw transactions, and outcomes are drawn from the traits rather than the features. Held-out AUC is now around 0.78: lower, but real. Grade default rates rise monotonically from A to E. |
| 4 | **One TypeScript feature engine** (`src/lib/core/features.ts`) used by training (`tsx scripts/train.ts`), the API and the browser. The `.mjs` scripts are gone. |
| 5 | Documented in the README; a fresh deploy from `main` replaces the stale project. |
| 6, 7 | A rebuilt UI: three workspaces (customer, lender, platform) with a shared design system, a real dark mode, and validated colourblind-safe chart colours. One clear disclaimer instead of dozens. |
| 8 | Dead code removed. |
| 9 | **Additive scorecard.** Points use PDO scaling, `points = factor × weight × z`, and sum exactly to the score (enforced by a test). Each reason is a fact from the customer's own data. Sign constraints stop any weight from contradicting its business direction. |
| 10 | A policy engine (score bands, verified-income DTI, coverage, two-tier instant limit). A live policy editor with approval-rate vs default-rate trade-offs. Score history recomputed at each month-end. Customer applications flow into the lender queue, and every action lands in the audit log. |

## Verification

- `npm run check`: lint (0 warnings), typecheck, 18 tests (feature maths, consent masking, scorecard additivity, policy tiers, HTTP provider auth, validation and failure handling).
- `npm run build`: production build passes.
- End-to-end in a browser: the customer turns a source off, the score and offer recompute, the customer applies, the analyst decides, the policy is edited and the queue updates, and the audit log records all of it. No console errors.
- HTTP provider against `npm run mock:api`: 40 customers validated and served through every page. A wrong API key returns a degraded health status (503) with the upstream reason, and workspace pages show an error boundary instead of crashing.

## Still open

Demo seats instead of real authentication. Decisions and the audit log live in browser storage. Model metrics come from simulated behaviour. These are listed in the README under "Not production yet".
