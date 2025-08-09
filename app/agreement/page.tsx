"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Loader2, Upload, X, FileText } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { uploadFile } from "@/actions/upload"

export default function AgreementPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [fullName, setFullName] = useState("")
  const [verificationPhotoFile, setVerificationPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailFromSignup, setEmailFromSignup] = useState("")
  const [userId, setUserId] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      try {
        console.log("AgreementPage: Initialization started.")

        // Explicitly check for environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error("Supabase environment variables are not configured on the client.")
        }

        const supabase = createClient()
        const emailParam = searchParams.get("email")
        let finalEmail: string | null = emailParam

        // Step 1: Get the authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.warn("Auth error during initialization:", authError.message)
        }

        if (!isMounted) return

        // Use the authenticated user's email if available and no param is set
        if (user?.email && !finalEmail) {
          finalEmail = user.email
        }

        // If still no email, we cannot proceed.
        if (!finalEmail) {
          toast({
            title: "Session Expired",
            description: "Please log in to continue.",
            variant: "destructive",
          })
          router.replace("/login")
          return
        }

        setEmailFromSignup(finalEmail)

        // Step 2: Fetch the corresponding profile from the database
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id, full_name, verification_photo_url, agreed_to_terms")
          .eq("email", finalEmail)
          .maybeSingle()

        if (profileError) {
          // This is not a fatal error, the profile might not exist yet.
          console.warn("Could not fetch profile:", profileError.message)
        }

        if (!isMounted) return

        // Step 3: Check if the user has already completed the agreement
        if (profile?.agreed_to_terms && profile?.full_name && profile?.verification_photo_url) {
          toast({ title: "Profile already complete", description: "Redirecting..." })
          router.replace(`/pending?email=${encodeURIComponent(finalEmail)}`)
          return
        }

        // Step 4: Pre-fill the form with existing data
        if (profile) {
          setUserId(profile.id)
          setFullName(profile.full_name || "")
          setPhotoPreview(profile.verification_photo_url || null)
        } else if (user) {
          // If no profile exists yet, but we have an auth user, use their ID.
          setUserId(user.id)
        }
      } catch (error: any) {
        console.error("CRITICAL ERROR in AgreementPage initialization:", error)
        if (isMounted) {
          toast({
            title: "A critical error occurred",
            description: error.message || "Please refresh the page.",
            variant: "destructive",
          })
        }
      } finally {
        // This block is guaranteed to run, ending the loading state.
        if (isMounted) {
          console.log("AgreementPage: Initialization finished.")
          setIsLoading(false)
        }
      }
    }

    initializePage()

    return () => {
      isMounted = false
    }
  }, []) // Empty array ensures this effect runs only once.

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" })
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setVerificationPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview((ev.target?.result as string) ?? null)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setVerificationPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" })
      return
    }
    if (!verificationPhotoFile && !photoPreview) {
      toast({ title: "Photo required", description: "Please upload a verification photo.", variant: "destructive" })
      return
    }
    if (!agreedToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      })
      return
    }

    if (!userId || !emailFromSignup) {
      toast({
        title: "Session Error",
        description: "User information is missing. Please log in again.",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)
    try {
      let photoUrl = photoPreview || ""
      if (verificationPhotoFile) {
        setIsUploading(true)
        try {
          const formData = new FormData()
          formData.append("file", verificationPhotoFile)
          const uploadResult = await uploadFile(formData, "verification-photos", `users/${userId}`)
          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.message || "Photo upload failed.")
          }
          photoUrl = uploadResult.url
        } finally {
          setIsUploading(false)
        }
      }

      const supabase = createClient()
      const { error: upsertError } = await supabase.from("users").upsert({
        id: userId,
        email: emailFromSignup,
        full_name: fullName.trim(),
        verification_photo_url: photoUrl,
        agreed_to_terms: true,
        is_approved: emailFromSignup === "nbiggs1337@gmail.com",
        is_admin: emailFromSignup === "nbiggs1337@gmail.com",
        is_rejected: false,
        updated_at: new Date().toISOString(),
      })

      if (upsertError) throw upsertError

      toast({
        title: "Profile Completed",
        description: "Your information has been saved. Redirecting...",
      })
      router.push(`/pending?email=${encodeURIComponent(emailFromSignup)}`)
    } catch (err: any) {
      console.error("Submit error:", err)
      toast({
        title: "Submission Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-neobrutal-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-neobrutal-primary mx-auto mb-4" />
          <p className="text-lg text-neobrutal-secondary">Loading Your Profile...</p>
        </div>
      </div>
    )
  }

  const canSubmit =
    !!fullName.trim() && (verificationPhotoFile || photoPreview) && agreedToTerms && !isSubmitting && !isUploading

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
      <Card className="w-full max-w-2xl neobrutal-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neobrutal-primary text-center">Complete Your Profile</CardTitle>
          {emailFromSignup && (
            <p className="text-sm text-neobrutal-secondary text-center">Complete your profile for {emailFromSignup}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fullName" className="block text-sm font-bold text-neobrutal-primary mb-2">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="neobrutal-input w-full"
                required
              />
            </div>

            <div>
              <Label className="block text-sm font-bold text-neobrutal-primary mb-2">Verification Photo *</Label>
              <p className="text-xs text-neobrutal-secondary mb-3">Upload a clear photo for verification. Max 5MB.</p>

              {!photoPreview ? (
                <div className="border-4 border-dashed border-neobrutal-primary rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="verification-photo"
                  />
                  <Camera className="mx-auto h-12 w-12 text-neobrutal-secondary mb-4" />
                  <p className="text-neobrutal-secondary mb-4">Upload your photo</p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="neobrutal-button bg-neobrutal-blue"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Select Photo
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Image
                    src={photoPreview || "/placeholder.svg"}
                    alt="Verification photo preview"
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover rounded-lg border-4 border-neobrutal-primary"
                  />
                  <Button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 neobrutal-button bg-neobrutal-red p-2"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-neobrutal-yellow p-4 rounded border-2 border-neobrutal-primary">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-neobrutal-primary flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Terms and Conditions
                </h3>
                <Button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="neobrutal-button bg-neobrutal-blue text-white text-xs px-3 py-1"
                >
                  {showTerms ? "Hide" : "Read"} Terms
                </Button>
              </div>

              {showTerms && (
                <div className="bg-white p-4 rounded border-2 border-neobrutal-primary mb-4 max-h-60 overflow-y-auto">
                  <div className="text-sm text-neobrutal-primary space-y-3">
                    <h4 className="font-bold">Coffee Community Safety Platform - Terms of Service</h4>
                    <p>
                      1. Acceptance of Terms: By using Coffee, you agree to these terms and our community guidelines.
                    </p>
                    <p>
                      2. Community Purpose: Coffee is for sharing safety information. All content should serve this
                      purpose.
                    </p>
                    <p>
                      3. Account Verification: All accounts require admin approval. You must provide accurate
                      information.
                    </p>
                    <p>
                      4. Content Guidelines: No harassment, discrimination, or inappropriate content. Respect privacy.
                    </p>
                    <p>5. Privacy: Your verification photo is only visible to administrators.</p>
                    <p>6. Prohibited Activities: No false information or illegal activities.</p>
                    <p>7. Consequences: Violations may result in content removal or account suspension.</p>
                    <p>8. Disclaimer: We don't guarantee the accuracy of user-generated content.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms-agreement" className="text-sm text-neobrutal-primary cursor-pointer">
                  I have read and agree to the Terms and Conditions and Community Guidelines. I understand that my
                  account will be reviewed for approval by an administrator.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full neobrutal-button bg-neobrutal-green text-white font-bold py-3 disabled:opacity-70"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Complete Profile & Submit for Approval"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neobrutal-secondary">
              After completing your profile, verify your email and{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-neobrutal-blue hover:underline neobrutal-link"
              >
                log in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
