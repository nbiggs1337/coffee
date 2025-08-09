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

  // Load user data on mount - avoid auth calls that might fail
  useEffect(() => {
    async function loadUser() {
      try {
        // Get email from URL params (from signup redirect)
        const emailParam = searchParams.get("email")

        if (emailParam) {
          setEmailFromSignup(emailParam)
        } else {
          // Fallback: try to get email from current auth session
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser()
            if (user?.email) {
              setEmailFromSignup(user.email)
              console.log("Using email from auth session:", user.email)
            } else {
              console.log("No email found in URL params or auth session")
            }
          } catch (authError) {
            console.log("Auth error when trying to get user email:", authError)
          }
        }

        // Continue with existing user lookup logic...
        const emailToUse = emailParam || emailFromSignup
        if (emailToUse) {
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("email", emailToUse)
              .single()

            if (!userError && userData) {
              setTempUserId(userData.id)

              if (userData.agreed_to_terms && userData.full_name && userData.verification_photo_url) {
                router.push(`/pending?email=${encodeURIComponent(emailToUse)}`)
                return
              }

              setFullName(userData.full_name || "")
              if (userData.verification_photo_url) {
                setPhotoPreview(userData.verification_photo_url)
              }
            }
          } catch (dbError) {
            console.log("Database lookup error (non-fatal):", dbError)
          }
        }
      } catch (error) {
        console.log("Load user error (non-fatal):", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [supabase, searchParams, router, emailFromSignup])

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ;(async () => {
      // Validate required fields
      if (!fullName.trim()) {
        toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" })
        return
      }

      if (!verificationPhotoFile && !photoPreview) {
        toast({
          title: "Photo required",
          description: "Please upload a verification photo.",
          variant: "destructive",
        })
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
        // Always try to resolve the real authenticated user first
        let authUserId: string | undefined
        let authEmail: string | undefined
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          authUserId = user?.id
          authEmail = user?.email || undefined
        } catch {
          // ignore – we’ll fallback to email lookup
        }

        // Determine email to use
        const emailToUse = (authEmail || emailFromSignup || "").trim()
        if (!emailToUse) {
          toast({
            title: "Session Error",
            description: "Please log in to complete your profile.",
            variant: "destructive",
          })
          router.push("/login")
          setIsSubmitting(false)
          return
        }

        // Resolve the target user id – prefer auth user id, then any temp id previously loaded, then lookup by email
        let userIdToUse = authUserId || tempUserId
        if (!userIdToUse) {
          const { data: existingUser, error: lookupErr } = await supabase
            .from("users")
            .select("id")
            .eq("email", emailToUse)
            .maybeSingle()
          if (lookupErr) {
            // not fatal; we continue only if we got an id
            console.log("User lookup by email failed (non-fatal):", lookupErr)
          }
          if (existingUser?.id) {
            userIdToUse = existingUser.id
          }
        }

        // If we still do not have a deterministic user id, we should not create a random row.
        if (!userIdToUse) {
          toast({
            title: "Session Error",
            description: "Please log in to complete your profile.",
            variant: "destructive",
          })
          router.push("/login")
          setIsSubmitting(false)
          return
        }

        // Upload verification photo if needed
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
          } catch (err: any) {
            toast({ title: "Upload Failed", description: err?.message || "Upload error.", variant: "destructive" })
            setIsUploading(false)
            setIsSubmitting(false)
            return
          } finally {
            setIsUploading(false)
          }
        }

        // Upsert the same, real user row. Never generate a new UUID.
        const payload = {
          id: userIdToUse,
          email: emailToUse,
          full_name: fullName.trim(),
          verification_photo_url: photoUrl,
          agreed_to_terms: true,
          // Keep existing admin auto-approval by email, if needed
          is_approved: emailToUse === "nbiggs1337@gmail.com",
          is_admin: emailToUse === "nbiggs1337@gmail.com",
          is_rejected: false,
          updated_at: new Date().toISOString(),
        }

        const { error: upsertError } = await supabase.from("users").upsert(payload)

        if (upsertError) {
          throw new Error(upsertError.message)
        }

        toast({
          title: "Profile Completed",
          description: "Your information has been saved. Redirecting to pending approval...",
        })

        setTimeout(() => {
          router.push(`/pending?email=${encodeURIComponent(emailToUse)}`)
        }, 1500)
      } catch (err: any) {
        console.error("Save error:", err)
        toast({ title: "Save Failed", description: err?.message || "Unexpected error.", variant: "destructive" })
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-neobrutal-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-neobrutal-primary mx-auto mb-4" />
          <p className="text-neobrutal-secondary">Loading...</p>
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

            {/* Terms and Conditions Section */}
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

                    <div>
                      <h5 className="font-semibold">1. Acceptance of Terms</h5>
                      <p>
                        By using Coffee, you agree to these terms and our community guidelines. These terms may be
                        updated periodically.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">2. Community Purpose</h5>
                      <p>
                        Coffee is designed to help community members share safety information and stay informed about
                        local activities. All content should serve this purpose.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">3. Account Verification</h5>
                      <p>
                        All accounts require admin approval. You must provide accurate information and a clear
                        verification photo. False information may result in account rejection.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">4. Content Guidelines</h5>
                      <p>
                        • Share only factual, helpful safety information
                        <br />• Respect privacy and avoid sharing personal details without consent
                        <br />• No harassment, discrimination, or inappropriate content
                        <br />• No spam or commercial promotion
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">5. Privacy</h5>
                      <p>
                        We protect your personal information and only share what's necessary for community safety. Your
                        verification photo is only visible to administrators.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">6. Prohibited Activities</h5>
                      <p>
                        • Posting false or misleading information
                        <br />• Using the platform for illegal activities
                        <br />• Attempting to circumvent security measures
                        <br />• Creating multiple accounts
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">7. Consequences</h5>
                      <p>
                        Violations may result in content removal, account suspension, or permanent ban. Serious
                        violations may be reported to authorities.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">8. Disclaimer</h5>
                      <p>
                        Coffee is a community platform. We don't guarantee the accuracy of user-generated content.
                        Always verify important information independently.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-semibold">9. Contact</h5>
                      <p>Questions about these terms? Contact our administrators through the platform.</p>
                    </div>
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
