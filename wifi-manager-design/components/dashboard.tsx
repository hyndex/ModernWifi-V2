"use client"

import { Activity, Wifi, Signal, Clock, Server, ArrowUpRight, Cpu } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { ViewState } from "@/app/page"

export function Dashboard({ onViewChange }: { onViewChange: (view: ViewState) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">System Status</h2>
        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
          Online
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Connection Status Card */}
        <Card className="col-span-full bg-gradient-to-br from-card to-card/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network Connection</CardTitle>
            <Wifi className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-bold">Home_Office_5G</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">192.168.1.142</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-500 flex items-center gap-1 justify-end">
                  <Signal className="h-4 w-4" />
                  -62 dBm
                </div>
                <div className="text-xs text-muted-foreground">Signal Strength</div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button size="sm" onClick={() => onViewChange("wifi")} className="flex-1">
                Manage Networks
              </Button>
              <Button size="sm" variant="outline" onClick={() => onViewChange("config")} className="flex-1">
                Configure IP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Uptime Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12h 45m</div>
            <p className="text-xs text-muted-foreground">Since last boot</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-full animate-pulse bg-primary/50" />
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memory (Heap)</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142 KB</div>
            <div className="mt-4 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Free: 45%</span>
              <span className="text-muted-foreground">Total: 320 KB</span>
            </div>
            <Progress value={55} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        {/* CPU/Temp */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPU Core</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">240 MHz</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" /> 42°C
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Transfer</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold">1.2 MB</div>
                <p className="text-xs text-muted-foreground">Total sent</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">4.8 MB</div>
                <p className="text-xs text-muted-foreground">Total received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Info Footer */}
      <div className="rounded-lg border border-border/50 bg-card/30 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Device Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm font-mono sm:grid-cols-4">
          <div>
            <div className="text-muted-foreground text-[10px]">MAC Address</div>
            <div>A0:B1:C2:D3:E4:F5</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px]">Chip ID</div>
            <div>ESP32-D0WDQ6</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px]">SDK Version</div>
            <div>v4.4.1</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px]">Serial Number</div>
            <div>SN-99821-X2</div>
          </div>
        </div>
      </div>
    </div>
  )
}
