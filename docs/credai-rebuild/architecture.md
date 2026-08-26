# CredAI Architecture

## Application shape
CredAI remains a self-contained Next.js App Router prototype. The rebuild introduces clear boundaries between public marketing pages, customer workspace, bank workspace, admin workspace, synthetic data, scoring, permissions, and demo scripts.

## Proposed module layout
- `src/app/` — route entry points and compatibility redirects.
- `src/components/portal/` — reusable portal shell, cards, badges, tables, charts, score visuals, and route views.
- `src/lib/credai-data.ts` — deterministic synthetic profiles, applications, organizations, audit events, source status, and model metadata. Fairness diagnostics and dataset summary come from the generated evaluation snapshot.
- `src/lib/demo-store.ts` — typed localStorage-backed demo state (consent, applications, decisions, publish/rollback, browser training records) built on `useSyncExternalStore`.
- `src/lib/permissions.ts` — central role and permission map.
- `src/lib/scoring/` — feature metadata, baseline model, logistic artifact inference, explanations, model registry, the checked-in trained artifact, the generated `evaluation-snapshot.ts`, and `browser-pipeline.ts` (in-browser generate/train/evaluate port used by admin panels).
- `scripts/` — deterministic data generation, model training (also writes the evaluation snapshot), evaluation, and test scripts.
- `data/generated/` — reproducible pipeline outputs. The features CSV and trained model artifact are committed; the full dataset JSON is git-ignored because `npm run data:generate` reproduces it byte-for-byte from seed `credai-demo-v1`.
- `docs/credai-rebuild/` — product, data, model, compliance, QA, and discovery documentation.

## Client and server boundaries
Most demo interactions run in client components because the current app has no real backend. Synthetic seed data and scoring logic are pure TypeScript modules and can run safely on either side. Browser-only role selection and demo-session behavior are isolated to UI components and do not store secrets.

## Authorization model
A central permission map defines capabilities for `customer`, `bank_analyst`, `bank_manager`, and `admin`. UI route components call shared permission helpers. Because this is a frontend-only prototype, these checks demonstrate policy logic but are not production security controls.

## Data model
Synthetic data is deterministic from seed `credai-demo-v1`. Customer profiles include fake names, masked identifiers, role associations, 12-month observations, simulated data-source status, feature snapshots, demo scores, loan applications, decisions, model versions, and audit events.

## Scoring architecture
The transparent baseline model uses versioned category weights. Features are normalized and direction-aware. The learned model is the `logistic-demo-v1.1.0` logistic regression artifact trained on synthetic labels for simulated repayment success; inference loads the checked-in artifact. The training script also writes `src/lib/scoring/evaluation-snapshot.ts` containing fairness diagnostics computed from actual test-split predictions plus dataset provenance (row count, event count, measured missingness, dataset digest), which the UI renders directly. Admin publish/rollback actions switch the active model locally between the trained artifact and the transparent baseline. If no learned artifact is available, the UI identifies the baseline model as active.

## Deployment
The app continues to use the existing Vercel/Next.js deployment setup. No external database, credential file, or real integration is introduced.

## Compatibility
Legacy routes remain useful:
- `/dashboard` redirects to `/customer/dashboard`.
- `/loan/apply` redirects to `/customer/loans/apply`.
- `/loan/upload` presents a compatibility upload/demo review path or redirects to customer loans.
- `/admin` serves the admin dashboard and preserves domain middleware behavior.
