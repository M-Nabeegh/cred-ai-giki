"use client"

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CreditScoreGaugeProps {
    score: number
}

export function CreditScoreGauge({ score }: CreditScoreGaugeProps) {
    // Score range 0-850. We normalize it for the chart (0-100 or similar)
    // But standard credit score is usually 300-850. Proposal says 0-850.
    const percentage = (score / 850) * 100

    const data = [
        {
            name: "Score",
            value: percentage,
            fill: "#3B82F6", // Brand color
        },
    ]

    let status = "Poor"
    let color = "text-red-500"
    if (score >= 700) {
        status = "Excellent"
        color = "text-emerald-500"
    } else if (score >= 600) {
        status = "Good"
        color = "text-blue-500"
    } else if (score >= 500) {
        status = "Fair"
        color = "text-yellow-500"
    }

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-center text-lg font-medium text-gray-400">Your Credit Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center relative">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={20}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                angleAxisId={0}
                                tick={false}
                            />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                                fill="var(--color-brand)"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center mt-4">
                    <div className="text-6xl font-bold text-white tracking-tighter">{score}</div>
                    <div className={`text-xl font-medium ${color} mt-2`}>{status}</div>
                </div>
                <p className="text-sm text-gray-500 mt-[-40px]">Updated just now</p>
            </CardContent>
        </Card>
    )
}
