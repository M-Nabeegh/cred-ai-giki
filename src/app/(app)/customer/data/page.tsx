import { notFound } from "next/navigation"
import { DataView } from "@/components/customer/data-view"
import { getDemoCustomer } from "@/lib/data/service"

export const metadata = { title: "My data" }

export default async function DataPage() {
  const bundle = await getDemoCustomer()
  if (!bundle) notFound()
  return <DataView record={bundle.record} />
}
