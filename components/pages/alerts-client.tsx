"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createAlert, getAlerts, deleteAlert } from "@/actions/alerts"
import { Trash2 } from "lucide-react"

// Define the Alert type to match the expected data structure
type Alert = {
  id: string
  user_id: string
  alert_type: "name" | "location" | "phone"
  alert_term: string
  created_at: string
}

export default function AlertsClient() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertType, setAlertType] = useState<"name" | "location" | "phone">("name")
  const [alertValue, setAlertValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true)
      try {
        const existingAlerts = await getAlerts()
        setAlerts(existingAlerts || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load existing alerts.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadAlerts()
  }, [toast])

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a value for the alert.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await createAlert(alertType, alertValue)
      if (result.error) {
        toast({
          title: "Error creating alert",
          description: result.error,
          variant: "destructive",
        })
      } else if (result.data) {
        toast({
          title: "Success",
          description: "Alert created successfully.",
        })
        setAlerts([result.data, ...alerts])
        setAlertValue("")
      }
    })
  }

  const handleDeleteAlert = (id: string) => {
    startTransition(async () => {
      const error = await deleteAlert(id)
      if (error) {
        toast({
          title: "Error",
          description: `Failed to delete alert: ${error}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Alert deleted.",
        })
        setAlerts((prev) => prev.filter((alert) => alert.id !== id))
      }
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Manage Your Alerts</h1>

      <Card className="mb-8 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select onValueChange={(value: "name" | "location" | "phone") => setAlertType(value)} defaultValue="name">
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black bg-white">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                value={alertValue}
                onChange={(e) => setAlertValue(e.target.value)}
                placeholder={`Enter a ${alertType}...`}
                className="md:col-span-2 border-2 border-black"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating..." : "Create Alert"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_#000]">
        <CardHeader>
          <CardTitle className="text-2xl">Your Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading alerts...</p>
          ) : alerts.length > 0 ? (
            <ul className="space-y-4">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="flex items-center justify-between p-4 border-2 border-black rounded-md bg-white"
                >
                  <div>
                    <p className="font-bold capitalize text-lg">{alert.alert_type.replace("_", " ")}</p>
                    <p className="text-gray-600 font-mono text-sm">"{alert.alert_term}"</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlert(alert.id)}
                    disabled={isPending}
                    aria-label="Delete alert"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">You have no active alerts.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
