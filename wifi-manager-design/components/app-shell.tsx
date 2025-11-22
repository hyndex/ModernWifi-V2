"use client"

import type React from "react"

import { LayoutDashboard, Wifi, Settings, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ViewState } from "@/app/page"

interface AppShellProps {
  children: React.ReactNode
  currentView: ViewState
  onViewChange: (view: ViewState) => void
  onLogout: () => void
}

export function AppShell({ children, currentView, onViewChange, onLogout }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">ESP32-S3-PRO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline-block">FW: v1.2.4</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onLogout}>
              <Power className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">{children}</div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/90 px-2 pb-safe pt-2 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around">
          <NavButton
            active={currentView === "dashboard"}
            onClick={() => onViewChange("dashboard")}
            icon={LayoutDashboard}
            label="Status"
          />
          <NavButton
            active={currentView === "wifi"}
            onClick={() => onViewChange("wifi")}
            icon={Wifi}
            label="Networks"
          />
          <NavButton
            active={currentView === "config"}
            onClick={() => onViewChange("config")}
            icon={Settings}
            label="System"
          />
        </div>
      </nav>

      {/* Desktop Navigation Sidebar (Optional for larger screens, hidden on mobile) */}
    </div>
  )
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center justify-center gap-1 rounded-xl p-3 transition-all duration-300 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div className={`rounded-full p-1 transition-all ${active ? "bg-primary/10" : ""}`}>
        <Icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : "scale-100"}`} />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
