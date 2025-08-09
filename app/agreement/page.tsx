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
  const [tempUserId, setTempUserId] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true // Flag to prevent state updates on unmounted component

    const loadInitialData = async () => {
      console.log("AgreementPage: Starting to load initial data.")
      try {
        const emailParam = searchParams.get("email")
        let emailToUse = emailParam

        // 1. Determine the user's email
        if (!emailToUse) {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser()
          if (authError) {
            console.error("Auth error on agreement page:", authError.message)
            // Don't throw, maybe we can still find a user
          }
          emailToUse = user?.email || null
        }

        if (!isMounted) return

        // 2. If no email, we can't proceed. Redirect to login.
        if (!emailToUse) {
          console.log("AgreementPage: No email found. Redirecting to login.")
          toast({
            title: "Session not found",
            description: "Please log in or sign up to continue.",
            variant: "destructive",
          })
          router.replace("/login")
          return // Stop execution
        }

        setEmailFromSignup(emailToUse)

        // 3. Fetch user profile from the database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, verification_photo_url, agreed_to_terms")
          .eq("email", emailToUse)
          .maybeSingle()

        if (!isMounted) return

        if (userError) {
          console.error("Error fetching user profile:", userError.message)
          // This is not fatal, maybe the user row doesn't exist yet.
        }

        // 4. If user data exists, populate the form or redirect if already completed
        if (userData) {
          console.log("AgreementPage: Found existing user data.")
          // If profile is fully complete, redirect to pending page
          if (userData.agreed_to_terms && userData.full_name && userData.verification_photo_url) {
            console.log("AgreementPage: Profile complete. Redirecting to pending.")
            router.replace(`/pending?email=${encodeURIComponent(emailToUse)}`)
            return // Stop execution
          }
          // Otherwise, pre-fill the form
          setTempUserId(userData.id)
          setFullName(userData.full_name || "")
          if (userData.verification_photo_url) {
            setPhotoPreview(userData.verification_photo_url)
          }
        } else {
          console.log("AgreementPage: No existing user data found for this email.")
        }
      } catch (error) {
        console.error("An unexpected error occurred during initial data load:", error)
        if (isMounted) {
          toast({
            title: "An unexpected error occurred",
            description: "Please refresh the page and try again.",
            variant: "destructive",
          })
        }
      } finally {
        // 5. This is the crucial part: always stop loading if the component is still mounted.
        if (isMounted) {
          console.log("AgreementPage: Finished loading data. Setting isLoading to false.")
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    // Cleanup function to set the flag when the component unmounts
    return () => {
      isMounted = false
      console.log("AgreementPage: Component unmounted.")
    }
  }, []) // <-- Empty dependency array ensures this runs ONLY ONCE.

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
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

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const emailToUse = user?.email || emailFromSignup
      const userIdToUse = user?.id || tempUserId

      if (!userIdToUse || !emailToUse) {
        toast({
          title: "Session Error",
          description: "Could not find user. Please log in again.",
          variant: "destructive",
        })
        router.push("/login")
        setIsSubmitting(false)
        return
      }

      let photoUrl = photoPreview || ""
      if (verificationPhotoFile) {
        setIsUploading(true)
        try {
          const formData = new FormData()
          formData.append("file", verificationPhotoFile)
          const uploadResult = await uploadFile(formData, "verification-photos", `users/${userIdToUse}`)
          if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.message || "Upload failed.")
          }
          photoUrl = uploadResult.url
        } finally {
          setIsUploading(false)
        }
      }

      const { error: upsertError } = await supabase.from("users").upsert({
        id: userIdToUse,
        email: emailToUse,
        full_name: fullName.trim(),
        verification_photo_url: photoUrl,
        agreed_to_terms: true,
        is_approved: emailToUse === "nbiggs1337@gmail.com",
        is_admin: emailToUse === "nbiggs1337@gmail.com",
        is_rejected: false,
        updated_at: new Date().toISOString(),
      })

      if (upsertError) throw upsertError

      toast({
        title: "Profile Completed",
        description: "Your information has been saved. Redirecting...",
      })
      router.push(`/pending?email=${encodeURIComponent(emailToUse)}`)
    } catch (err: any) {
      console.error("Save error:", err)
      toast({
        title: "Save Failed",
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
