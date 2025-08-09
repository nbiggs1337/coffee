"use client"

import { CardFooter } from "@/components/ui/card"
import type React from "react"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Camera, FileText, Loader2, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { fileToDataURL, normalizeCameraImageToJpeg } from "@/utils/image-utils"
import { createSignedVerificationUpload } from "@/actions/storage-signed"

export default function AgreementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [isLoading, setIsLoading] = useState(true)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [verificationPhotoFile, setVerificationPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchUserAndProfile() {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw new Error(`Session Error: ${sessionError.message}`)
        if (!session) {
          router.replace("/login")
          return
        }
        setSessionUserId(session.user.id)

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          throw new Error(`Profile Error: ${profileError.message}`)
        }

        if (isMounted && profile) {
          if (profile.agreed_to_terms) {
            router.replace("/feed")
            return
          }
          setFullName(profile.full_name || "")
        }
      } catch (err: any) {
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
          setIsLoading(false)
        }
      }
    }

    fetchUserAndProfile()

    return () => {
      isMounted = false
    }
  }, [router, toast])

  // Cleanup for any blob URLs if created elsewhere (we preview via data URLs here)
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(photoPreview)
        } catch {}
      }
    }
  }, [photoPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    ;(async () => {
      try {
        // Normalize mobile camera captures to JPEG to avoid HEIC issues
        const processed = await normalizeCameraImageToJpeg(file)

        // Size guard (25MB)
        if (processed.size > 25 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 25MB.",
            variant: "destructive",
          })
          return
        }

        // Data URL preview is stable across mobile browsers
        const preview = await fileToDataURL(processed)

        setVerificationPhotoFile(processed)
        setPhotoPreview(preview)
      } catch (err: any) {
        console.error("[Agreement] handleFileChange error:", err)
        toast({
          title: "Image Error",
          description: "We couldn't process this photo. Please try again or choose from your gallery.",
          variant: "destructive",
        })
      }
    })()
  }

  const removePhoto = () => {
    setVerificationPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionUserId) {
      toast({ title: "Error", description: "Your session has expired. Please log in again.", variant: "destructive" })
      return
    }
    if (!verificationPhotoFile) {
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
      try {
        const supabase = createClient()
        const bucket = "verification-photos"

        // 1) Create a signed upload URL on the server
        const signed = await createSignedVerificationUpload(sessionUserId, verificationPhotoFile.name)
        if (!("success" in signed) || !signed.success) {
          toast({
            title: "Upload Error",
            description: ("message" in signed && signed.message) || "Could not prepare secure upload.",
            variant: "destructive",
          })
          return
        }

        // 2) Upload directly from the browser to Supabase Storage via the signed URL
        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .uploadToSignedUrl(signed.path, signed.token, verificationPhotoFile, {
            upsert: false,
            contentType: verificationPhotoFile.type || "image/jpeg",
          })

        if (uploadErr) {
          console.error("[Agreement] uploadToSignedUrl error:", uploadErr)
          toast({
            title: "Upload Failed",
            description: uploadErr.message || "Could not upload your photo. Please try again.",
            variant: "destructive",
          })
          return
        }

        // 3) Get a public URL (assumes bucket is public). If bucket is private, store the path instead,
        //    and generate a signed view URL when admins need to view it.
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(signed.path)
        const photoUrl = urlData.publicUrl

        // 4) Save user profile
        const { error: updateError } = await supabase
          .from("users")
          .update({
            full_name: fullName,
            verification_photo_url: photoUrl, // Or store `signed.path` if bucket is private
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
      } catch (err: any) {
        console.error("[Agreement] Submit error:", err)
        toast({
          title: "Unexpected Error",
          description: err?.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    })
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neobrutal-background">
        <Card className="w-full max-w-md neobrutal-card">
          <CardHeader>
            <CardTitle>An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/login")} className="w-full neobrutal-button bg-neobrutal-blue">
              Return to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
      <Card className="w-full max-w-2xl neobrutal-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neobrutal-primary text-center">Complete Your Profile</CardTitle>
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
              <p className="text-xs text-neobrutal-secondary mb-3">Upload a clear photo for verification. Max 25MB.</p>

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
                  <img
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
                  onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
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
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Complete Profile & Submit for Approval"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
