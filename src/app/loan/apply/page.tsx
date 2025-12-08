"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function LoanApplyPage() {
    const router = useRouter()
    const [amount, setAmount] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<"idle" | "approved" | "redirecting">("idle")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        const loanAmount = parseInt(amount)

        // Simulate processing
        setTimeout(() => {
            if (loanAmount > 500000) {
                setStatus("redirecting")
                setTimeout(() => {
                    router.push("/loan/upload")
                }, 1500)
            } else {
                setStatus("approved")
                setIsLoading(false)
            }
        }, 1500)
    }

    if (status === "approved") {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <Card className="w-full max-w-md glass-card border-emerald-500/50 bg-emerald-900/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <CardTitle className="text-2xl text-emerald-400">Loan Approved!</CardTitle>
                        <CardDescription className="text-emerald-200/70">
                            Your loan of PKR {amount} has been instantly approved based on your credit score.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/dashboard")}>
                            Go to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Apply for a Loan</h1>
            <Card className="glass-card border-white/10">
                <CardHeader>
                    <CardTitle>Loan Details</CardTitle>
                    <CardDescription>Enter the amount you wish to borrow.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Loan Amount (PKR)</label>
                            <Input
                                type="number"
                                placeholder="e.g. 50000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Loans above PKR 500,000 require additional document verification.
                            </p>
                        </div>

                        {parseInt(amount) > 500000 && (
                            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-200/80">
                                    <span className="font-bold text-yellow-500">Verification Required:</span> Since this amount exceeds PKR 500k, you will need to upload documents (Salary Slip, Rent Agreement, etc.) in the next step.
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            variant="premium"
                            disabled={isLoading || !amount}
                        >
                            {isLoading ? (status === "redirecting" ? "Redirecting..." : "Processing...") : "Next Step"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
