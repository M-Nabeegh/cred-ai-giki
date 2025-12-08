"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // In a real app, this would be a Server Action or API route
            // For this demo, we call the mock DB directly (client-side simulation)
            const { db } = await import("@/lib/db")

            // Get form values (simplified for demo, ideally use controlled inputs or FormData)
            const phone = (document.getElementById("phone") as HTMLInputElement).value
            const cnic = (document.getElementById("cnic") as HTMLInputElement).value
            const income = parseInt((document.getElementById("income") as HTMLInputElement).value)
            const password = (document.getElementById("password") as HTMLInputElement).value

            await db.createUser({
                phone,
                cnic,
                income,
                password,
                name: "New User" // Placeholder
            })

            // Store session (simplified)
            localStorage.setItem("credai_user", phone)

            router.push("/onboarding")
        } catch (error: any) {
            alert(error.message) // Simple alert for error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-md glass-card border-white/10">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Create Account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your details to get your credit score
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-gray-300">
                                Phone Number
                            </label>
                            <Input id="phone" placeholder="0300 1234567" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="cnic" className="text-sm font-medium text-gray-300">
                                CNIC
                            </label>
                            <Input id="cnic" placeholder="12345-1234567-1" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="income" className="text-sm font-medium text-gray-300">
                                Monthly Income (PKR)
                            </label>
                            <Input id="income" type="number" placeholder="50000" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <Input id="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-brand hover:bg-brand-glow"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Account..." : "Register"}
                        </Button>
                        <div className="text-sm text-center text-gray-400">
                            Already have an account?{" "}
                            <Link href="/login" className="text-brand hover:underline">
                                Login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
