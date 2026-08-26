# CredAI Product Specification

## Product purpose
CredAI is a synthetic-data prototype for transparent alternative credit intelligence in Pakistan. It demonstrates how everyday financial behavior signals could support customers, bank reviewers, and administrators without claiming to provide a real credit score, financial advice, loan approval, or production credit decision.

## Primary audiences
- Customers who want to understand a simulated financial profile.
- Bank analysts and managers reviewing synthetic applicants with transparent decision-support signals.
- Administrators managing demo users, synthetic data, model versions, training runs, and audit events.
- Visitors evaluating the product concept through a public website.

## Required user-facing disclaimer
CredAI is a synthetic-data prototype. It does not provide a real credit score, financial advice, loan approval, or credit decision.

## Public website
Routes: `/`, `/how-it-works`, `/for-customers`, `/for-banks`, `/security`, `/about`, `/contact`, `/login`, `/register`.

The website explains alternative credit intelligence, demo-only scope, customer and bank journeys, data-source categories, transparency, consent, privacy limits, and human review requirements.

## Customer portal
Routes: `/customer/dashboard`, `/customer/score`, `/customer/data`, `/customer/data-sources`, `/customer/loans`, `/customer/loans/apply`, `/customer/activity`, `/customer/settings`, `/customer/help`.

Core capabilities include onboarding, consent explanation, simulated source selection, synthetic profile generation, demo score calculation, score explanations, data coverage, loan simulation, activity history, export/reset controls, and clear Demo Mode labeling.

## Bank portal
Routes: `/bank/dashboard`, `/bank/applications`, `/bank/applications/[id]`, `/bank/applicants`, `/bank/applicants/[id]`, `/bank/portfolio`, `/bank/decisioning`, `/bank/model`, `/bank/audit`, `/bank/settings`.

The bank portal provides decision-support only. A qualified human reviewer must make the final lending decision. Suggested outcomes are review categories, not automatic approvals or rejections.

## Admin portal
Routes: `/admin`, `/admin/dashboard`, `/admin/users`, `/admin/organizations`, `/admin/data-sources`, `/admin/synthetic-data`, `/admin/models`, `/admin/models/[id]`, `/admin/training`, `/admin/fairness`, `/admin/audit`, `/admin/settings`.

Admin features include synthetic data configuration, demo-user management, model registry, training/evaluation controls, fairness diagnostics, audit events, and system settings.

## Data sources
All connectors are simulated and clearly labeled:
- Simulated utility data
- Simulated telecom data
- Simulated JazzCash data
- Simulated Easypaisa data
- Simulated bank-cashflow data
- Simulated repayment data

CredAI does not connect to real utility providers, telecoms, wallets, banks, credit bureaus, identity documents, SMS inboxes, contacts, social media, device history, or real payment accounts.

## Scoring principles
The demo score emphasizes payment consistency, repayment behavior, regularity, stability, tenure, and data completeness. It does not treat high spending as positive behavior or low spending as negative behavior. It excludes protected attributes and proxies designed to infer protected characteristics.

## Success criteria
- Clear separation between public, customer, bank, and admin experiences.
- Synthetic-data labels visible across operational portals.
- Model version, confidence, and data coverage displayed with score outputs.
- Transparent feature contributions and reason codes.
- Reproducible synthetic generation and model scripts.
- Human review language in every bank decision surface.
