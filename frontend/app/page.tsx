"use client"

import { useEffect, useState } from "react"
import { Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { toast } from "sonner"
import { AuthService } from "@/lib/services"
import { useRouter } from "next/navigation"

type AuthStep = "email" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<AuthStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

  // Redirect to /home if already authenticated
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token) {
      router.replace("/home")
    }
  }, [router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !email) return
    setIsLoading(true)

    try {
      await AuthService.requestOtp(email)
      setStep("otp")
      toast.success(`OTP sent to ${email}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || "Could not send OTP.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || otp.length < 6) return
    setIsLoading(true)

    try {
      const res = await AuthService.verifyOtp(email, otp)

      if (res?.access || res?.tokens?.access) {
        const access = res.access || res.tokens.access
        const refresh = res.refresh || res.tokens?.refresh
        localStorage.setItem("access_token", access)
        if (refresh) {
          localStorage.setItem("refresh_token", refresh)
        }
        // Store user object for profile / header use
        if (res?.user) {
          localStorage.setItem("user", JSON.stringify(res.user))
        }
      }

      toast.success("Successfully authenticated!")
      router.push("/home")
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || "Invalid OTP code.")
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="text-2xl font-bold text-primary-foreground">V</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {step === "email" ? "Welcome to Velvet" : "Check your email"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {step === "email"
              ? "Enter your email to get a one-time code"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 p-8 shadow-2xl backdrop-blur-xl dark:border-white/5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="h-12 border-white/10 bg-background/50 pl-10 transition-all focus-visible:ring-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-green-600 text-base font-semibold text-white transition-colors hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="flex flex-col items-center space-y-6">
              <div className="flex w-full justify-center space-y-2">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-1 sm:gap-2">
                    <InputOTPSlot index={0} className="size-10 rounded-md border-white/10 bg-background/50 text-lg sm:size-12" />
                    <InputOTPSlot index={1} className="size-10 rounded-md border-white/10 bg-background/50 text-lg sm:size-12" />
                    <InputOTPSlot index={2} className="size-10 rounded-md border-white/10 bg-background/50 text-lg sm:size-12" />
                    <InputOTPSlot index={3} className="size-10 rounded-md border-white/10 bg-background/50 text-lg sm:size-12" />
                    <InputOTPSlot index={4} className="size-10 rounded-md border-white/10 bg-background/50 text-lg sm:size-12" />
                    <InputOTPSlot index={5} className="size-10 rounded-md border-white/10 bg-background/50 text-lg sm:size-12" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                className="mt-4 h-12 w-full bg-green-600 text-base font-semibold text-white transition-colors hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="size-5 animate-spin" /> : "Verify Code"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setOtp("")
                }}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}
