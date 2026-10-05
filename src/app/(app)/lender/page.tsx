import { LenderOverview } from "@/components/lender/overview"
import { getPortfolio } from "@/lib/data/service"

export const metadata = { title: "Lending overview" }

export default async function LenderPage() {
  return <LenderOverview portfolio={await getPortfolio()} />
}
