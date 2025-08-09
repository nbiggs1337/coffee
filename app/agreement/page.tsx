"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { uploadFile } from "@/actions/upload"
import type { User } from "@/lib/types"
import Image from "next/image"

export default function AgreementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [verificationPhoto, setVerificationPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    console.log("AgreementPage: useEffect started.")

    async function fetchUserAndProfile() {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw new Error(`Session Error: ${sessionError.message}`)
        if (!session) {
          console.log("AgreementPage: No active session, redirecting to login.")
          router.replace("/login")
          return
        }
        console.log("AgreementPage: Session found for user:", session.user.id)
        setSessionUserId(session.user.id)

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw new Error(`Profile Error: ${profileError.message}`)
        }

        if (isMounted) {
          if (profile) {
            console.log("AgreementPage: User profile found.", profile)
            setUser(profile)
            if (profile.agreed_to_terms) {
              console.log("AgreementPage: User has already agreed to terms, redirecting to feed.")
              router.replace("/feed")
              return
            }
            setDisplayName(profile.display_name || profile.full_name || "")
          } else {
            console.log("AgreementPage: No profile found for this user yet.")
            // This is a new user, which is expected.
          }
        }
      } catch (err: any) {
        console.error("AgreementPage: Error in useEffect:", err)
        if (isMounted) {
          setError("Failed to load your profile. Please try logging in again.")
          toast({
            title: "Error",
            description: err.message || "Could not load user data.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          console.log("AgreementPage: useEffect finished, setting isLoading to false.")
          setIsLoading(false)
        }
      }
    }

    fetchUserAndProfile()

    return () => {
      console.log("AgreementPage: Component unmounted.")
      isMounted = false
    }
  }, [router, toast])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVerificationPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionUserId) {
      toast({ title: "Error", description: "Your session has expired. Please log in again.", variant: "destructive" })
      return
    }
    if (!verificationPhoto) {
      toast({ title: "Missing Photo", description: "Please upload a verification photo.", variant: "destructive" })
      return
    }
    if (!agreedToTerms) {
      toast({
        title: "Terms not accepted",
        description: "You must agree to the terms and conditions.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("file", verificationPhoto)
      formData.append("userId", sessionUserId) // Pass the user ID in the form data

      const uploadResult = await uploadFile(formData, "verification-photos")

      if (!uploadResult.success || !uploadResult.url) {
        toast({ title: "Upload Failed", description: uploadResult.message, variant: "destructive" })
        return
      }

      toast({ title: "Upload Successful", description: "Your photo has been uploaded." })

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          verification_photo_url: uploadResult.url,
          agreed_to_terms: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionUserId)

      if (updateError) {
        toast({
          title: "Update Failed",
          description: `Could not save your agreement. ${updateError.message}`,
          variant: "destructive",
        })
        return
      }

      toast({ title: "Agreement Complete!", description: "Your account is now pending approval." })
      router.push("/pending")
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading your agreement...</p>
          <p className="text-sm text-gray-500">Please wait a moment.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/login")} className="w-full">
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Community Agreement</CardTitle>
          <CardDescription>
            To ensure community safety, please provide a real name and a clear verification photo of yourself.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Enter your full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationPhoto">Verification Photo</Label>
              <Input id="verificationPhoto" type="file" accept="image/*" onChange={handlePhotoChange} required />
              {photoPreview && (
                <div className="mt-4">
                  <Image
                    src={photoPreview || "/placeholder.svg"}
                    alt="Photo preview"
                    width={150}
                    height={150}
                    className="rounded-md object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions.
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
