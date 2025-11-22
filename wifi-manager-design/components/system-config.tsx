"use client"

import { useState } from "react"
import { Save, RotateCcw, Trash2, Upload, Server, Globe, Shield, Radio, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export function SystemConfig() {
  const { toast } = useToast()
  const [isRebooting, setIsRebooting] = useState(false)

  const handleSave = (section: string) => {
    toast({
      title: "Settings Saved",
      description: `${section} configuration has been updated successfully.`,
    })
  }

  const handleReboot = () => {
    if (confirm("Are you sure you want to reboot the device?")) {
      setIsRebooting(true)
      toast({
        title: "Rebooting...",
        description: "Device is restarting. Please wait.",
      })
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }
  }

  const handleReset = () => {
    if (confirm("WARNING: This will erase all settings. Continue?")) {
      toast({
        variant: "destructive",
        title: "Factory Reset Initiated",
        description: "Restoring default settings...",
      })
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground text-sm">Manage advanced device settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="mqtt">MQTT</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Device Identity
              </CardTitle>
              <CardDescription>Set the device name and hostname for the network.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input id="device-name" defaultValue="ESP32-S3-PRO" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hostname">Hostname</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">http://</span>
                  <Input id="hostname" defaultValue="esp32-manager" className="font-mono" />
                  <span className="text-muted-foreground text-sm">.local</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={() => handleSave("Device")} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                AP Mode Settings
              </CardTitle>
              <CardDescription>Configure the fallback Access Point.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ap-ssid">AP SSID</Label>
                <Input id="ap-ssid" defaultValue="ESP32_Setup_A1" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ap-pass">AP Password</Label>
                <Input id="ap-pass" type="password" defaultValue="12345678" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Hide SSID</Label>
                  <p className="text-xs text-muted-foreground">Make AP invisible to scanners</p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={() => handleSave("AP Mode")} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Network Settings */}
        <TabsContent value="network" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                IP Configuration
              </CardTitle>
              <CardDescription>Manage static IP and DHCP settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-accent/20">
                <div className="space-y-0.5">
                  <Label className="text-base">DHCP Client</Label>
                  <p className="text-xs text-muted-foreground">Automatically obtain IP address</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Static IP</Label>
                    <Input placeholder="192.168.1.100" className="font-mono" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Gateway</Label>
                    <Input placeholder="192.168.1.1" className="font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Subnet Mask</Label>
                    <Input placeholder="255.255.255.0" className="font-mono" />
                  </div>
                  <div className="grid gap-2">
                    <Label>DNS Server</Label>
                    <Input placeholder="8.8.8.8" className="font-mono" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={() => handleSave("Network")} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* MQTT Settings */}
        <TabsContent value="mqtt" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                MQTT Broker
              </CardTitle>
              <CardDescription>Connect to an MQTT broker for remote control.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label>Enable MQTT</Label>
                <Switch />
              </div>
              <div className="grid gap-2">
                <Label>Broker Address</Label>
                <Input placeholder="mqtt.example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Port</Label>
                  <Input placeholder="1883" type="number" />
                </div>
                <div className="grid gap-2">
                  <Label>Client ID</Label>
                  <Input placeholder="ESP32_Client_01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <Input placeholder="Optional" />
                </div>
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Optional" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={() => handleSave("MQTT")} className="ml-auto">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Admin Tools */}
        <TabsContent value="admin" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Access
              </CardTitle>
              <CardDescription>Change the administrator password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Current Password</Label>
                <Input type="password" />
              </div>
              <div className="grid gap-2">
                <Label>New Password</Label>
                <Input type="password" />
              </div>
              <div className="grid gap-2">
                <Label>Confirm New Password</Label>
                <Input type="password" />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <Button onClick={() => handleSave("Security")} className="ml-auto">
                Update Password
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Firmware Update (OTA)
              </CardTitle>
              <CardDescription>Upload a .bin file to update the device firmware.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-muted-foreground/25"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">FIRMWARE.BIN (MAX 4MB)</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Restart Device</div>
                  <div className="text-xs text-muted-foreground">Reboot the system immediately</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleReboot} disabled={isRebooting}>
                  {isRebooting ? (
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Reboot
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-destructive">Factory Reset</div>
                  <div className="text-xs text-muted-foreground">Wipe all data and config</div>
                </div>
                <Button variant="destructive" size="sm" onClick={handleReset}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
