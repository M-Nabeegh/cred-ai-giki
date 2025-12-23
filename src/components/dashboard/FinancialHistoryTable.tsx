"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { type User } from "@/lib/db"

export function FinancialHistoryTable({ user }: { user: User }) {
    if (!user.transactionHistory || user.transactionHistory.length === 0) {
        return null;
    }

    return (
        <Card className="glass-card border-white/10 mt-8">
            <CardHeader>
                <CardTitle>Detailed Financial History</CardTitle>
                <CardDescription>Recent utility bills, telco usage, and regular payments.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-white/10 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-gray-400 font-medium">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {user.transactionHistory.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-gray-300">
                                        {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4 text-white font-medium">{tx.description}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${tx.category === 'Utility' ? 'bg-yellow-500/20 text-yellow-400' :
                                                tx.category === 'Telco' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-blue-500/20 text-blue-400'}`}>
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white">PKR {tx.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            ● {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
