import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Smartphone, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-brand/10 blur-[100px] -z-10" />
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Credit Scoring for the <br />
            <span className="text-gradient">Unbanked Generation</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Cred AI uses alternative data like utility bills and mobile top-ups to build your financial identity. Fair, fast, and inclusive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="premium" className="text-lg px-8">
                Get Your Score <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Cred AI?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card border-white/5">
              <CardHeader>
                <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-brand" />
                </div>
                <CardTitle>Instant Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get your credit score in seconds using our advanced AI algorithms that analyze your alternative data.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Mobile First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Designed for your smartphone. Manage your credit, apply for loans, and track progress on the go.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/5">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your data is encrypted and used only for scoring. We prioritize your privacy and data security.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-brand-dark to-brand rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Build Your Credit History?
              </h2>
              <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                Join thousands of users who are accessing financial services for the first time with Cred AI.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-brand-dark hover:bg-blue-50 font-bold">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
