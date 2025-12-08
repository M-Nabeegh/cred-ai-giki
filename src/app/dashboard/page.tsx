"use client"

import { Button } from "@/components/ui/button"
import { CreditScoreGauge } from "@/components/dashboard/CreditScoreGauge"
import { ScoreInsights } from "@/components/dashboard/ScoreInsights"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PlusCircle, FileText, History, Clock } from "lucide-react"
import { HelpTips } from "@/components/dashboard/HelpTips"
import { useEffect, useState } from "react"
import { db, type User } from "@/lib/db"

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Simulate fetching current user
        // In real app, use session/context
        const phone = localStorage.getItem("credai_user")
        if (phone) {
            // Find user by phone (hack for demo since db is in-memory singleton)
            // Ideally db.getUserByPhone
            // We'll just fetch the first user for demo if not found or implement a finder
            // For now, let's just use the seeded user if no local storage match
            // This part is tricky with client-side only mock DB across pages without context
            // But since db is a singleton imported module, it might persist state in SPA navigation
            // Let's try to find the user
            // We need to expose a method to find user
        }
    }, [])

    // Weighted Score Calculation (Sprint 1 Requirement)
    // Telco (40%) + Utility (30%) + Income/Dependents (20%) + Repayment (10%)
    // Mocking the base values for calculation
    const telcoScore = 800 * 0.40 // 320
    const utilityScore = 750 * 0.30 // 225
    const incomeScore = 700 * 0.20 // 140
    const repaymentScore = 600 * 0.10 // 60

    const score = Math.round(telcoScore + utilityScore + incomeScore + repaymentScore) // ~745

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Welcome back, Nabeegh</h1>
                    <p className="text-gray-400">Here is your financial overview.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/loan/apply">
                        <Button variant="premium">
                            <PlusCircle className="mr-2 w-4 h-4" /> Apply for Loan
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Credit Score Gauge */}
                <div className="md:col-span-1">
                    <CreditScoreGauge score={score} />
                </div>

                {/* Insights */}
                <div className="md:col-span-2">
                    <ScoreInsights />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Active Loans / Status */}
                <Card className="glass-card border-white/10">
                    <CardHeader>
                        <CardTitle>Active Applications</CardTitle>
                        <CardDescription>Track your loan application status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-white">Personal Loan (Tier 1)</h4>
                                    <p className="text-sm text-gray-400">Applied on Nov 18, 2025</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                                Processing
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* History */}
                <Card className="glass-card border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 pb-3 border-b border-white/5">
                                <Clock className="w-4 h-4 text-gray-500 mt-1" />
                                <div>
                                    <p className="text-sm text-white">Logged in from new device</p>
                                    <p className="text-xs text-gray-500">Just now</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 pb-3 border-b border-white/5">
                                <FileText className="w-4 h-4 text-brand mt-1" />
                                <div>
                                    <p className="text-sm text-white">Loan Application Submitted</p>
                                    <p className="text-xs text-gray-500">2 hours ago</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-white">Credit Score Updated</p>
                                    <p className="text-xs text-gray-500">Yesterday</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Help & Guidance (Sprint 1) */}
            <HelpTips />
        </div>
    )
}
