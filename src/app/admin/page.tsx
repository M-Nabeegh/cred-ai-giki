"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, FileText, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Need to create Dialog or use native

// Mock DB import (client-side simulation)
import { db, type Loan } from "@/lib/db"

export default function AdminPage() {
    const [applications, setApplications] = useState<Loan[]>([])
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null)

    useEffect(() => {
        // Load initial data
        db.getLoans().then(setApplications)
    }, [])

    const handleAction = async (id: string, action: "approved" | "rejected") => {
        await db.updateLoanStatus(id, action)
        setApplications(await db.getLoans())
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

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

            {/* Document Viewer Modal (Simplified) */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedDoc(null)}>
                    <div className="bg-slate-900 border border-white/10 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Document Viewer</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-8 bg-white/5 flex-1 flex items-center justify-center overflow-auto">
                            {/* Placeholder for actual document */}
                            <div className="text-center">
                                <FileText className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Preview of <span className="text-white font-mono">{selectedDoc}</span></p>
                                <div className="mt-8 p-8 bg-white text-black rounded shadow-lg max-w-md mx-auto text-left text-sm font-mono">
                                    <p className="font-bold text-lg mb-4 border-b pb-2">SALARY SLIP</p>
                                    <p>Employee: {applications.find(a => a.document === selectedDoc)?.userName}</p>
                                    <p>Month: October 2025</p>
                                    <p>Basic Pay: PKR 85,000</p>
                                    <p>Allowances: PKR 15,000</p>
                                    <p className="font-bold mt-4 pt-2 border-t">Net Pay: PKR 100,000</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
