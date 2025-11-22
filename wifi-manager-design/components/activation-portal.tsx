"use client"

import type React from "react"

import { useState } from "react"
import { Lock, ShieldCheck, Cpu, ArrowRight, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ActivationPortalProps {
  onActivate: () => void
}

export function ActivationPortal({ onActivate }: ActivationPortalProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError("")

    // Simulate verification delay
    setTimeout(() => {
      if (code.length >= 8) {
        onActivate()
      } else {
        setError("Invalid activation code. Please check your device manual.")
        setIsVerifying(false)
      }
    }, 1500)
  }

  const handleSkip = () => {
    // Optional skip for demo purposes or free mode
    if (confirm("Skip activation? Some features may be limited in free mode.")) {
      onActivate()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/50">
            <Cpu className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">ESP32 Manager</h1>
          <p className="mt-2 text-muted-foreground">Secure Hardware Interface v2.4.0</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Device Activation
            </CardTitle>
            <CardDescription>
              Enter the 16-digit serial key found on your hardware packaging or license card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="pl-9 font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                  <>Verifying Identity...</>
                ) : (
                  <>
                    Unlock Device
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border bg-muted/20 pt-6">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              Continue in Evaluation Mode
            </button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card/30 p-3">
            <ShieldCheck className="h-5 w-5 text-primary/70" />
            <span>Secure Boot</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card/30 p-3">
            <Cpu className="h-5 w-5 text-primary/70" />
            <span>Hardware Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}
