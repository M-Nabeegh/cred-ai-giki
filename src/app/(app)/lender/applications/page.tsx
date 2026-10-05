import { ApplicationQueue } from "@/components/lender/queue"
import { getPortfolio } from "@/lib/data/service"

export const metadata = { title: "Applications" }

export default async function ApplicationsPage() {
  return <ApplicationQueue portfolio={await getPortfolio()} />
}
