export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

/**
 * Normalize mobile camera captures:
 * - If file is HEIC/HEIF or has unknown type, convert to JPEG via heic2any
 * - Otherwise, return the original file
 */
export async function normalizeCameraImageToJpeg(file: File): Promise<File> {
  const type = file.type?.toLowerCase() || ""
  const name = file.name || "photo"

  const isHeic =
    type.includes("heic") || type.includes("heif") || /\.heic$/i.test(name) || /\.heif$/i.test(name) || type === ""

  if (!isHeic) {
    return file
  }

  try {
    // dynamic import keeps bundle smaller
    const { default: heic2any } = await import("heic2any")
    const convertedBlob = (await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    })) as Blob

    const base = name.replace(/\.[^/.]+$/, "") || "photo"
    const jpegFile = new File([convertedBlob], `${base}.jpg`, { type: "image/jpeg" })
    return jpegFile
  } catch (err) {
    console.warn("[normalizeCameraImageToJpeg] HEIC conversion failed, using original file.", err)
    return file
  }
}
