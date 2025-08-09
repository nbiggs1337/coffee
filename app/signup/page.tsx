"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Mail, Lock, User, AlertCircle, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError("Please enter your email address.")
      return false
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.")
      return false
    }

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      toast({
        title: "⚠️ Validation Error",
        description: error,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      toast({
        title: "📝 Creating Account...",
        description: "Please wait while we set up your account.",
        className: "neobrutal-card bg-neobrutal-blue text-white border-neobrutal-primary",
      })

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          },
        },
      })

      if (error) {
        let errorMessage = "Failed to create account. Please try again."

        if (error.message.includes("already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead."
        } else if (error.message.includes("Password")) {
          errorMessage = "Password is too weak. Please choose a stronger password."
        } else if (error.message.includes("Email")) {
          errorMessage = "Please enter a valid email address."
        }

        setError(errorMessage)
        toast({
          title: "❌ Signup Failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        toast({
          title: "🎉 Account Created!",
          description: "Please check your email to verify your account, then complete your profile.",
          className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
        })

        // Redirect to agreement page
        setTimeout(() => {
          router.push("/agreement")
        }, 2000)
      }
    } catch (error) {
      console.error("Signup error:", error)
      const errorMessage = "An unexpected error occurred. Please try again."
      setError(errorMessage)
      toast({
        title: "❌ Signup Error",
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
            <UserPlus className="mr-2 h-8 w-8" />
            Sign Up
          </CardTitle>
          <CardDescription className="text-gray-600">Create your account to join our community</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Community Safety Warning */}
          <Alert className="mb-6 neobrutal-card border-neobrutal-yellow bg-yellow-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Community Safety Notice:</strong> Please use your real information. All profiles are manually
              reviewed for community safety before approval.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="neobrutal-card border-neobrutal-red">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-neobrutal-primary font-semibold flex items-center">
                <User className="mr-1 h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="neobrutal-input"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neobrutal-primary font-semibold flex items-center">
                <Mail className="mr-1 h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password (min 6 characters)"
                className="neobrutal-input"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-neobrutal-primary font-semibold flex items-center">
                <Lock className="mr-1 h-4 w-4" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="neobrutal-input"
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full neobrutal-button bg-neobrutal-green text-white hover:bg-green-600 text-lg py-3"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-neobrutal-blue hover:text-blue-600 font-semibold underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
