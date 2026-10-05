import { notFound } from "next/navigation"
import { CustomerOverview } from "@/components/customer/overview"
import { getDemoCustomer } from "@/lib/data/service"

export const metadata = { title: "Your score" }

export default async function CustomerPage() {
  const bundle = await getDemoCustomer()
  if (!bundle) notFound()
  return <CustomerOverview record={bundle.record} />
}
