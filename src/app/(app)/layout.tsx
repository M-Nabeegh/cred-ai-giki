import { AppShell } from "@/components/shell/app-shell"
import { getProvider } from "@/lib/data/provider"

export const dynamic = "force-dynamic"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const provider = getProvider()
  return <AppShell provider={{ kind: provider.kind, label: provider.label }}>{children}</AppShell>
}
