import { Code } from "@/components/code"
import { sourceIcons } from "@/components/credit"
import { HealthCheck } from "@/components/platform/health-check"
import { PageHeader } from "@/components/shell/app-shell"
import { Badge, ButtonLink, Card, CardHeader } from "@/components/ui"
import { FEATURES } from "@/lib/core/features"
import { SOURCE_KEYS, sourceMeta } from "@/lib/core/schema"
import { getProvider } from "@/lib/data/provider"
import { artifact } from "@/lib/model"

export const metadata = { title: "Data sources" }

const contract: Record<(typeof SOURCE_KEYS)[number], string> = {
  utility: "bills[]: issuedAt, dueDate, paidAt | null, amount, kind, provider",
  telecom: "accountOpenedAt, payments[]: date, amount, kind, status",
  wallet: "transactions[]: date, amount, direction, status, balanceAfter",
  bank: "transactions[]: date, amount, direction, category, balanceAfter",
  credit: "installments[]: dueDate, paidAt | null, amount",
}

export default function DataSourcesPage() {
  const provider = getProvider()
  return (
    <>
      <PageHeader title="Data sources" description="CredAI scores whatever implements the data contract. Today that's the built-in generator; pointing it at a real API is configuration, not code." actions={<ButtonLink href="/developers" variant="secondary">API reference</ButtonLink>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[15px] font-semibold">Active provider</div>
            <Badge tone={provider.kind === "http" ? "info" : "neutral"}>{provider.kind === "http" ? "HTTP" : "Synthetic"}</Badge>
          </div>
          <HealthCheck />
        </Card>
        <Card className="p-5">
          <div className="text-[15px] font-semibold">Switch to real data</div>
          <ol className="mt-3 space-y-1 text-[13px] text-ink-2">
            <li>1. Expose <code className="rounded bg-surface-2 px-1 font-mono">GET /customers</code>, <code className="rounded bg-surface-2 px-1 font-mono">GET /customers/:id</code> and optionally <code className="rounded bg-surface-2 px-1 font-mono">GET /applications</code> returning the contract below.</li>
            <li>2. Set three environment variables and redeploy.</li>
          </ol>
          <Code className="mt-3" title=".env.local">{`CREDAI_DATA_PROVIDER=http
CREDAI_DATA_API_URL=https://data.your-bank.example/v1
CREDAI_DATA_API_KEY=••••••••   # sent as a Bearer token`}</Code>
          <p className="mt-3 text-[13px] text-ink-3">Try it locally: <code className="font-mono">npm run mock:api</code> starts a partner API with a different population on port 4010.</p>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Data contract" description="Validated with a Zod schema on every record. Invalid records are rejected and counted, never coerced." />
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {SOURCE_KEYS.map((key) => {
            const Icon = sourceIcons[key]
            return (
              <li key={key} className="grid gap-1 px-5 py-3 sm:grid-cols-[200px_1fr_200px] sm:items-center">
                <div className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-ink-3" />{sourceMeta[key].label}</div>
                <code className="font-mono text-[12.5px] text-ink-2">{key}.{contract[key]}</code>
                <div className="text-[13px] text-ink-3 sm:text-right">{sourceMeta[key].examples}</div>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Feature catalogue" description={`${FEATURES.length} features engineered from the contract over a trailing 12-month window. The same code runs in training and in production.`} />
        <div className="mt-3 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-[13px] text-ink-3"><tr><th className="px-5 py-2 font-medium">Feature</th><th className="px-3 py-2 font-medium">Source</th><th className="px-3 py-2 font-medium">Definition</th><th className="px-5 py-2 text-right font-medium">Weight</th></tr></thead>
            <tbody className="divide-y divide-line">
              {FEATURES.map((feature) => (
                <tr key={feature.key}>
                  <td className="px-5 py-2.5"><div className="font-medium">{feature.label}</div><code className="font-mono text-xs text-ink-3">{feature.key}</code></td>
                  <td className="px-3 py-2.5 text-ink-2">{feature.source === "profile" ? "Derived" : sourceMeta[feature.source].label}</td>
                  <td className="px-3 py-2.5 text-[13px] text-ink-2">{feature.description}</td>
                  <td className={`px-5 py-2.5 text-right font-medium tnum ${artifact.coefficients[feature.key] < 0 ? "text-bad-ink" : ""}`}>{artifact.coefficients[feature.key] > 0 ? "+" : ""}{artifact.coefficients[feature.key].toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
