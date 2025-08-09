"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Check,
  X,
  Trash2,
  Search,
  Filter,
  UserIcon,
  Mail,
  Calendar,
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { toggleApproval, toggleAdmin, deleteUser, rejectUser } from "@/actions/admin"

interface AllUsersSectionProps {
  onStatsChange: () => void
}

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  display_name: string | null
  phone_number: string | null
  verification_photo_url: string | null
  avatar_url: string | null
  is_approved: boolean
  is_rejected: boolean
  is_admin: boolean
  created_at: string
}

export default function AllUsersSection({ onStatsChange }: AllUsersSectionProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    filterUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, statusFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Fetch via secure admin API to bypass RLS and retrieve ALL users.
      const response = await fetch("/api/admin/users", {
        cache: "no-store", // Ensure we get the latest user list
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to fetch users:", response.status, errorText)
        throw new Error(`Failed to load users: ${errorText || response.statusText}`)
      }

      const data = await response.json()
      // Ensure data is always an array
      const usersArray = Array.isArray(data) ? data : []
      setUsers(usersArray)
    } catch (error: any) {
      console.error("Error in loadUsers:", error)
      toast({
        title: "Error Loading Users",
        description: error.message,
        variant: "destructive",
      })
      // Set empty array on error to prevent map errors
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    // Ensure users is always an array before filtering
    if (!Array.isArray(users)) {
      setFilteredUsers([])
      return
    }

    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone_number?.includes(searchTerm),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        switch (statusFilter) {
          case "approved":
            return user.is_approved && !user.is_rejected
          case "pending":
            return !user.is_approved && !user.is_rejected
          case "rejected":
            return user.is_rejected
          case "admin":
            return user.is_admin
          default:
            return true
        }
      })
    }

    setFilteredUsers(filtered)
  }

  const handleAction = async (userId: string, action: "approve" | "reject" | "admin" | "delete") => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      let result
      switch (action) {
        case "approve":
          result = await toggleApproval(userId, true)
          break
        case "reject":
          result = await rejectUser(userId)
          break
        case "admin":
          {
            const user = users.find((u) => u.id === userId)
            result = await toggleAdmin(userId, !user?.is_admin)
          }
          break
        case "delete":
          if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            setActionLoading((prev) => ({ ...prev, [userId]: false }))
            return
          }
          result = await deleteUser(userId)
          break
      }

      if (result.success) {
        if (action === "delete") {
          setUsers((prev) => prev.filter((user) => user.id !== userId))
        } else {
          await loadUsers()
        }
        onStatsChange()
        toast({
          title: `User ${action}d successfully`,
          description: `The user has been ${action}d.`,
          className: "neobrutal-card bg-neobrutal-green text-white border-neobrutal-primary",
        })
      } else {
        toast({
          title: `Error ${action}ing user`,
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Unexpected error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const getStatusBadge = (user: UserProfile) => {
    if (user.is_admin) {
      return (
        <Badge className="bg-purple-500 text-white">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      )
    } else if (user.is_approved) {
      return (
        <Badge className="bg-neobrutal-green text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    } else if (user.is_rejected) {
      return (
        <Badge className="bg-neobrutal-red text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-neobrutal-yellow text-neobrutal-primary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <Card className="neobrutal-card">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-neobrutal-primary" />
          <span className="ml-2">Loading users...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Users</h2>
        <Badge variant="outline" className="neobrutal-card">
          {filteredUsers.length} users
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card className="neobrutal-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neobrutal-secondary" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neobrutal-input pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 neobrutal-input">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {Array.isArray(filteredUsers) &&
          filteredUsers.map((user) => (
            <Card key={user.id} className="neobrutal-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 neobrutal-avatar">
                      <AvatarImage
                        src={
                          user.avatar_url ||
                          user.verification_photo_url ||
                          "/placeholder.svg?height=64&width=64&query=user avatar" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                      />
                      <AvatarFallback className="neobrutal-avatar-fallback text-lg">
                        {(user.display_name || user.full_name || user.email)?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-neobrutal-secondary" />
                        <span className="font-bold text-lg">{user.display_name || user.full_name || "No name"}</span>
                        {user.display_name && user.full_name && user.display_name !== user.full_name && (
                          <span className="text-sm text-neobrutal-secondary">({user.full_name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-neobrutal-secondary" />
                        <span className="text-neobrutal-secondary">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neobrutal-secondary" />
                        <span className="text-sm text-neobrutal-secondary">
                          Joined {format(new Date(user.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{getStatusBadge(user)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neobrutal-secondary">
                    {user.phone_number && <p>Phone: {user.phone_number}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!user.is_approved && !user.is_rejected && (
                      <>
                        <Button
                          onClick={() => handleAction(user.id, "approve")}
                          disabled={actionLoading[user.id]}
                          size="sm"
                          className="neobrutal-button bg-neobrutal-green text-white"
                        >
                          {actionLoading[user.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleAction(user.id, "reject")}
                          disabled={actionLoading[user.id]}
                          size="sm"
                          className="neobrutal-button bg-neobrutal-red text-white"
                        >
                          {actionLoading[user.id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleAction(user.id, "admin")}
                      disabled={actionLoading[user.id]}
                      size="sm"
                      className={`neobrutal-button ${user.is_admin ? "bg-purple-500" : "bg-neobrutal-blue"} text-white`}
                    >
                      {actionLoading[user.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAction(user.id, "delete")}
                      disabled={actionLoading[user.id]}
                      size="sm"
                      className="neobrutal-button bg-neobrutal-red text-white"
                    >
                      {actionLoading[user.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {(!Array.isArray(filteredUsers) || filteredUsers.length === 0) && (
        <Card className="neobrutal-card">
          <CardContent className="text-center p-8">
            <UserIcon className="h-16 w-16 text-neobrutal-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No users found</h3>
            <p className="text-neobrutal-secondary">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No users have signed up yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
