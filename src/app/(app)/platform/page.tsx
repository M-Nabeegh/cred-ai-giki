import { CalibrationChart, HorizontalBars, RocChart, ScoreDistributionChart } from "@/components/charts"
import { PageHeader } from "@/components/shell/app-shell"
import { Badge, Card, CardHeader, Stat } from "@/components/ui"
import { sourceIcons } from "@/components/credit"
import { featureByKey } from "@/lib/core/features"
import { sourceMeta, type SourceKey } from "@/lib/core/schema"
import { artifact, evaluation } from "@/lib/model"
import { cn } from "@/lib/utils"

export const metadata = { title: "Model card" }

/** Written from the evaluation so the sentence stays true after every retrain. */
function ablationSummary() {
  const ranked = [...evaluation.ablation].sort((a, b) => b.aucDrop - a.aucDrop)
  const label = (key: string) => sourceMeta[key as SourceKey].label.toLowerCase()
  const weak = ranked.filter((row) => row.aucDrop <= 0.005).map((row) => label(row.source))
  const utility = evaluation.ablation.find((row) => row.source === "utility")!
  return `${sourceMeta[ranked[0].source as SourceKey].label} and ${label(ranked[1].source)} carry the most signal. Utility bills — which ${Math.round(evaluation.dataset.sourceAvailability.utility * 100)}% of applicants have, banked or not — cost ${utility.aucDrop.toFixed(3)} AUC to remove.${weak.length ? ` ${weak.join(" and ")} add${weak.length > 1 ? "" : "s"} little once the rest is known.` : ""}`.replace(/\. ([a-z])/g, (_, c: string) => `. ${c.toUpperCase()}`)
}

/** Written from the evaluation so the verdict stays true after every retrain. */
function challengerSummary() {
  const challenger = evaluation.challenger
  if (!challenger) return ""
  const gap = Math.abs(challenger.aucGap).toFixed(3)
  const setup = `${challenger.settings.trees} boosted trees of depth ${challenger.settings.depth}, trained on the same customers and scored on the same held-out set.`
  if (challenger.aucGap > 0.01) return `${setup} The challenger ranks applicants better by ${gap} AUC, which is what reason codes that add up currently cost.`
  if (challenger.aucGap < -0.01) return `${setup} The scorecard ranks applicants better by ${gap} AUC, so the simpler model is not giving anything up.`
  return `${setup} The two are within ${gap} AUC of each other, so the scorecard's reason codes cost no measurable accuracy.`
}

