"use server"

import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export async function uploadFile(
  formData: FormData,
  bucketName: string,
  folder?: string,
): Promise<{ success: boolean; url?: string; message: string }> {
  const supabaseAdmin = createSupabaseAdminClient()
  const file = formData.get("file") as File | null

  if (!file) {
    return { success: false, message: "No file provided." }
  }

  try {
    // 1. Validate file properties
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Invalid file type. Only images are allowed." }
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      return { success: false, message: "File is too large. Maximum size is 5MB." }
    }

    // 2. Ensure the storage bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (listError) {
      console.error("Upload Action: Error listing buckets:", listError)
      throw new Error("Could not verify storage buckets.")
    }

    const bucketExists = buckets.some((b) => b.name === bucketName)
    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ["image/*"],
        fileSizeLimit: "5mb",
      })
      // Gracefully handle the case where the bucket was created by a parallel request
      if (createError && createError.message !== 'Bucket "verification-photos" already exists') {
        console.error(`Upload Action: Error creating bucket "${bucketName}":`, createError)
        throw new Error(`Could not create storage bucket.`)
      }
    }

    // 3. Upload the file
    const fileExt = file.name.split(".").pop() || "png"
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload Action: Error uploading file:", uploadError)
      throw new Error("Failed to upload file to storage.")
    }

    // 4. Get the public URL
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      console.error("Upload Action: Could not get public URL for file:", filePath)
      throw new Error("File uploaded, but failed to create a public URL.")
    }

    return {
      success: true,
      url: urlData.publicUrl,
      message: "File uploaded successfully.",
    }
  } catch (error: any) {
    console.error("Upload Action: An unexpected error occurred:", error)
    // Return a generic but clear error message to the client
    return {
      success: false,
      message: error.message || "An unexpected server error occurred during upload.",
    }
  }
}
