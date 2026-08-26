# CredAI Compliance Notes

## Prototype status
CredAI is a synthetic-data prototype. It does not provide a real credit score, financial advice, loan approval, credit decision, or regulated financial service.

## Synthetic-data limitation
All profiles, events, scores, model outputs, loan applications, decisions, and audit events are generated for demonstration. No real telecom, wallet, utility, bank, identity, or credit-bureau data is collected.

## Human-review requirement
Bank-facing screens must state that CredAI provides decision-support signals and that a qualified human reviewer must make the final lending decision.

## Privacy review still required
A production version would need lawful basis, consent design, data minimization, retention, deletion workflows, subject-access processes, and third-party data-sharing review.

## Security review still required
A production version would need secure authentication, authorization, encryption, secrets management, audit retention, rate limiting, logging controls, penetration testing, and incident response procedures.

## Credit-law review still required
A production version would need jurisdiction-specific review for credit reporting, adverse-action notices, explainability duties, dispute handling, and lending regulations.

## Production authentication still required
The current role selector and local demo session demonstrate flows only. They are not secure access controls.

## Production data governance still required
A production version would need data ownership, lineage, quality monitoring, access approvals, vendor assessments, and deletion guarantees.

## Model validation still required
The synthetic model cannot establish real-world predictive accuracy or fairness. Production use would require representative data, independent validation, drift monitoring, adverse-impact analysis, and governance approvals.

## Protected attributes
The prototype excludes protected attributes and obvious proxies from the model feature matrix. Synthetic audit groups, if shown, are used only for diagnostics and are not model inputs.