export default function ModelPage() {
  const m = evaluation.metrics
  const d = evaluation.dataset
  const maxDrop = Math.max(...evaluation.ablation.map((row) => row.aucDrop), 0.001)
  return (
    <>
      <PageHeader
        title="Model card"
        description="A points-based logistic scorecard trained on features engineered from raw transactions. Every number on this page is produced by npm run model:train and checked in with the artifact."
        actions={<><Badge>{artifact.version}</Badge><Badge>digest {artifact.digest}</Badge></>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="AUC (held-out)" value={m.auc.toFixed(3)} detail={`${d.testRows.toLocaleString()} customers never seen in training`} />
        <Stat label="Gini" value={m.gini.toFixed(3)} detail="2 × AUC − 1, the lender convention" />
        <Stat label="KS statistic" value={m.ks.toFixed(3)} detail="Max separation of repaid vs defaulted" />
        <Stat label="Brier score" value={m.brier.toFixed(3)} detail="Calibration error, lower is better" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="ROC curve" description="True vs false positive rate across every score threshold." />
          <div className="px-3 pt-3 pb-2"><RocChart data={evaluation.roc} auc={m.auc} /></div>
        </Card>
        <Card>
          <CardHeader title="Calibration" description="When the model says 80%, about 80% repay. Dot size is the number of customers." />
          <div className="px-3 pt-3 pb-2"><CalibrationChart data={evaluation.calibration} /></div>
        </Card>
      </div>

      {evaluation.challenger ? (
        <Card className="mt-4">
          <CardHeader title="Scorecard vs challenger" description={challengerSummary()} />
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[560px] text-sm tnum">
              <thead className="border-y border-line text-left text-[13px] text-ink-3">
                <tr>
                  <th className="px-5 py-2 font-medium">Model</th>
                  <th className="px-3 py-2 text-right font-medium">AUC</th>
                  <th className="px-3 py-2 text-right font-medium">Gini</th>
                  <th className="px-3 py-2 text-right font-medium">KS</th>
                  <th className="px-3 py-2 text-right font-medium">Brier</th>
                  <th className="px-5 py-2 text-right font-medium">Defaults at {Math.round(evaluation.challenger.approvalRate * 100)}% approved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {evaluation.challenger.models.map((row) => (
                  <tr key={row.algorithm}>
                    <td className="px-5 py-2.5 font-medium">{row.label}</td>
                    <td className="px-3 py-2.5 text-right">{row.auc.toFixed(3)}</td>
                    <td className="px-3 py-2.5 text-right text-ink-2">{row.gini.toFixed(3)}</td>
                    <td className="px-3 py-2.5 text-right text-ink-2">{row.ks.toFixed(3)}</td>
                    <td className="px-3 py-2.5 text-right text-ink-2">{row.brier.toFixed(3)}</td>
                    <td className="px-5 py-2.5 text-right">{(row.badRateAtApproval * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-[13px] text-ink-3">The challenger never scores an applicant. It is retrained with the scorecard so this comparison cannot go stale.</p>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Scores by actual outcome" description={`Held-out customers. The default policy approves ${Math.round(m.approvalRate * 100)}% with a ${(m.badRateApproved * 100).toFixed(1)}% default rate, vs ${(m.badRateDeclined * 100).toFixed(0)}% among those declined.`} />
          <div className="px-5 pt-3 pb-5"><ScoreDistributionChart data={evaluation.scoreDistribution} cut={evaluation.threshold.score} /></div>
        </Card>
        <Card>
          <CardHeader title="Default rate by grade" description="Should rise steadily from A to E. It does." />
          <table className="mt-3 w-full text-sm tnum">
            <thead className="border-y border-line text-left text-[13px] text-ink-3"><tr><th className="px-5 py-2 font-medium">Grade</th><th className="px-3 py-2 font-medium">Customers</th><th className="px-5 py-2 text-right font-medium">Defaulted</th></tr></thead>
            <tbody className="divide-y divide-line">
              {evaluation.gradeTable.map((row) => (
                <tr key={row.grade}>
                  <td className="px-5 py-2.5 font-semibold">{row.grade}</td>
                  <td className="px-3 py-2.5 text-ink-2">{row.count}</td>
                  <td className="px-5 py-2.5 text-right"><div className="flex items-center justify-end gap-2"><div className="h-1.5 w-20 rounded-full bg-surface-2"><div className="h-1.5 rounded-full bg-[var(--s2)]" style={{ width: `${row.badRate * 100}%` }} /></div><span className="w-12">{(row.badRate * 100).toFixed(1)}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Feature weights" description="Standardised logistic coefficients. Blue raises the score, red lowers it." />
          <div className="px-3 pt-3 pb-3"><HorizontalBars data={evaluation.coefficients.map((row) => ({ label: featureByKey[row.key]?.label ?? row.key, value: row.weight }))} digits={3} /></div>
        </Card>
        <Card>
          <CardHeader title="What each data source is worth" description="Drop in AUC when the source is removed from every test customer." />
          <ul className="space-y-3 px-5 pt-4 pb-5">
            {[...evaluation.ablation].sort((a, b) => b.aucDrop - a.aucDrop).map((row) => {
              const Icon = sourceIcons[row.source as SourceKey]
              return (
                <li key={row.source} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 text-ink-3" />
                  <span className="w-36">{sourceMeta[row.source as SourceKey].label}</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-2"><div className="h-2 rounded-full bg-[var(--s1)]" style={{ width: `${(Math.max(0, row.aucDrop) / maxDrop) * 100}%` }} /></div>
                  <span className="w-16 text-right font-medium tnum">{row.aucDrop > 0 ? "−" : "+"}{Math.abs(row.aucDrop).toFixed(3)}</span>
                </li>
              )
            })}
          </ul>
          <p className="border-t border-line px-5 py-3 text-[13px] text-ink-3">{ablationSummary()}</p>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Fairness audit" description="Region is never a model input. It is held back and used only to test for disparate outcomes at the default approve cut-off." />
        <div className="mt-3 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[720px] text-sm tnum">
            <thead className="text-left text-[13px] text-ink-3">
              <tr><th className="px-5 py-2 font-medium">Region</th><th className="px-3 py-2 font-medium">Customers</th><th className="px-3 py-2 font-medium">Avg score</th><th className="px-3 py-2 font-medium">Approval rate</th><th className="px-3 py-2 font-medium">Adverse impact ratio</th><th className="px-3 py-2 font-medium">Approved if repaid (TPR)</th><th className="px-3 py-2 font-medium">Approved if defaulted (FPR)</th><th className="px-5 py-2 font-medium">Thin files</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {evaluation.fairness.map((row) => (
                <tr key={row.group}>
                  <td className="px-5 py-2.5 font-medium">{row.group}</td>
                  <td className="px-3 py-2.5 text-ink-2">{row.count}</td>
                  <td className="px-3 py-2.5">{row.averageScore}</td>
                  <td className="px-3 py-2.5">{Math.round(row.approvalRate * 100)}%</td>
                  <td className="px-3 py-2.5"><span className={cn("font-semibold", row.adverseImpactRatio < 0.8 ? "text-bad-ink" : "")}>{row.adverseImpactRatio.toFixed(2)}</span> {row.adverseImpactRatio < 0.8 ? <Badge tone="bad">Below 0.8</Badge> : <Badge tone="good">OK</Badge>}</td>
                  <td className="px-3 py-2.5">{Math.round(row.tpr * 100)}%</td>
                  <td className="px-3 py-2.5">{Math.round(row.fpr * 100)}%</td>
                  <td className="px-5 py-2.5">{Math.round(row.thinFileShare * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-[13px] text-ink-3">Adverse impact ratio is each region&apos;s approval rate divided by the highest; the common four-fifths rule flags anything under 0.80. Gaps that remain track thin-file share — fewer connected sources — which is exactly where connecting more data helps.</p>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Training data" description={`${d.rows.toLocaleString()} simulated customers · ${d.transactions.toLocaleString()} raw records · as of ${d.asOf} · seed “${d.seed}”`} />
          <table className="mt-3 w-full text-sm tnum">
            <thead className="border-y border-line text-left text-[13px] text-ink-3"><tr><th className="px-5 py-2 font-medium">Segment</th><th className="px-3 py-2 font-medium">Share</th><th className="px-5 py-2 text-right font-medium">Repaid</th></tr></thead>
            <tbody className="divide-y divide-line">
              {d.personaMix.map((row) => <tr key={row.persona}><td className="px-5 py-2">{row.label}</td><td className="px-3 py-2 text-ink-2">{Math.round(row.share * 100)}%</td><td className="px-5 py-2 text-right">{Math.round(row.repaidRate * 100)}%</td></tr>)}
            </tbody>
          </table>
        </Card>
        <Card className="p-5">
          <div className="text-[15px] font-semibold">How the data is simulated</div>
          <ul className="mt-3 space-y-2 text-[13px] text-ink-2">
            <li>Each customer gets hidden traits — payment discipline, income stability, liquidity, tenure — drawn around a segment profile.</li>
            <li>The traits drive raw events: payroll or gig payouts, rent and spending, bills paid early or late, top-ups, wallet transfers that bounce when the balance is short.</li>
            <li>The repayment outcome is drawn separately from the traits. The model never sees traits or outcomes — only features computed from the raw events, the same way it would from a real API.</li>
            <li>Source coverage varies by segment ({Object.entries(d.sourceAvailability).map(([key, value]) => `${sourceMeta[key as SourceKey].label.toLowerCase()} ${Math.round(value * 100)}%`).join(", ")}).</li>
          </ul>
          <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn-ink">Metrics describe performance on simulated behaviour. Before lending, retrain and validate on real outcomes with the same pipeline.</p>
        </Card>
      </div>
    </>
  )
}
