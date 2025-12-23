"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-20 pb-10">
            {/* Hero Section */}
            <section className="container mx-auto px-4 text-center py-20">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-6">
                    Redefining Credit for the Digital Age
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                    Cred AI empowers you to build, manage, and leverage your financial reputation through transparency and AI-driven insights.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/register">
                        <Button variant="default" className="bg-brand hover:bg-brand-glow text-white px-8 py-6 text-lg">
                            Join the Revolution <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Mission Grid */}
            <section className="container mx-auto px-4 py-20 bg-white/5 rounded-3xl border border-white/10">
                <div className="grid md:grid-cols-3 gap-12 text-center">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Credit Building</h3>
                        <p className="text-gray-400">
                            We use alternative data points like utilities and telco history to build a credit score that truly represents you.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Trust & Security</h3>
                        <p className="text-gray-400">
                            Your data is yours. We provide a secure environment where your financial history works for you, not against you.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Financial Inclusion</h3>
                        <p className="text-gray-400">
                            Bringing financial services to the unbanked and underbanked through innovative technology and fairer assessment.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
