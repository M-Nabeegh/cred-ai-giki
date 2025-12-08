import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Cred AI
                    </span>
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                        How it Works
                    </Link>
                    <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                        About
                    </Link>
                </div>

                <div className="flex items-center space-x-4">
                    <Link href="/login">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button variant="default" className="bg-brand hover:bg-brand-glow text-white">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
