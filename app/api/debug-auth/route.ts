import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase-server"

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          }
        : null,
      error: error?.message || null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
