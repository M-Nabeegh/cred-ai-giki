import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

const insights = [
    {
        factor: "Utility Bill Payments",
        impact: "Positive",
        change: "+20",
        description: "Consistent on-time payments for electricity.",
        icon: ArrowUp,
        color: "text-emerald-500",
    },
    {
        factor: "Mobile Top-up Frequency",
        impact: "Neutral",
        change: "0",
        description: "Regular top-ups observed.",
        icon: Minus,
        color: "text-gray-400",
    },
    {
        factor: "Loan Repayment History",
        impact: "Negative",
        change: "-10",
        description: "Late payment on previous micro-loan.",
        icon: ArrowDown,
        color: "text-red-500",
    },
]

export function ScoreInsights() {
    return (
        <Card className="glass-card border-white/10 h-full">
            <CardHeader>
                <CardTitle>Score Insights</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {insights.map((item, index) => (
                        <div key={index} className="flex items-start space-x-4">
                            <div className={`p-2 rounded-full bg-white/5 ${item.color}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-white">{item.factor}</h4>
                                    <span className={`text-sm font-bold ${item.color}`}>{item.change}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
