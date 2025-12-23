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
import { FinancialHistoryTable } from "@/components/dashboard/FinancialHistoryTable"

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { db } = await import("@/lib/db")
                const userId = localStorage.getItem("credai_user_id")

                if (userId) {
                    const userData = await db.getUser(userId)
                    if (userData) {
                        setUser(userData)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [])

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center text-white">Loading Financial Profile...</div>
    }

    if (!user) {
        return <div className="flex min-h-screen items-center justify-center text-white">Please log in to view your dashboard.</div>
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Welcome back, {user.name || "User"}</h1>
                    <p className="text-gray-400">Here is your financial overview.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/loan/apply">
                        <Button variant="premium">
                            <PlusCircle className="mr-2 w-4 h-4" /> Apply for Loan
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={() => {
                            localStorage.removeItem("credai_user");
                            localStorage.removeItem("credai_user_id");
                            window.location.href = "/";
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Credit Score Gauge */}
                <div className="md:col-span-1">
                    <CreditScoreGauge score={user.score || 0} />
                </div>

                {/* Insights */}
                <div className="md:col-span-2">
                    <ScoreInsights user={user} />
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
                        {user.documents.length > 0 ? (
                            <div className="space-y-3">
                                {user.documents.map((doc, idx) => (
                                    <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                                <FileText className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white">{doc.name}</h4>
                                                <p className="text-sm text-gray-400">Status: {doc.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No active applications.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* History */}
                <Card className="glass-card border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {user.history.slice(0, 5).map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                                    <div className="mt-1">
                                        {activity.type === "LOGIN" && <Clock className="w-4 h-4 text-gray-500" />}
                                        {activity.type === "SCORE_UPDATE" && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />}
                                        {activity.type === "DOCUMENT_UPLOAD" && <FileText className="w-4 h-4 text-brand" />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-white">{activity.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial History (Sprint 2 Requirement) */}
            <FinancialHistoryTable user={user} />

            {/* Importance of Credit History (Sprint 3) */}
            <Card className="glass-card border-brand/20 bg-brand/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <CardHeader>
                    <CardTitle className="text-white">Why Your Credit History Matters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-300 relative z-10">
                    <p>
                        Your credit history is a record of your responsible repayment of debts.
                        In the upcoming <strong>Cred AI Marketplace</strong>, having a strong history will unlock:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li><span className="text-emerald-400 font-medium">Lower Interest Rates</span> on personal and business loans.</li>
                        <li><span className="text-purple-400 font-medium">Instant Approvals</span> without paperwork.</li>
                        <li><span className="text-blue-400 font-medium">Higher Credit Limits</span> for digital wallets and credit cards.</li>
                    </ul>
                    <p className="text-sm text-gray-500 pt-2 italic">
                        "Reliability is the currency of the future."
                    </p>
                </CardContent>
            </Card>

            {/* Help & Guidance (Sprint 1) */}
            <HelpTips />
        </div>
    )
}
