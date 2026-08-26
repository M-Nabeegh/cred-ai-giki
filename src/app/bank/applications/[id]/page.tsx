import { BankApplicationDetailPage } from "@/components/portal/PortalPages"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BankApplicationDetailPage id={id} />
}
