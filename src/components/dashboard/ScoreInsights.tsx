import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import { type User } from "@/lib/db"

export function ScoreInsights({ user }: { user: User | null }) {
    if (!user) return null

    const insights = [
        {
            factor: "Utility Bill Payments",
            impact: user.utilityHistory?.latePayments === 0 ? "Positive" : "Negative",
            change: user.utilityHistory?.latePayments === 0 ? "+50" : `-${(user.utilityHistory?.latePayments || 0) * 20}`,
            description: user.utilityHistory?.latePayments === 0
                ? "Excellent! No late utility payments recorded."
                : `${user.utilityHistory?.latePayments} late payments detected.`,
            icon: user.utilityHistory?.latePayments === 0 ? ArrowUp : ArrowDown,
            color: user.utilityHistory?.latePayments === 0 ? "text-emerald-500" : "text-red-500",
        },
        {
            factor: "Telco Usage",
            impact: "Positive",
            change: "+30",
            description: `Consistent high usage history (${user.telcoHistory?.tenureYears} years).`,
            icon: ArrowUp,
            color: "text-emerald-500",
        },
        {
            factor: "Income Stability",
            impact: "Positive",
            change: user.income > 50000 ? "+50" : "+20",
            description: "Verifiable monthly income source linked.",
            icon: ArrowUp,
            color: "text-emerald-500",
        },
    ]

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
