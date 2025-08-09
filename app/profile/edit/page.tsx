import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, User, Phone, Mail, Camera } from "lucide-react"
import Link from "next/link"
import { updateUserProfile } from "@/actions/profile"

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string }
}) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: userProfile, error } = await supabase
    .from("users")
    .select("full_name, display_name, phone_number, avatar_url")
    .eq("id", user.id)
    .single()

  if (error) {
    console.error("Error fetching user profile:", error)
    redirect("/profile")
  }

  return (
    <div className="min-h-screen bg-neobrutal-bg p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="outline" size="sm" className="neobrutal-button bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        {/* Success/Error Messages */}
        {searchParams.success && (
          <Alert className="neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary">
            <AlertDescription>{searchParams.success}</AlertDescription>
          </Alert>
        )}

        {searchParams.error && (
          <Alert className="neobrutal-card bg-neobrutal-red text-white border-neobrutal-primary">
            <AlertDescription>{searchParams.error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Edit Form */}
        <Card className="neobrutal-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateUserProfile} className="space-y-6">
              {/* Current Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 neobrutal-avatar">
                  <AvatarImage
                    src={userProfile.avatar_url || "/placeholder.svg?height=80&width=80&query=user avatar"}
                  />
                  <AvatarFallback className="neobrutal-avatar-fallback text-xl">
                    {(userProfile.display_name || userProfile.full_name || user.email)?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">Current Avatar</h3>
                  <p className="text-sm text-neobrutal-secondary">Upload a new photo to change your avatar</p>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  New Avatar Photo
                </Label>
                <Input id="avatar" name="avatar" type="file" accept="image/*" className="neobrutal-input" />
                <p className="text-xs text-neobrutal-secondary">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Display Name
                </Label>
                <Input
                  id="display_name"
                  name="display_name"
                  type="text"
                  defaultValue={userProfile.display_name || ""}
                  placeholder="How you appear to others"
                  className="neobrutal-input"
                />
                <p className="text-xs text-neobrutal-secondary">This is how other users will see your name</p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={userProfile.full_name || ""}
                  placeholder="Your legal name"
                  className="neobrutal-input"
                />
                <p className="text-xs text-neobrutal-secondary">Used for verification purposes</p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  defaultValue={userProfile.phone_number || ""}
                  placeholder="(555) 123-4567"
                  className="neobrutal-input"
                />
                <p className="text-xs text-neobrutal-secondary">Optional - for contact purposes</p>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="neobrutal-input opacity-50"
                />
                <p className="text-xs text-neobrutal-secondary">Contact support to change your email address</p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full neobrutal-button bg-neobrutal-primary text-white">
                <Upload className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
