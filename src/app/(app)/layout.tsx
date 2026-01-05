import { Sidebar } from '@/components/Navigation' // 👈 WICHTIG: Der Pfad zu deiner neuen Sidebar

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Desktop (Fest fixiert links) */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Hauptinhalt (Rechts daneben, scrollbar) */}
      <div className="flex-1 md:pl-64 flex flex-col h-full">
        <main className="flex-1 overflow-y-auto p-0">
          {children}
        </main>
      </div>
    </div>
  )
}