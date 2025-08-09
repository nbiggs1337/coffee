export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    return NextResponse.json({
      hasSession: !!session,
      user: session?.user || null,
      error: error?.message || null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
