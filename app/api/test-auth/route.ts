export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Test auth session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          error: "Session error",
          details: sessionError.message,
        },
        { status: 401 },
      )
    }

    if (!session) {
      return NextResponse.json(
        {
          error: "No active session",
        },
        { status: 401 },
      )
    }

    // Test database access
    const { data: user, error: dbError } = await supabase
      .from("users")
      .select("id, email, full_name, is_admin")
      .eq("id", session.user.id)
      .single()

    if (dbError) {
      return NextResponse.json(
        {
          error: "Database error",
          details: dbError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        user_id: session.user.id,
        email: session.user.email,
      },
      user,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
