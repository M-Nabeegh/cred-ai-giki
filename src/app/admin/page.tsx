"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, FileText, Eye } from "lucide-react"
import { useState, useEffect } from "react"

// Mock DB import (client-side simulation)
import { db, type Loan } from "@/lib/db"

export default function AdminPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [applications, setApplications] = useState<Loan[]>([])
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

    useEffect(() => {
        // Check Auth
        const user = localStorage.getItem("credai_user")
        if (user !== "admin" && localStorage.getItem("credai_user_id") !== "admin-id") {
            // Better check would be robust but for mock:
            // We expect "admin" in credai_user for the admin user as per login logic
            window.location.href = "/login"
            return
        }

        setIsAuthorized(true)
        setIsLoading(false)

        // Load initial data
        db.getLoans().then(setApplications)
    }, [])

    if (isLoading) return <div className="text-white flex justify-center py-20">Loading Admin Portal...</div>
    if (!isAuthorized) return null

    const handleAction = async (id: string, action: "approved" | "rejected") => {
        await db.updateLoanStatus(id, action)
        setApplications(await db.getLoans())
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
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

            <div className="grid gap-6">
                {applications.map((app) => (
                    <Card key={app.id} className="glass-card border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle>{app.userName}</CardTitle>
                                <CardDescription>Loan Amount: PKR {app.amount.toLocaleString()}</CardDescription>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${app.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                                app.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                                    "bg-red-500/20 text-red-400"
                                }`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-4">
                                    {app.document && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                                            onClick={() => setSelectedDoc(app.document || null)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" /> View {app.document}
                                        </Button>
                                    )}
                                </div>

                                {app.status === "pending" && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => handleAction(app.id, "approved")}
                                        >
                                            <Check className="w-4 h-4 mr-1" /> Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleAction(app.id, "rejected")}
                                        >
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {applications.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                        No applications found.
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedDoc(null)}>
                    <div className="bg-slate-900 border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Application Review: {applications.find(a => a.document === selectedDoc)?.userName}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-auto bg-slate-950/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Document */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Document Preview</h4>
                                    <div className="aspect-[3/4] bg-white text-black p-8 rounded shadow-lg font-mono text-sm overflow-hidden relative">
                                        <div className="absolute top-2 right-2 text-xs text-gray-400">Page 1 of 1</div>
                                        <div className="border-b-2 border-black pb-4 mb-4">
                                            <h2 className="text-xl font-bold">BANK STATEMENT</h2>
                                            <p className="text-xs">HBL - Habib Bank Limited</p>
                                        </div>
                                        <div className="space-y-2 mb-8">
                                            <div className="flex justify-between"><span>Account:</span> <span className="font-bold">0123-4567-8901</span></div>
                                            <div className="flex justify-between"><span>Title:</span> <span className="font-bold uppercase">{applications.find(a => a.document === selectedDoc)?.userName}</span></div>
                                            <div className="flex justify-between"><span>Statement Period:</span> <span>01 Jan 2025 - 31 Mar 2025</span></div>
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-black">
                                                    <th className="text-left py-1">Date</th>
                                                    <th className="text-left py-1">Desc</th>
                                                    <th className="text-right py-1">Type</th>
                                                    <th className="text-right py-1">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr><td className="py-1">01/03</td><td className="py-1">Salary In</td><td className="text-right">CR</td><td className="text-right">185,000</td></tr>
                                                <tr><td className="py-1">05/03</td><td className="py-1">ATM W/D</td><td className="text-right">DR</td><td className="text-right">25,000</td></tr>
                                                <tr><td className="py-1">10/03</td><td className="py-1">Netflix</td><td className="text-right">DR</td><td className="text-right">1,500</td></tr>
                                                <tr><td className="py-1">15/03</td><td className="py-1">Utility Bill</td><td className="text-right">DR</td><td className="text-right">12,400</td></tr>
                                            </tbody>
                                        </table>
                                        <div className="mt-8 pt-4 border-t border-black flex justify-between font-bold">
                                            <span>Closing Balance:</span>
                                            <span>PKR 456,100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: User Financial Profile */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Applicant Credit Profile</h4>

                                    {/* Score Placeholder - In real app we fetch user details here */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-300">Credit Score</span>
                                            <span className="text-2xl font-bold text-emerald-400">750</span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[85%]"></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Excellent - Low Risk</p>
                                    </div>

                                    <div className="space-y-2">
                                        <h5 className="text-white text-sm font-medium">Verified Income Sources</h5>
                                        <div className="flex justify-between text-sm p-3 bg-white/5 rounded">
                                            <span className="text-gray-400">Primary Income</span>
                                            <span className="text-white">PKR 85,000/mo</span>
                                        </div>
                                    </div>

                                    {/* Mock History Table (Mini) */}
                                    <div className="space-y-2">
                                        <h5 className="text-white text-sm font-medium">Recent Activity</h5>
                                        <div className="bg-white/5 rounded overflow-hidden text-xs">
                                            <div className="p-2 border-b border-white/5 flex justify-between text-gray-400">
                                                <span>Type</span>
                                                <span>Amount</span>
                                                <span>Status</span>
                                            </div>
                                            <div className="p-2 border-b border-white/5 flex justify-between text-gray-300">
                                                <span>Utility Bill (LESCO)</span>
                                                <span>14,500</span>
                                                <span className="text-emerald-400">Paid</span>
                                            </div>
                                            <div className="p-2 border-b border-white/5 flex justify-between text-gray-300">
                                                <span>Telco (Jazz)</span>
                                                <span>2,000</span>
                                                <span className="text-emerald-400">Paid</span>
                                            </div>
                                            <div className="p-2 flex justify-between text-gray-300">
                                                <span>Mobile Load</span>
                                                <span>500</span>
                                                <span className="text-emerald-400">Paid</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                                            const app = applications.find(a => a.document === selectedDoc);
                                            if (app) handleAction(app.id, "approved");
                                            setSelectedDoc(null);
                                        }}>
                                            Approve Loan
                                        </Button>
                                        <Button variant="destructive" className="w-full" onClick={() => {
                                            const app = applications.find(a => a.document === selectedDoc);
                                            if (app) handleAction(app.id, "rejected");
                                            setSelectedDoc(null);
                                        }}>
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
