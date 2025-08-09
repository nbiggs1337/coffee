"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Camera, MapPin, Phone, UserIcon } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import type { User } from "@/lib/supabase"
import { createPostAction } from "@/actions/posts"

interface CreatePostClientProps {
  user?: User | null
}

export default function CreatePostClient({ user }: CreatePostClientProps) {
  const [formData, setFormData] = useState({
    subject_name: "",
    subject_age: "",
    city: "",
    state: "",
    phone_number: "",
    caption: "",
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Fallback: derive a usable userId on the client if not passed from server for uploads
  const [userId, setUserId] = useState<string | null>(user?.id ?? null)
  const [initializingUser, setInitializingUser] = useState<boolean>(!userId)

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        if (!userId) {
          const { data, error } = await supabase.auth.getUser()
          if (error) {
            console.error("CreatePostClient: auth.getUser error:", error.message)
          }
          const authUser = data?.user
          if (isMounted) {
            if (authUser?.id) {
              setUserId(authUser.id)
            } else {
              router.push("/login")
            }
          }
        }
      } catch (err) {
        console.error("CreatePostClient: unexpected error while getting auth user:", err)
      } finally {
        if (isMounted) setInitializingUser(false)
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [supabase, router, userId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (photos.length + files.length > 6) {
      toast({
        title: "⚠️ Too Many Photos",
        description: "You can upload a maximum of 6 photos per post.",
        variant: "destructive",
      })
      return
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "⚠️ Invalid File Type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        })
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "⚠️ File Too Large",
          description: `${file.name} is larger than 5MB.`,
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setPhotos((prev) => [...prev, ...validFiles])
      toast({
        title: "📸 Photos Added",
        description: `${validFiles.length} photo(s) added successfully.`,
        className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
      })
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    toast({
      title: "🗑️ Photo Removed",
      description: "Photo has been removed from your post.",
      className: "neobrutal-card bg-neobrutal-yellow text-black border-neobrutal-primary",
    })
  }

  const uploadPhotos = async (photosToUpload: File[]): Promise<string[]> => {
    if (!userId) {
      throw new Error("User is not authenticated for photo upload.")
    }
    const uploadedUrls: string[] = []

    for (let i = 0; i < photosToUpload.length; i++) {
      const photo = photosToUpload[i]
      const fileExt = photo.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`

      setUploadProgress(((i + 1) / photosToUpload.length) * 100)

      // Use your configured bucket name
      const { error } = await supabase.storage.from("post-images").upload(fileName, photo)
      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Authentication check for uploads; the Server Action will enforce auth for DB insert
    if (!userId) {
      toast({
        title: "❌ Authentication Error",
        description: "Could not find user data. Please try logging in again.",
        variant: "destructive",
      })
      return
    }

    // Validation
    if (!formData.subject_name.trim()) {
      toast({
        title: "⚠️ Missing Name",
        description: "Please enter the subject's name.",
        variant: "destructive",
      })
      return
    }

    if (
      !formData.subject_age ||
      Number.parseInt(formData.subject_age) < 18 ||
      Number.parseInt(formData.subject_age) > 100
    ) {
      toast({
        title: "⚠️ Invalid Age",
        description: "Please enter a valid age between 18 and 100.",
        variant: "destructive",
      })
      return
    }

    if (!formData.city.trim() || !formData.state.trim()) {
      toast({
        title: "⚠️ Missing Location",
        description: "Please enter both city and state.",
        variant: "destructive",
      })
      return
    }

    if (!formData.caption.trim()) {
      toast({
        title: "⚠️ Missing Caption",
        description: "Please write a caption for your post.",
        variant: "destructive",
      })
      return
    }

    if (formData.caption.length > 1000) {
      toast({
        title: "⚠️ Caption Too Long",
        description: "Caption must be 1000 characters or less.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      toast({
        title: "📤 Creating Post...",
        description: "Please wait while we process your post.",
        className: "neobrutal-card bg-neobrutal-blue text-white border-neobrutal-primary",
      })

      // Upload photos if any
      let photoUrls: string[] = []
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(photos)
      }

      // Create post via Server Action (runs on server with user session; satisfies RLS) [^3][^4]
      const result = await createPostAction({
        subject_name: formData.subject_name.trim(),
        subject_age: Number.parseInt(formData.subject_age),
        city: formData.city.trim(),
        state: formData.state.trim(),
        phone_number: formData.phone_number.trim() || null,
        caption: formData.caption.trim(),
        photos: photoUrls,
      })

      if (!result.success) {
        throw new Error(result.message || "Failed to create post.")
      }

      toast({
        title: "🎉 Post Created!",
        description: "Your post has been published successfully.",
        className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
      })

      router.push("/feed")
      router.refresh()
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "❌ Post Failed",
        description: error?.message || "Unable to create your post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (initializingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading user information...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="neobrutal-card bg-white border-neobrutal-primary shadow-neobrutal">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-neobrutal-primary flex items-center">
            <Camera className="mr-2 h-6 w-6" />
            Create New Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject_name" className="text-neobrutal-primary font-semibold flex items-center">
                  <UserIcon className="mr-1 h-4 w-4" />
                  Subject Name *
                </Label>
                <Input
                  id="subject_name"
                  name="subject_name"
                  value={formData.subject_name}
                  onChange={handleInputChange}
                  placeholder="Enter subject's name"
                  className="neobrutal-input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject_age" className="text-neobrutal-primary font-semibold">
                  Age *
                </Label>
                <Input
                  id="subject_age"
                  name="subject_age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.subject_age}
                  onChange={handleInputChange}
                  placeholder="Age"
                  className="neobrutal-input"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-neobrutal-primary font-semibold flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  City *
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="neobrutal-input"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-neobrutal-primary font-semibold">
                  State *
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  className="neobrutal-input"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-neobrutal-primary font-semibold flex items-center">
                <Phone className="mr-1 h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="neobrutal-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption" className="text-neobrutal-primary font-semibold">
                Caption *
              </Label>
              <Textarea
                id="caption"
                name="caption"
                value={formData.caption}
                onChange={handleInputChange}
                placeholder="Tell us about this person..."
                className="neobrutal-input resize-none"
                rows={4}
                maxLength={1000}
                required
                disabled={isSubmitting}
              />
              <div className="text-sm text-gray-500 text-right">{formData.caption.length}/1000 characters</div>
            </div>

            <div className="space-y-4">
              <Label className="text-neobrutal-primary font-semibold">Photos (Optional - Max 6)</Label>

              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-neobrutal-primary border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-neobrutal-primary" />
                    <p className="mb-2 text-sm text-neobrutal-primary font-semibold">Click to upload photos</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={
                          URL.createObjectURL(photo) ||
                          "/placeholder.svg?height=120&width=120&query=uploaded%20photo%20preview" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-neobrutal-primary"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-neobrutal-red text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading photos...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-neobrutal-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !userId}
              className="w-full neobrutal-button bg-neobrutal-green text-white hover:bg-green-600 text-lg py-3"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Post...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  {userId ? "Create Post" : "Loading..."}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
