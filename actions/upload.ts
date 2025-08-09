"use server"

import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export async function uploadFile(
  formData: FormData,
  bucketName: string,
  folder?: string,
): Promise<{ success: boolean; url?: string; message: string }> {
  console.log(`Upload Action: Initiated for bucket "${bucketName}".`)

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("Upload Action: No file found in FormData.")
      return { success: false, message: "No file provided." }
    }
    console.log(`Upload Action: File found: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // 1. Validate file properties
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Invalid file type. Only images are allowed." }
    }
    if (file.size > 25 * 1024 * 1024) {
      // 5MB limit
      return { success: false, message: "File is too large. Maximum size is 5MB." }
    }

    // 2. Ensure the storage bucket exists
    console.log("Upload Action: Checking if bucket exists.")
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    if (listError) {
      console.error("Upload Action: Supabase error listing buckets:", listError)
      throw new Error("Could not verify storage buckets on the server.")
    }

    const bucketExists = buckets.some((b) => b.name === bucketName)
    if (!bucketExists) {
      console.log(`Upload Action: Bucket "${bucketName}" does not exist. Creating it...`)
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ["image/*"],
        fileSizeLimit: "5mb",
      })
      if (createError && createError.message !== `Bucket "${bucketName}" already exists`) {
        console.error(`Upload Action: Supabase error creating bucket "${bucketName}":`, createError)
        throw new Error(`Could not create storage bucket on the server.`)
      }
      console.log(`Upload Action: Bucket "${bucketName}" created or already exists.`)
    } else {
      console.log(`Upload Action: Bucket "${bucketName}" already exists.`)
    }

    // 3. Upload the file
    const fileExt = file.name.split(".").pop() || "png"
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName
    console.log(`Upload Action: Uploading file to path: ${filePath}`)

    const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload Action: Supabase error uploading file:", uploadError)
      throw new Error("Failed to upload file to server storage.")
    }
    console.log("Upload Action: File uploaded successfully.")

    // 4. Get the public URL
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      console.error("Upload Action: Could not get public URL for file:", filePath)
      throw new Error("File was uploaded, but failed to create a public URL.")
    }
    console.log(`Upload Action: Public URL retrieved: ${urlData.publicUrl}`)

    return {
      success: true,
      url: urlData.publicUrl,
      message: "File uploaded successfully.",
    }
  } catch (error: any) {
    // This is the most important block. It catches ANY error from the above `try`
    // and ensures a valid JSON object is returned to the client.
    console.error("Upload Action: A critical unhandled error occurred:", error)
    return {
      success: false,
      message: "A critical server error occurred. Please check the server logs for details.",
    }
  }
}
