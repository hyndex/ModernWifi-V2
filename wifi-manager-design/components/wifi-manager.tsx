"use client"

import { useState, useEffect } from "react"
import { Wifi, Lock, Unlock, RefreshCw, Signal, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Network {
  ssid: string
  rssi: number
  secure: boolean
  channel: number
  bssid: string
}

export function WifiManager() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [password, setPassword] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const { toast } = useToast()

  // Simulate scanning on mount
  useEffect(() => {
    handleScan()
  }, [])

  const handleScan = () => {
    setIsScanning(true)
    setNetworks([]) // Clear list while scanning

    // Simulate scan delay and results
    setTimeout(() => {
      const mockNetworks: Network[] = [
        { ssid: "Home_Office_5G", rssi: -45, secure: true, channel: 6, bssid: "00:11:22:33:44:55" },
        { ssid: "Guest_Network", rssi: -65, secure: true, channel: 1, bssid: "AA:BB:CC:DD:EE:FF" },
        { ssid: "IoT_Devices", rssi: -72, secure: true, channel: 11, bssid: "11:22:33:44:55:66" },
        { ssid: "Free_Wifi_Zone", rssi: -80, secure: false, channel: 6, bssid: "22:33:44:55:66:77" },
        { ssid: "Neighbor_Net", rssi: -88, secure: true, channel: 3, bssid: "33:44:55:66:77:88" },
        { ssid: "Hidden_Lab", rssi: -55, secure: true, channel: 9, bssid: "44:55:66:77:88:99" },
      ]
      setNetworks(mockNetworks)
      setIsScanning(false)
      toast({
        title: "Scan Complete",
        description: `Found ${mockNetworks.length} networks nearby.`,
      })
    }, 2500)
  }

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network)
    if (network.secure) {
      setPassword("")
      setShowPasswordDialog(true)
    } else {
      // Connect directly if open
      connectToNetwork(network)
    }
  }

  const connectToNetwork = (network: Network, pwd?: string) => {
    setIsConnecting(true)
    setShowPasswordDialog(false)

    // Simulate connection attempt
    setTimeout(() => {
      setIsConnecting(false)
      const success = Math.random() > 0.2 // 80% success rate

      if (success) {
        toast({
          title: "Connected Successfully",
          description: `Device is now connected to ${network.ssid}`,
          variant: "default",
          className: "bg-green-500 text-white border-green-600",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: "Could not connect. Check password and signal strength.",
          variant: "destructive",
        })
      }
    }, 2000)
  }

  const getSignalStrength = (rssi: number) => {
    if (rssi > -50) return { color: "text-green-500", bars: 4, text: "Excellent" }
    if (rssi > -70) return { color: "text-yellow-500", bars: 3, text: "Good" }
    if (rssi > -80) return { color: "text-orange-500", bars: 2, text: "Fair" }
    return { color: "text-red-500", bars: 1, text: "Poor" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WiFi Manager</h2>
          <p className="text-muted-foreground text-sm">Scan and connect to local networks</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleScan}
          disabled={isScanning}
          className={isScanning ? "animate-spin" : ""}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Scanning State */}
        {isScanning && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Wifi className="h-6 w-6" />
                </div>
              </div>
              <p className="font-medium animate-pulse text-primary">Scanning for networks...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isScanning && networks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi className="h-12 w-12 opacity-20 mb-4" />
              <p>No networks found. Try scanning again.</p>
              <Button variant="link" onClick={handleScan}>
                Scan Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Network List */}
        {!isScanning && networks.length > 0 && (
          <div className="grid gap-3">
            {networks.map((net) => {
              const signal = getSignalStrength(net.rssi)

              return (
                <button
                  key={net.bssid}
                  onClick={() => handleNetworkSelect(net)}
                  disabled={isConnecting}
                  className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/50 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    {/* Signal Icon */}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 ring-1 ring-border ${signal.color}`}
                    >
                      <Signal className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="font-semibold leading-none flex items-center gap-2">
                        {net.ssid}
                        {net.rssi > -60 && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">
                            5G
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Ch {net.channel}</span>
                        <span>•</span>
                        <span className={signal.color}>
                          {signal.text} ({net.rssi} dBm)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {net.secure ? (
                      <Lock className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-500/70" />
                    )}
                    <div className="hidden sm:block opacity-0 transition-opacity group-hover:opacity-100">
                      <Badge variant="outline">Connect</Badge>
                    </div>
                  </div>

                  {/* Connecting Overlay */}
                  {isConnecting && selectedNetwork?.bssid === net.bssid && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Connecting...
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Manual Add Network Button (Optional, can be added later) */}
      <Button variant="ghost" className="w-full text-muted-foreground">
        + Add Hidden Network
      </Button>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to "{selectedNetwork?.ssid}"</DialogTitle>
            <DialogDescription>This network is secured. Please enter the password to connect.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter WiFi Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4" />
              <p>Passwords are case-sensitive. Check your router label.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedNetwork && connectToNetwork(selectedNetwork, password)} disabled={!password}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
