# CredAI Data Dictionary

## SyntheticProfile
- `id` — internal synthetic customer identifier.
- `maskedCustomerId` — user-facing masked identifier.
- `name` — fake demo name.
- `role` — one of `customer`, `bank_analyst`, `bank_manager`, `admin`.
- `city` — Pakistani city used for demo context only.
- `monthlyIncomePkr` — simulated income amount.
- `observationMonths` — number of months in the synthetic observation window.
- `dataCoverage` — percentage of enabled source data available.
- `confidence` — score confidence label derived from coverage and missing data.

## DataSourceStatus
- `source` — simulated source name.
- `label` — visible user-facing label.
- `connected` — whether simulated consent is active.
- `coverage` — observed data coverage for the source.
- `lastSynced` — fixed demo timestamp.
- `contributes` — features created from the source.

## FinancialObservation
- `month` — billing or behavior month.
- `utilityOnTimeRatio` — proportion of utility bills paid on time.
- `telecomContinuity` — regularity of telecom activity.
- `walletInflowRegularity` — stability of wallet inflows.
- `walletOutflowVolatility` — outflow volatility indicator.
- `cashFlowCoverage` — ability of inflows to cover outflows.
- `repaymentRatio` — simulated repayment completion ratio.

## FeatureSnapshot
Each model feature has a typed definition with name, type, description, source, direction, range, missing-data behavior, customer visibility, and model usage flag.

## ScoreResult
- `score` — whole-number demo score from 300 to 850.
- `band` — demo profile band.
- `confidence` — confidence label.
- `modelVersion` — active scoring model version.
- `dataCoverage` — overall coverage percentage.
- `featureContributions` — positive and negative transparent factors.
- `reasonCodes` — human-readable explanation text.
- `missingDataWarnings` — source or feature gaps.

## LoanApplication
- `id` — synthetic application identifier.
- `customerId` — synthetic profile identifier.
- `amountPkr` — requested amount in PKR.
- `tenureMonths` — requested tenure.
- `purpose` — demo loan purpose.
- `status` — submitted, in review, approved for demo, referred, or declined for demo.
- `createdAt` — deterministic demo date.
- `humanReviewRequired` — always true for bank decision surfaces.

## DecisionRecord
- `id` — decision identifier.
- `applicationId` — linked application.
- `reviewerRole` — bank analyst or manager role.
- `decision` — approve for demo, refer for manual review, or decline for demo.
- `reason` — required human-written reason.
- `createdAt` — deterministic demo date.

## AuditEvent
- `id` — audit identifier.
- `actorId` — synthetic actor.
- `organization` — demo organization.
- `role` — actor role.
- `action` — profile generation, score viewed, loan simulation, decision recorded, model training, model evaluation, model published, data reset, or consent revoked.
- `resource` — synthetic resource identifier.
- `modelVersion` — model version where applicable.
- `timestamp` — deterministic demo timestamp.
- `result` — success, warning, or blocked.
