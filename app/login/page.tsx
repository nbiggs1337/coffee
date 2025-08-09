"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Please enter your email address.")
      toast({
        title: "⚠️ Missing Email",
        description: "Please enter your email address to continue.",
        variant: "destructive",
      })
      return
    }

    if (!password) {
      setError("Please enter your password.")
      toast({
        title: "⚠️ Missing Password",
        description: "Please enter your password to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      toast({
        title: "🔐 Signing In...",
        description: "Please wait while we verify your credentials.",
        className: "neobrutal-card bg-neobrutal-blue text-white border-neobrutal-primary",
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        let errorMessage = "Invalid email or password."

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and click the verification link before signing in."
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please wait a moment and try again."
        }

        setError(errorMessage)
        toast({
          title: "❌ Sign In Failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        toast({
          title: "✅ Welcome Back!",
          description: "You have been signed in successfully.",
          className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
        })

        // Small delay to show success message
        setTimeout(() => {
          router.push("/feed")
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast({
        title: "❌ Sign In Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neobrutal-bg p-4">
      <Card className="w-full max-w-md neobrutal-card bg-white border-neobrutal-primary shadow-neobrutal">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-neobrutal-primary flex items-center justify-center">
            <LogIn className="mr-2 h-8 w-8" />
            Sign In
          </CardTitle>
          <CardDescription className="text-gray-600">Welcome back! Please sign in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="neobrutal-card border-neobrutal-red">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neobrutal-primary font-semibold flex items-center">
                <Mail className="mr-1 h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="neobrutal-input"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neobrutal-primary font-semibold flex items-center">
                <Lock className="mr-1 h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="neobrutal-input"
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full neobrutal-button bg-neobrutal-blue text-white hover:bg-blue-600 text-lg py-3"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-neobrutal-blue hover:text-blue-600 font-semibold underline">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
