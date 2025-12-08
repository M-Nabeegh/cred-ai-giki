"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Loader2, Server, Smartphone, Zap, ShieldCheck, Database, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const steps = [
    { id: "nadra", label: "Verifying Identity (NADRA)", icon: ShieldCheck, color: "text-blue-400" },
    { id: "telco", label: "Fetching Telco Data (Jazz/Telenor)", icon: Smartphone, color: "text-purple-400" },
    { id: "utility", label: "Retrieving Utility Bills (LESCO/SNGPL)", icon: Zap, color: "text-yellow-400" },
    { id: "analysis", label: "Analyzing Financial Behavior", icon: Database, color: "text-emerald-400" },
]

export function DataExtraction({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0)
    const [logs, setLogs] = useState<string[]>([])
    const [completed, setCompleted] = useState(false)

    useEffect(() => {
        if (currentStep >= steps.length) {
            setTimeout(() => setCompleted(true), 1500)
            return
        }

        const step = steps[currentStep]
        const timer = setTimeout(() => {
            // Generate random dummy data logs
            const newLogs: string[] = []
            if (step.id === "telco") {
                newLogs.push(`[JAZZ] Found Number: 0300-****${Math.floor(Math.random() * 900) + 100}`)
                newLogs.push(`[JAZZ] Last Recharge: PKR ${Math.floor(Math.random() * 500) + 100}`)
                newLogs.push(`[TELENOR] No records found`)
                newLogs.push(`[ANALYSIS] Usage Pattern: High Frequency`)
            } else if (step.id === "utility") {
                newLogs.push(`[LESCO] Bill #45829: PKR ${Math.floor(Math.random() * 5000) + 2000} (Paid)`)
                newLogs.push(`[SNGPL] Bill #92831: PKR ${Math.floor(Math.random() * 1000) + 500} (Paid)`)
                newLogs.push(`[WASA] Status: Clear`)
            } else if (step.id === "nadra") {
                newLogs.push(`[NADRA] CNIC Verified: Valid`)
                newLogs.push(`[NADRA] Family Tree: Linked`)
                newLogs.push(`[SECURITY] Biometric Match: 98%`)
            } else if (step.id === "analysis") {
                newLogs.push(`[AI] Calculating Risk Score...`)
                newLogs.push(`[AI] Cross-referencing datasets...`)
                newLogs.push(`[AI] Score Generated Successfully`)
            }

            setLogs(prev => [...prev, ...newLogs])
            setCurrentStep(prev => prev + 1)
        }, 2000)

        return () => clearTimeout(timer)
    }, [currentStep])

    return (
        <Card className="w-full max-w-2xl glass-card border-brand/30 relative overflow-hidden shadow-2xl shadow-brand/10">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/20 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />

            <CardHeader className="relative z-10">
                <CardTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5 text-brand" /> Secure Data Extraction
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 relative z-10">
                {/* Progress Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-500 ${index === currentStep
                                    ? "bg-brand/10 border-brand/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                    : index < currentStep
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : "bg-white/5 border-white/5 opacity-50"
                                }`}
                        >
                            <div className="relative">
                                {index < currentStep ? (
                                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                                ) : index === currentStep ? (
                                    <div className="relative">
                                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                                        <div className="absolute inset-0 animate-ping bg-brand rounded-full opacity-20" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-600" />
                                )}
                            </div>
                            <span className={`font-medium text-sm ${index <= currentStep ? "text-white" : "text-gray-500"}`}>
                                {step.label}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Terminal */}
                <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/80 shadow-inner">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border-b border-white/5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        <span className="ml-2 text-xs text-gray-500 font-mono">cred-ai-agent — v1.0.4</span>
                    </div>
                    <div className="p-4 font-mono text-xs h-64 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-emerald-400/90 flex gap-2"
                            >
                                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                                <span>{log}</span>
                            </motion.div>
                        ))}
                        {currentStep < steps.length && (
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-2 h-4 bg-brand inline-block align-middle ml-1"
                            />
                        )}
                    </div>
                </div>

                {/* Completion Action */}
                <AnimatePresence>
                    {completed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex justify-center pt-4"
                        >
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-brand to-brand-dark hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500 text-lg px-12 py-6 h-auto"
                                onClick={onComplete}
                            >
                                View Your Credit Score
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
