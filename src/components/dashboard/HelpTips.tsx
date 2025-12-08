import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

export function HelpTips() {
    return (
        <Card className="glass-card border-white/10 mt-8">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <CardTitle>How to Improve Your Score</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <h4 className="font-bold text-emerald-400 mb-2">Pay Bills on Time</h4>
                        <p className="text-sm text-gray-400">Utility bill payments account for 30% of your score. Ensure you pay electricity and gas bills before the due date.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <h4 className="font-bold text-blue-400 mb-2">Consistent Top-ups</h4>
                        <p className="text-sm text-gray-400">Regular mobile top-ups show financial stability. Avoid long periods of inactivity on your SIM.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <h4 className="font-bold text-purple-400 mb-2">Profile Completeness</h4>
                        <p className="text-sm text-gray-400">Providing accurate income and household details helps us assess your repayment capacity better.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
