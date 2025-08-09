"use server"

import { createSupabaseAdminClient } from "@/lib/supabase-admin"

const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export async function uploadFile(
  formData: FormData,
  bucketName: string,
): Promise<{ success: boolean; url?: string; message: string }> {
  console.log(`[Upload Action] Initiated for bucket: ${bucketName}`)

  // Use a single try/catch block to guarantee a JSON response.
  try {
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null

    if (!file) {
      return { success: false, message: "No file provided." }
    }
    if (!userId) {
      return { success: false, message: "User ID is missing." }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { success: false, message: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` }
    }

    // Create a new, reliable admin client for this specific action.
    const supabaseAdmin = createSupabaseAdminClient()

    // Define the file path using the user's ID to keep it organized.
    const filePath = `${userId}/${Date.now()}-${file.name}`

    console.log(`[Upload Action] Uploading file to path: ${filePath}`)

    // Perform the upload.
    const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(filePath, file, {
      contentType: file.type,
      upsert: false, // Don't allow overwriting files.
    })

    if (uploadError) {
      console.error("[Upload Action] Supabase upload error:", uploadError)
      // Provide a more specific error message if possible.
      if (uploadError.message.includes("exceeds the maximum file size")) {
        return { success: false, message: `The file exceeds the bucket's size limit of ${MAX_FILE_SIZE_MB}MB.` }
      }
      throw new Error(`Failed to upload file to storage. Reason: ${uploadError.message}`)
    }

    console.log("[Upload Action] File uploaded successfully.")

    // Get the public URL for the uploaded file.
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      throw new Error("Upload succeeded, but failed to retrieve the public URL.")
    }

    console.log(`[Upload Action] Public URL retrieved: ${urlData.publicUrl}`)

    return {
      success: true,
      url: urlData.publicUrl,
      message: "File uploaded successfully.",
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred."
    console.error("[Upload Action] CRITICAL FAILURE:", errorMessage)
    return {
      success: false,
      message: `Server error: ${errorMessage}`,
    }
  }
}
