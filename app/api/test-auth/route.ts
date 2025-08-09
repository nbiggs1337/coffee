import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase-server"

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    // Test auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({
        success: false,
        error: "Auth error",
        details: authError.message,
      })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No user found",
      })
    }

    // Test database access
    const { data: profile, error: dbError } = await supabase
      .from("users")
      .select("id, email, full_name, is_admin")
      .eq("id", user.id)
      .single()

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: "Database error",
        details: dbError.message,
        user: {
          id: user.id,
          email: user.email,
        },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
