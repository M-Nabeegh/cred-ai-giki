# CredAI Rebuild Discovery

## Current architecture
CredAI is a single Next.js 16 App Router application using React 19, TypeScript, Tailwind CSS v4, Radix UI primitives, Framer Motion, Lucide React, and Recharts. The application is currently a frontend-only prototype with seeded in-memory data in `src/lib/db.ts` and client-side session state stored in `localStorage`.

The root layout in `src/app/layout.tsx` applies Geist fonts, global styling, and a shared `Navbar`. Public pages live directly under `src/app`, authentication pages live in the `(auth)` route group, and operational pages currently exist as `/dashboard`, `/loan/*`, and `/admin`.

## Existing routes
- `/` — public marketing homepage.
- `/about` — public about page.
- `/login` — demo login form using mock DB authentication.
- `/register` — demo registration form.
- `/onboarding` — customer profile and simulated data extraction flow.
- `/dashboard` — legacy customer dashboard.
- `/loan/apply` — legacy loan application flow.
- `/loan/upload` — legacy upload flow for larger loans.
- `/admin` — legacy admin loan review page.

## Existing components
- `src/components/ui/button.tsx` — CVA-based button primitive.
- `src/components/ui/card.tsx` — shared card primitives.
- `src/components/ui/dialog.tsx` — Radix dialog wrapper.
- `src/components/ui/input.tsx` — shared input primitive.
- `src/components/layout/Navbar.tsx` — public navigation hidden on dashboard/admin/loan paths.
- `src/components/dashboard/*` — legacy score gauge, insights, financial table, and tips.
- `src/components/onboarding/*` — legacy profile wizard and simulated extraction flow.

## Existing data layer
`src/lib/db.ts` exports a singleton `MockDB` with `User`, `Loan`, `Document`, `Transaction`, and `Activity` types. It seeds a few demo users and loans, uses uncontrolled `Math.random`, stores passwords in memory, calculates a simple score, and exposes async methods with artificial delays. It is useful for legacy compatibility but needs a deterministic synthetic-data layer for the rebuild.

## Existing middleware behavior
`src/middleware.ts` rewrites root requests from `credai-admin.vercel.app` to `/admin`. It excludes API, static assets, Next image routes, and favicon. The rebuild should preserve this domain-based behavior and avoid route loops.

## Existing dependencies
Confirmed from `package.json`:
- Next.js `^16.0.7`
- React `^19.2.1`
- TypeScript `^5`
- Tailwind CSS `^4`
- Radix UI Dialog and Slot
- Framer Motion
- Lucide React
- Recharts
- class-variance-authority, clsx, tailwind-merge

## Existing broken areas
- Authentication and authorization are client-side demo checks only.
- No central permission map exists.
- Legacy mock data uses non-deterministic `Math.random` for generated records.
- Existing score logic is hardcoded and not versioned.
- No model artifact, training script, evaluation script, or fairness diagnostics exist.
- Operational portals are not separated by customer, bank, and admin workspaces.
- Existing wording sometimes implies real AI scoring or instant lending; new copy must emphasize synthetic demo decision support.
- Form handling is minimal and relies on browser alerts in places.

## Existing visual patterns
The app already uses a dark fintech palette, glass cards, blue/emerald accents, rounded components, gradient text, and motion-enhanced buttons. The rebuild will keep the premium dark foundation but move the brand toward deep navy, teal/mint, amber attention states, restrained red risk warnings, clear data-provenance labels, and denser dashboard layouts.

## PDF context reviewed
`docs/Cred_AI proporsal 2.pdf` frames CredAI as a Pakistan-focused alternative credit scoring prototype for financially excluded users, using mock telecom and utility behavior, optional documents for high-value loans, and an admin dashboard for manual review.

`docs/SE Project- Assignment02 2.pdf` documents sprint stories for registration, mock phone verification, profile setup, telco and utility data entry, score generation, score viewing, small-loan handling, larger-loan review, and admin workflows.

## Planned migration strategy
1. Keep legacy routes working through redirects or compatibility pages.
2. Add deterministic synthetic data, typed features, scoring, model registry, and permission modules under `src/lib`.
3. Build shared portal UI primitives for badges, cards, score visualizations, tables, charts, shells, and disclaimers.
4. Add role-specific route groups under `/customer`, `/bank`, and `/admin` while preserving `/dashboard`, `/loan/apply`, `/loan/upload`, and `/admin` compatibility.
5. Rebuild public pages as a polished marketing website with clear prototype disclaimers.
6. Add documentation for product scope, architecture, data dictionary, model card, accounts, compliance notes, and QA.
7. Add deterministic npm scripts for data generation, model training, evaluation, type checking, and tests.
8. Verify with lint, typecheck, build, script outputs, and whitespace checks.

## Files that should remain unchanged where possible
- Existing PDF files under `docs/`.
- Public SVG assets unless a new asset is required.
- `LICENSE`.
- Existing UI primitives unless compatibility changes are required.
- Existing middleware domain rewrite behavior.
