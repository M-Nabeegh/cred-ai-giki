"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Simple native select for now to avoid complex shadcn setup if not needed, 
// but let's try to build a nice UI.

export function ProfileWizard({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        incomeBracket: "",
        dependents: "",
        householdType: "",
    })

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1)
        } else {
            onComplete()
        }
    }

    return (
        <Card className="w-full max-w-lg glass-card border-white/10">
            <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>Step {step} of 2: {step === 1 ? "Financial Details" : "Household Info"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Monthly Income Bracket</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                                value={formData.incomeBracket}
                                onChange={(e) => setFormData({ ...formData, incomeBracket: e.target.value })}
                            >
                                <option value="" className="bg-slate-900">Select Income Range</option>
                                <option value="low" className="bg-slate-900">Below PKR 30,000</option>
                                <option value="medium" className="bg-slate-900">PKR 30,000 - 80,000</option>
                                <option value="high" className="bg-slate-900">Above PKR 80,000</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Number of Dependents</label>
                            <Input
                                type="number"
                                placeholder="e.g. 2"
                                value={formData.dependents}
                                onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Household Type</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand"
                                value={formData.householdType}
                                onChange={(e) => setFormData({ ...formData, householdType: e.target.value })}
                            >
                                <option value="" className="bg-slate-900">Select Type</option>
                                <option value="owned" className="bg-slate-900">Owned</option>
                                <option value="rented" className="bg-slate-900">Rented</option>
                                <option value="shared" className="bg-slate-900">Shared</option>
                            </select>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-brand hover:bg-brand-glow" onClick={handleNext}>
                    {step === 2 ? "Analyze Data" : "Next"}
                </Button>
            </CardFooter>
        </Card>
    )
}
