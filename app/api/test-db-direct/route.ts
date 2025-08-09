import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Supabase configuration",
        },
        { status: 500 },
      )
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test direct database access
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, is_admin, created_at")
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Database query failed",
        details: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Direct database access working",
      userCount: users?.length || 0,
      sampleUsers: users?.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        is_admin: u.is_admin,
      })),
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
