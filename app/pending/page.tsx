import Link from "next/link"
import { Hourglass, Mail, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabase } from "@/lib/supabase-server"
import { redirect } from "next/navigation"

export default async function PendingPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const supabase = createServerSupabase()

  let user: any = null
  let appUser: any = null
  let isAuthenticated = false

  // Try to get authenticated user first
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (!authError && authUser) {
      user = authUser
      isAuthenticated = true

      // Get user status from database
      const { data: userData } = await supabase
        .from("users")
        .select("is_approved, is_rejected, full_name, agreed_to_terms, verification_photo_url")
        .eq("id", authUser.id)
        .single()

      appUser = userData
    }
  } catch (error) {
    // Auth failed, but we might still be able to show pending page
    console.log("Auth failed in pending page (non-fatal):", error)
  }

  // If no authenticated user, try to find user by email parameter
  if (!isAuthenticated) {
    const emailParam = searchParams.email
    if (emailParam) {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("is_approved, is_rejected, full_name, agreed_to_terms, verification_photo_url, email")
          .eq("email", emailParam)
          .single()

        if (userData) {
          appUser = userData
          // Create a mock user object for display purposes
          user = { email: emailParam }
        }
      } catch (error) {
        console.log("Database lookup failed:", error)
      }
    }
  }

  // If we still don't have any user data, redirect to login
  if (!user || !appUser) {
    redirect("/login")
  }

  // If user hasn't completed agreement, redirect there
  if (!appUser.agreed_to_terms || !appUser.full_name || !appUser.verification_photo_url) {
    const redirectUrl = user.email ? `/agreement?email=${encodeURIComponent(user.email)}` : "/agreement"
    redirect(redirectUrl)
  }

  // If user is approved and authenticated, redirect to feed
  if (appUser.is_approved && !appUser.is_rejected && isAuthenticated) {
    redirect("/feed")
  }

  const isRejected = appUser.is_rejected

  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-6 bg-neobrutal-background text-neobrutal-primary">
      <Card className="w-full max-w-md neobrutal-card p-8 text-center">
        <CardHeader>
          {isRejected ? (
            <>
              <XCircle className="h-16 w-16 text-neobrutal-red mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold mb-4 text-neobrutal-red">Account Rejected</CardTitle>
            </>
          ) : (
            <>
              <Hourglass className="h-16 w-16 text-neobrutal-blue mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold mb-4 text-neobrutal-primary">Account Pending Approval</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent>
          {isRejected ? (
            <>
              <p className="text-neobrutal-secondary mb-6">
                Unfortunately, your account application has been rejected by an administrator.
              </p>
              <p className="text-neobrutal-secondary mb-6">
                If you believe this was an error, please contact support for assistance.
              </p>
            </>
          ) : (
            <>
              <p className="text-neobrutal-secondary mb-6">
                Thank you for completing your profile! Your account is currently pending approval by an administrator.
              </p>

              {!isAuthenticated && (
                <div className="bg-neobrutal-yellow p-4 rounded border-2 border-neobrutal-primary mb-6">
                  <Mail className="h-8 w-8 text-neobrutal-primary mx-auto mb-2" />
                  <p className="text-sm text-neobrutal-primary font-bold">Please verify your email address!</p>
                  <p className="text-xs text-neobrutal-secondary mt-1">
                    Check your inbox for {user.email} and click the verification link to complete your registration.
                  </p>
                  <p className="text-xs text-neobrutal-secondary mt-2">
                    After verifying your email, you can log in and check your approval status.
                  </p>
                </div>
              )}

              <p className="text-neobrutal-secondary mb-6">
                We will notify you via email once your account has been approved. This process helps us maintain a safe
                and trusted community.
              </p>

              {isAuthenticated && (
                <div className="bg-neobrutal-green/20 p-4 rounded border-2 border-neobrutal-primary mb-6">
                  <p className="text-sm text-neobrutal-primary font-bold">✓ Email Verified</p>
                  <p className="text-xs text-neobrutal-secondary mt-1">
                    Your email has been verified. You're all set! Just waiting for admin approval.
                  </p>
                </div>
              )}
            </>
          )}

          <Link href="/login">
            <Button className="neobrutal-button bg-neobrutal-blue text-neobrutal-primary px-6 py-3 text-lg font-semibold">
              {isAuthenticated ? "Back to Login" : "Log In After Email Verification"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
