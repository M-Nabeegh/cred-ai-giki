import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "CredAI — Credit scoring from everyday payments", template: "%s · CredAI" },
  description: "Explainable credit scoring for people without a credit file. Turns utility bills, mobile top-ups, wallet and bank activity into a score, reason codes and an underwriting decision.",
  openGraph: { title: "CredAI", description: "Explainable alternative-data credit scoring with a lender console and a plug-in data API." },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} min-h-screen antialiased`}>{children}</body>
    </html>
  )
}
