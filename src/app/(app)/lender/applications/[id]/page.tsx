import { notFound } from "next/navigation"
import { ApplicationReview } from "@/components/lender/review"
import { getApplicationBundle } from "@/lib/data/service"

export const metadata = { title: "Review application" }

export default async function ApplicationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ customer?: string }> }) {
  const [{ id }, { customer }] = await Promise.all([params, searchParams])
  const bundle = await getApplicationBundle(id, customer)
  if (!bundle) notFound()
  return <ApplicationReview applicationId={id} {...bundle} />
}
