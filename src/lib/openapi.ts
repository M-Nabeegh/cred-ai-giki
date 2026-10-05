import { z } from "zod"
import { customerRecordSchema, loanRequestSchema } from "./core/schema"

export function openApiSpec(serverUrl = "/") {
  const customerRecord = z.toJSONSchema(customerRecordSchema, { io: "input", unrepresentable: "any" })
  const loanRequest = z.toJSONSchema(loanRequestSchema, { io: "input", unrepresentable: "any" })
  const json = (schema: object) => ({ content: { "application/json": { schema } } })
  return {
    openapi: "3.1.0",
    info: {
      title: "CredAI API",
      version: "2.0.0",
      description: "Score customers from raw alternative data (utility bills, mobile top-ups, wallet and bank transactions, instalments) and evaluate loan applications against an underwriting policy.",
    },
    servers: [{ url: serverUrl }],
    paths: {
      "/api/v1/score": {
        post: {
          summary: "Score raw customer records",
          description: "Stateless. Send a CustomerRecord (or { customer, loan, policy }). Returns score, grade, per-feature points and an optional policy decision.",
          requestBody: { required: true, ...json({ oneOf: [{ $ref: "#/components/schemas/CustomerRecord" }, { type: "object", required: ["customer"], properties: { customer: { $ref: "#/components/schemas/CustomerRecord" }, loan: { $ref: "#/components/schemas/LoanRequest" }, policy: { type: "object", additionalProperties: { type: "number" } } } }] }) },
          responses: { "200": { description: "Score report" }, "422": { description: "Record failed validation; issues listed by path" } },
        },
      },
      "/api/v1/customers": { get: { summary: "List customers from the configured data provider, with scores", responses: { "200": { description: "Customer list" } } } },
      "/api/v1/customers/{id}": {
        get: {
          summary: "Score one customer from the data provider",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "amount", in: "query", schema: { type: "number" }, description: "Loan amount in PKR; adds a policy decision" },
            { name: "tenureMonths", in: "query", schema: { type: "integer" } },
          ],
          responses: { "200": { description: "Score report and optional decision" }, "404": { description: "Unknown customer" } },
        },
      },
      "/api/v1/model": { get: { summary: "Model artifact, metrics and fairness audit", responses: { "200": { description: "Model card" } } } },
      "/api/v1/health": { get: { summary: "Data provider and model health", responses: { "200": { description: "Healthy" }, "503": { description: "Provider unreachable" } } } },
    },
    components: { schemas: { CustomerRecord: customerRecord, LoanRequest: loanRequest } },
  }
}
