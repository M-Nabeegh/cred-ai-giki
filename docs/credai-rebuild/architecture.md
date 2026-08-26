# CredAI Architecture

## Application shape
CredAI remains a self-contained Next.js App Router prototype. The rebuild introduces clear boundaries between public marketing pages, customer workspace, bank workspace, admin workspace, synthetic data, scoring, permissions, and demo scripts.

## Proposed module layout
- `src/app/` — route entry points and compatibility redirects.
- `src/components/portal/` — reusable portal shell, cards, badges, tables, charts, score visuals, and route views.
- `src/lib/credai-data.ts` — deterministic synthetic profiles, applications, organizations, audit events, source status, and model metadata.
- `src/lib/permissions.ts` — central role and permission map.
- `src/lib/scoring/` — feature metadata, baseline model, logistic artifact inference, explanations, model registry, and shared types.
- `scripts/` — deterministic data generation, model training, and evaluation scripts.
- `docs/credai-rebuild/` — product, data, model, compliance, QA, and discovery documentation.

## Client and server boundaries
Most demo interactions run in client components because the current app has no real backend. Synthetic seed data and scoring logic are pure TypeScript modules and can run safely on either side. Browser-only role selection and demo-session behavior are isolated to UI components and do not store secrets.

## Authorization model
A central permission map defines capabilities for `customer`, `bank_analyst`, `bank_manager`, and `admin`. UI route components call shared permission helpers. Because this is a frontend-only prototype, these checks demonstrate policy logic but are not production security controls.

## Data model
Synthetic data is deterministic from seed `credai-demo-v1`. Customer profiles include fake names, masked identifiers, role associations, 12-month observations, simulated data-source status, feature snapshots, demo scores, loan applications, decisions, model versions, and audit events.

## Scoring architecture
The transparent baseline model uses versioned category weights. Features are normalized and direction-aware. The learned model is a small logistic regression artifact trained only on synthetic labels for simulated repayment success. If no learned artifact is available, the UI identifies the baseline model as active.

## Deployment
The app continues to use the existing Vercel/Next.js deployment setup. No external database, credential file, or real integration is introduced.

## Compatibility
Legacy routes remain useful:
- `/dashboard` redirects to `/customer/dashboard`.
- `/loan/apply` redirects to `/customer/loans/apply`.
- `/loan/upload` presents a compatibility upload/demo review path or redirects to customer loans.
- `/admin` serves the admin dashboard and preserves domain middleware behavior.
