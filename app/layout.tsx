import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Coffee",
  description: "A community safety app for coffee lovers.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neobrutal-background text-neobrutal-text`}>
        <Navigation />
        <main className="p-4 md:p-8">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
