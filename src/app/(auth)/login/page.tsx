"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authenticateDemoAccount, demoAccounts } from "@/lib/permissions"

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState("customer")
  const [password, setPassword] = useState("demo1234")
  const [error, setError] = useState("")

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const account = authenticateDemoAccount(login, password)
    if (!account) {
      setError("Invalid demo credentials. Use one of the listed synthetic accounts.")
      return
    }
    localStorage.setItem("credai_user", account.login)
    localStorage.setItem("credai_user_id", account.id)
    localStorage.setItem("credai_role", account.role)
    localStorage.setItem("credai_display_name", account.name)
    router.push(account.landingRoute)
  }

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#111827)] px-4 py-12 text-slate-100"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm text-teal-200 hover:underline">← Back to public site</Link><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]"><section><div className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100 w-fit">Demo Mode</div><h1 className="mt-6 text-4xl font-black text-white md:text-6xl">Choose a synthetic role and enter the CredAI prototype.</h1><p className="mt-5 text-lg leading-8 text-slate-300">This login is local and intentionally fake. It demonstrates customer, bank, and admin authorization flows without real credentials, OTPs, or financial accounts.</p><div className="mt-8 grid gap-4 md:grid-cols-2">{demoAccounts.slice(0, 4).map((account) => <button key={account.id} type="button" onClick={() => { setLogin(account.login); setPassword(account.password); setError("") }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/10"><div className="font-semibold text-white">{account.name}</div><div className="text-sm text-slate-400">{account.role} • {account.login}</div></button>)}</div></section><form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-slate-950/40"><h2 className="text-2xl font-bold text-white">Demo login</h2><p className="mt-2 text-sm text-slate-400">No real passwords. See docs/credai-rebuild/demo-accounts.md.</p><label className="mt-6 block text-sm text-slate-200">Login identifier<input value={login} onChange={(event) => setLogin(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" /></label><label className="mt-4 block text-sm text-slate-200">Demo password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" /></label>{error && <p className="mt-4 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100">{error}</p>}<button className="mt-6 w-full rounded-xl bg-teal-400 px-5 py-3 font-semibold text-slate-950">Continue to workspace</button><p className="mt-4 text-xs text-slate-500">CredAI is a synthetic-data prototype. It does not provide a real credit score, financial advice, loan approval, or credit decision.</p></form></div></div></div>
}
