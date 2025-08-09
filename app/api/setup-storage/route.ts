export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST() {
  try {
    // Create avatars bucket if it doesn't exist
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const avatarsBucketExists = buckets?.some((bucket) => bucket.name === "avatars")

    if (!avatarsBucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket("avatars", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 5242880, // 5MB
      })

      if (bucketError) {
        console.error("Error creating avatars bucket:", bucketError)
        return NextResponse.json({ error: "Failed to create avatars bucket" }, { status: 500 })
      }
    }

    // Create post-images bucket if it doesn't exist
    const postImagesBucketExists = buckets?.some((bucket) => bucket.name === "post-images")

    if (!postImagesBucketExists) {
      const { error: bucketError } = await supabaseAdmin.storage.createBucket("post-images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 10485760, // 10MB
      })

      if (bucketError) {
        console.error("Error creating post-images bucket:", bucketError)
        return NextResponse.json({ error: "Failed to create post-images bucket" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Storage buckets setup complete" })
  } catch (error) {
    console.error("Storage setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
