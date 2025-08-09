"use server"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export async function getAlerts() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching alerts:", error)
    return []
  }

  return data
}

export async function createAlert(alertType: "name" | "location" | "phone", alertValue: string) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create an alert." }
  }

  if (!alertValue.trim()) {
    return { error: "Alert value cannot be empty." }
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: user.id,
      alert_type: alertType,
      alert_term: alertValue.toLowerCase().trim(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating alert in DB:", error.message)
    if (error.message.includes("alerts_alert_type_check")) {
      return { error: "Invalid alert type provided." }
    }
    return { error: "Failed to create alert. Please try again." }
  }

  revalidatePath("/alerts")
  return { data }
}

export async function deleteAlert(id: string) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return "You must be logged in to delete an alert."
  }

  const { error } = await supabase.from("alerts").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting alert:", error)
    return "Failed to delete alert."
  }

  revalidatePath("/alerts")
  return null
}
