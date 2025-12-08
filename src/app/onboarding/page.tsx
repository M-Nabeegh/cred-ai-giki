"use client"

import { useState } from "react"
import { ProfileWizard } from "@/components/onboarding/ProfileWizard"
import { DataExtraction } from "@/components/onboarding/DataExtraction"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
    const router = useRouter()
    const [phase, setPhase] = useState<"profile" | "extraction">("profile")

    const handleProfileComplete = () => {
        setPhase("extraction")
    }

    const handleExtractionComplete = () => {
        router.push("/dashboard")
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            {phase === "profile" ? (
                <ProfileWizard onComplete={handleProfileComplete} />
            ) : (
                <DataExtraction onComplete={handleExtractionComplete} />
            )}
        </div>
    )
}
