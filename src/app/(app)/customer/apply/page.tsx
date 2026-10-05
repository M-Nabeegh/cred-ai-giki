import { notFound } from "next/navigation"
import { ApplyForm } from "@/components/customer/apply"
import { getDemoCustomer } from "@/lib/data/service"

export const metadata = { title: "Apply for a loan" }

export default async function ApplyPage() {
  const bundle = await getDemoCustomer()
  if (!bundle) notFound()
  return <ApplyForm record={bundle.record} />
}
