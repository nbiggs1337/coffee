import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, User, Phone, Mail, Calendar, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function ProfilePage({
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
    .select("full_name, display_name, phone_number, avatar_url, is_approved, is_rejected, created_at")
    .eq("id", user.id)
    .single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return (
      <div className="min-h-screen bg-neobrutal-bg p-4">
        <div className="max-w-2xl mx-auto">
          <Alert className="neobrutal-card bg-neobrutal-red text-white border-neobrutal-primary">
            <AlertDescription>Error loading profile. Please try again.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (userProfile.is_approved) {
      return (
        <Badge className="bg-neobrutal-green text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    } else if (userProfile.is_rejected) {
      return (
        <Badge className="bg-neobrutal-red text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-neobrutal-yellow text-neobrutal-primary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  return (
    <div className="min-h-screen bg-neobrutal-bg p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Link href="/profile/edit">
            <Button className="neobrutal-button bg-neobrutal-primary text-white">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
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

        {/* Profile Card */}
        <Card className="neobrutal-card">
          <CardHeader>
            <div className="flex items-start justify-between">
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
                  <CardTitle className="text-2xl">
                    {userProfile.display_name || userProfile.full_name || "No name set"}
                  </CardTitle>
                  {userProfile.display_name &&
                    userProfile.full_name &&
                    userProfile.display_name !== userProfile.full_name && (
                      <p className="text-neobrutal-secondary">({userProfile.full_name})</p>
                    )}
                </div>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neobrutal-secondary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-neobrutal-secondary">{user.email}</p>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-neobrutal-secondary" />
              <div>
                <p className="font-medium">Phone Number</p>
                <p className="text-neobrutal-secondary">{userProfile.phone_number || "Not provided"}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-neobrutal-secondary" />
              <div>
                <p className="font-medium">Member Since</p>
                <p className="text-neobrutal-secondary">{format(new Date(userProfile.created_at), "MMMM d, yyyy")}</p>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-neobrutal-secondary" />
              <div>
                <p className="font-medium">Account Status</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                  {!userProfile.is_approved && !userProfile.is_rejected && (
                    <p className="text-sm text-neobrutal-secondary">Your account is pending admin approval</p>
                  )}
                  {userProfile.is_rejected && (
                    <p className="text-sm text-neobrutal-secondary">
                      Your account has been rejected. Contact support for more information.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
