import { PolicyEditor } from "@/components/lender/policy-editor"
import { getPortfolio } from "@/lib/data/service"

export const metadata = { title: "Underwriting policy" }

export default async function PolicyPage() {
  return <PolicyEditor portfolio={await getPortfolio()} />
}
