"use server"

import { createSupabaseAdminClient } from "@/lib/supabase-admin"
import type { User } from "@/lib/types"

const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export async function uploadFile(
  formData: FormData,
  bucketName: string,
  user: User | null,
): Promise<{ success: boolean; message: string; data?: { path: string; publicUrl: string } }> {
  console.log(`[Upload Action] Starting upload to bucket: ${bucketName}`)

  if (!user) {
    console.error("[Upload Action] Error: User is not authenticated.")
    return { success: false, message: "Authentication required." }
  }

  const file = formData.get("file") as File

  if (!file) {
    console.error("[Upload Action] Error: No file found in form data.")
    return { success: false, message: "No file provided." }
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    console.error(`[Upload Action] Error: File size (${file.size} bytes) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`)
    return { success: false, message: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const randomSuffix = Math.random().toString(36).substring(2, 12)
    const filePath = `${user.id}/${file.name}-${randomSuffix}`

    console.log(`[Upload Action] Attempting to upload file to path: ${filePath}`)

    // Check if bucket exists, create if not.
    const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.getBucket(bucketName)

    if (bucketError && bucketError.message.includes("Bucket not found")) {
      console.log(`[Upload Action] Bucket "${bucketName}" not found. Creating it...`)
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: `${MAX_FILE_SIZE_MB}mb`,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      })

      if (createBucketError) {
        console.error("[Upload Action] Supabase error creating bucket:", createBucketError)
        throw new Error(`Server error: Could not create storage bucket. Details: ${createBucketError.message}`)
      }
      console.log(`[Upload Action] Bucket "${bucketName}" created successfully.`)
    } else if (bucketError) {
      console.error("[Upload Action] Supabase error checking for bucket:", bucketError)
      throw new Error(`Server error: Could not access storage. Details: ${bucketError.message}`)
    }

    // Upload the file
    const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("[Upload Action] Supabase error uploading file:", uploadError)
      throw new Error(`Server error: Could not upload file. Details: ${uploadError.message}`)
    }

    console.log("[Upload Action] File uploaded successfully.")

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)

    if (!urlData || !urlData.publicUrl) {
      console.error("[Upload Action] Error: Could not get public URL for the uploaded file.")
      throw new Error("Upload succeeded, but failed to retrieve public URL.")
    }

    console.log(`[Upload Action] Public URL retrieved: ${urlData.publicUrl}`)

    return {
      success: true,
      message: "File uploaded successfully.",
      data: {
        path: filePath,
        publicUrl: urlData.publicUrl,
      },
    }
  } catch (error) {
    console.error("[Upload Action] An unexpected error occurred:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred."
    return {
      success: false,
      message: errorMessage,
    }
  }
}
