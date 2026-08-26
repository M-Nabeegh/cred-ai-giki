"use client"

import Link from "next/link"
import { useState } from "react"
import { syntheticProfiles } from "@/lib/credai-data"
import { useDemoStore } from "@/lib/demo-store"

const archetypes = [
  { value: "steady", label: "Steady", detail: "Long, consistent simulated history across sources." },
  { value: "building", label: "Building", detail: "Growing history with some gaps still filling in." },
  { value: "volatile", label: "Volatile", detail: "Irregular simulated activity with higher noise." },
  { value: "thin_file", label: "Thin file", detail: "Few simulated sources; demonstrates missing-data handling." },
]

const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Hyderabad"]

export default function RegisterPage() {
  const { actions, notice } = useDemoStore()
  const [displayName, setDisplayName] = useState("")
  const [archetype, setArchetype] = useState("steady")
  const [city, setCity] = useState("Lahore")
  const [error, setError] = useState("")
  const [completedProfileId, setCompletedProfileId] = useState<string | null>(null)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = displayName.trim()
    if (name.length < 2 || name.length > 40) {
      setError("Enter a fake display name between 2 and 40 characters.")
      return
    }
    if (!archetypes.some((option) => option.value === archetype)) {
      setError("Choose one of the listed synthetic archetypes.")
      return
    }
    if (!cities.includes(city)) {
      setError("Choose one of the listed synthetic cities.")
      return
    }
    const match = syntheticProfiles.find((profile) => profile.behaviorProfile === archetype) ?? syntheticProfiles[0]
    actions.registerDemoCustomer(match.id, name, "demo-registration")
    localStorage.setItem("credai_user", "registered-customer")
    localStorage.setItem("credai_user_id", "demo-customer-registered")
    localStorage.setItem("credai_role", "customer")
    localStorage.setItem("credai_display_name", name)
    setError("")
    setCompletedProfileId(match.id)
  }

  const completedProfile = completedProfileId ? syntheticProfiles.find((profile) => profile.id === completedProfileId) : null

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#111827)] px-4 py-12 text-slate-100"><div className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-teal-200 hover:underline">← Back to public site</Link><div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-8"><div className="rounded-full border border-teal-300/40 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100 w-fit">Synthetic registration</div><h1 className="mt-6 text-4xl font-black text-white">Create a demo customer profile</h1><p className="mt-4 text-slate-300">Registration is simulated and stays in your browser. Do not enter a real CNIC, phone number, OTP, password, or financial record.</p>{completedProfile ? <div className="mt-8 rounded-2xl border border-teal-300/30 bg-teal-300/10 p-6" role="status"><h2 className="text-xl font-semibold text-white">Registration complete</h2><p className="mt-3 text-sm text-slate-200">Your demo session is linked to synthetic profile <span className="font-semibold text-white">{completedProfile.id}</span> ({completedProfile.maskedCustomerId}, {completedProfile.behaviorProfile.replaceAll("_", " ")}).</p>{notice ? <p className="mt-3 text-sm text-teal-100">{notice.message}</p> : null}<p className="mt-3 text-sm text-slate-300">Next: review consent controls, inspect the demo score, and simulate a loan application.</p><Link href="/customer/data-sources" className="mt-5 inline-flex rounded-xl bg-teal-400 px-5 py-3 font-semibold text-slate-950">Continue to consent setup</Link></div> : <form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm text-slate-200">Fake display name<span className="text-slate-500"> (never your real name)</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" placeholder="e.g. Demo Explorer" aria-label="Fake display name" /></label><fieldset><legend className="text-sm text-slate-200">Synthetic behavior archetype</legend><div className="mt-2 grid gap-3 md:grid-cols-2">{archetypes.map((option) => <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 ${archetype === option.value ? "border-teal-300/60 bg-teal-300/10" : "border-white/10 bg-white/[0.04]"}`}><input type="radio" name="archetype" value={option.value} checked={archetype === option.value} onChange={() => setArchetype(option.value)} className="sr-only" /><span className="font-semibold text-white">{option.label}</span><span className="mt-1 block text-sm text-slate-400">{option.detail}</span></label>)}</div></fieldset><label className="block text-sm text-slate-200">Synthetic city<select value={city} onChange={(event) => setCity(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" aria-label="Synthetic city">{cities.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>{error ? <p className="rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100" role="alert">{error}</p> : null}<button className="w-full rounded-xl bg-teal-400 px-5 py-3 font-semibold text-slate-950">Create synthetic profile</button><p className="text-xs text-slate-500">Registration selects an existing deterministic synthetic profile and logs a demo audit event. No real identity is created.</p></form>}</div></div></div>
}
