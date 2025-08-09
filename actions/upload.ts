"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function uploadFile(
  formData: FormData,
  bucket: string,
  folder?: string,
): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, message: "No file provided" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "File must be an image" }
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "File size must be less than 5MB" }
    }

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === bucket)

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ["image/*"],
        fileSizeLimit: 5242880, // 5MB
      })
      if (createError) {
        console.error("Error creating bucket:", createError)
        return { success: false, message: `Failed to create bucket: ${createError.message}` }
      }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload file
    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { success: false, message: `Upload failed: ${uploadError.message}` }
    }

    // Get public URL
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)

    return {
      success: true,
      url: data.publicUrl,
      message: "File uploaded successfully",
    }
  } catch (error) {
    console.error("Unexpected upload error:", error)
    return {
      success: false,
      message: "Unexpected error during upload",
    }
  }
}
