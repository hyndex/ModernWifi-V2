"use client"

import { useState, useEffect } from "react"
import { ActivationPortal } from "@/components/activation-portal"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { WifiManager } from "@/components/wifi-manager"
import { SystemConfig } from "@/components/system-config"
import { Toaster } from "@/components/ui/toaster"

export type ViewState = "dashboard" | "wifi" | "config"

export default function Home() {
  const [isActivated, setIsActivated] = useState(false)
  const [currentView, setCurrentView] = useState<ViewState>("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate checking activation status from ESP32 storage
  useEffect(() => {
    const timer = setTimeout(() => {
      // In a real app, this would fetch from an API
      const storedActivation = localStorage.getItem("esp32_activated")
      if (storedActivation === "true") {
        setIsActivated(true)
      }
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleActivation = () => {
    setIsActivated(true)
    localStorage.setItem("esp32_activated", "true")
  }

  const handleLogout = () => {
    setIsActivated(false)
    localStorage.removeItem("esp32_activated")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <div className="font-mono text-sm tracking-widest opacity-70">CONNECTING TO ESP32...</div>
        </div>
      </div>
    )
  }

  if (!isActivated) {
    return <ActivationPortal onActivate={handleActivation} />
  }

  return (
    <AppShell currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout}>
      {currentView === "dashboard" && <Dashboard onViewChange={setCurrentView} />}
      {currentView === "wifi" && <WifiManager />}
      {currentView === "config" && <SystemConfig />}
      <Toaster />
    </AppShell>
  )
}
