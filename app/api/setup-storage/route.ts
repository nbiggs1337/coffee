import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create avatars bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      return NextResponse.json({ error: "Failed to list buckets", details: listError.message }, { status: 500 })
    }

    const avatarsBucketExists = buckets?.some((bucket) => bucket.name === "avatars")

    if (!avatarsBucketExists) {
      const { error: createError } = await supabase.storage.createBucket("avatars", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 5242880, // 5MB
      })

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create avatars bucket", details: createError.message },
          { status: 500 },
        )
      }
    }

    // Create post-images bucket if it doesn't exist
    const postImagesBucketExists = buckets?.some((bucket) => bucket.name === "post-images")

    if (!postImagesBucketExists) {
      const { error: createError } = await supabase.storage.createBucket("post-images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create post-images bucket", details: createError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Storage buckets configured successfully",
      buckets: ["avatars", "post-images"],
    })
  } catch (error) {
    console.error("Storage setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
