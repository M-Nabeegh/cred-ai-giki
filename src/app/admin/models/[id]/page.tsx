import { AdminDashboardPage } from "@/components/portal/PortalPages"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminDashboardPage page="models" id={id} />
}
