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
          error: "Missing Supabase configuration",
        },
        { status: 500 },
      )
    }

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Test various operations
    const tests = []

    // Test 1: Read users table
    try {
      const { data: users, error } = await supabase.from("users").select("id, email, full_name").limit(1)

      tests.push({
        test: "Read users table",
        success: !error,
        error: error?.message,
        count: users?.length,
      })
    } catch (err) {
      tests.push({
        test: "Read users table",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test 2: Read posts table
    try {
      const { data: posts, error } = await supabase.from("posts").select("id, subject_name, created_at").limit(1)

      tests.push({
        test: "Read posts table",
        success: !error,
        error: error?.message,
        count: posts?.length,
      })
    } catch (err) {
      tests.push({
        test: "Read posts table",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    // Test 3: Read votes table
    try {
      const { data: votes, error } = await supabase.from("votes").select("id, vote_type, created_at").limit(1)

      tests.push({
        test: "Read votes table",
        success: !error,
        error: error?.message,
        count: votes?.length,
      })
    } catch (err) {
      tests.push({
        test: "Read votes table",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }

    return NextResponse.json({
      success: true,
      tests,
      timestamp: new Date().toISOString(),
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
