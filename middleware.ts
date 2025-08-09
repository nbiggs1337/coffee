import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Keep the session fresh on every request and sync cookies.
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return supabaseResponse

  // Skip auth refresh for agreement and pending pages since users might not be verified yet
  if (request.nextUrl.pathname === "/agreement" || request.nextUrl.pathname === "/pending") {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Update the request cookies to keep server-side in sync
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        // Recreate the response to attach the updated cookies for the browser
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    // Define protected routes that require full approval
    const protectedRoutes = ["/feed", "/post", "/swipe", "/search", "/notifications", "/admin", "/profile", "/user"]

    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // For protected routes, ensure we have a fresh session
    if (isProtectedRoute) {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          // No valid session, redirect to login
          const loginUrl = new URL("/login", request.url)
          return NextResponse.redirect(loginUrl)
        }

        // Check user approval status with error handling
        try {
          const { data: appUser, error: dbError } = await supabase
            .from("users")
            .select("is_approved, is_rejected, agreed_to_terms, full_name, verification_photo_url, is_admin, email")
            .eq("id", user.id)
            .single()

          if (dbError) {
            console.warn("Database error in middleware:", dbError.message)
            // If we can't check user status, redirect to agreement to be safe
            const agreementUrl = new URL("/agreement", request.url)
            agreementUrl.searchParams.set("email", user.email || "")
            return NextResponse.redirect(agreementUrl)
          }

          // If user doesn't exist, redirect to agreement
          if (!appUser) {
            const agreementUrl = new URL("/agreement", request.url)
            agreementUrl.searchParams.set("email", user.email || "")
            return NextResponse.redirect(agreementUrl)
          }

          // Special handling for admin users - if they're approved but missing agreement fields, auto-fix them
          if (
            appUser.is_admin &&
            appUser.is_approved &&
            (!appUser.agreed_to_terms || !appUser.full_name || !appUser.verification_photo_url)
          ) {
            try {
              await supabase
                .from("users")
                .update({
                  agreed_to_terms: true,
                  full_name: appUser.full_name || "Admin User",
                  verification_photo_url: appUser.verification_photo_url || "/admin-interface.png",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

              console.log("Auto-fixed admin user agreement fields")
              // Continue with the request since we just fixed the admin
            } catch (updateError) {
              console.warn("Failed to auto-fix admin user:", updateError)
            }
          }
          // For non-admin users, check if they need to complete agreement
          else if (!appUser.agreed_to_terms || !appUser.full_name || !appUser.verification_photo_url) {
            const agreementUrl = new URL("/agreement", request.url)
            agreementUrl.searchParams.set("email", user.email || "")
            return NextResponse.redirect(agreementUrl)
          }

          // If user is not approved (pending or rejected), redirect to pending
          if (!appUser.is_approved) {
            const pendingUrl = new URL("/pending", request.url)
            pendingUrl.searchParams.set("email", user.email || "")
            return NextResponse.redirect(pendingUrl)
          }

          // User is approved, allow access
        } catch (dbError) {
          console.warn("Database connection error in middleware:", dbError)
          // If database is unreachable, allow through but log the issue
          // The protected layout will handle the final check
        }
      } catch (authError) {
        console.warn("Auth error in middleware:", authError)
        // If auth fails, redirect to login
        const loginUrl = new URL("/login", request.url)
        return NextResponse.redirect(loginUrl)
      }
    }

    // For non-protected routes, just refresh the session if possible
    try {
      await supabase.auth.getUser()
    } catch (error) {
      // Silently handle auth refresh errors for non-protected routes
      console.warn("Non-critical auth refresh error:", error)
    }
  } catch (error) {
    // Silently handle any other middleware errors
    console.warn("Middleware error (non-critical):", error)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclude Next internals and common static assets from middleware
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
