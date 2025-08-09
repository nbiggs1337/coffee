"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase"
import PendingUsersSection from "./sections/pending-users-section"
import AllUsersSection from "./sections/all-users-section"
import PostsManagementSection from "./sections/posts-management-section"
import { useToast } from "@/components/ui/use-toast"

type AdminStats = {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  rejectedUsers: number
  totalPosts: number
  postsToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    totalPosts: 0,
    postsToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Get user stats
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("is_approved, is_rejected, created_at")

      if (usersError) throw usersError

      // Get post stats
      const { data: posts, error: postsError } = await supabase.from("posts").select("created_at")

      if (postsError) throw postsError

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const newStats: AdminStats = {
        totalUsers: users?.length || 0,
        pendingUsers: users?.filter((u) => !u.is_approved && !u.is_rejected).length || 0,
        approvedUsers: users?.filter((u) => u.is_approved).length || 0,
        rejectedUsers: users?.filter((u) => u.is_rejected).length || 0,
        totalPosts: posts?.length || 0,
        postsToday: posts?.filter((p) => new Date(p.created_at) >= today).length || 0,
      }

      setStats(newStats)
    } catch (error: any) {
      console.error("Error loading admin stats:", error)
      toast({
        title: "Error loading statistics",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = () => {
    loadStats()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neobrutal-primary">Admin Dashboard</h1>
          <p className="text-neobrutal-secondary mt-2">Manage users, posts, and monitor community activity</p>
        </div>
        <Badge variant="outline" className="neobrutal-card bg-neobrutal-blue text-white px-4 py-2">
          Administrator
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="neobrutal-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-neobrutal-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="neobrutal-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertTriangle className="h-4 w-4 text-neobrutal-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neobrutal-yellow">{loading ? "..." : stats.pendingUsers}</div>
          </CardContent>
        </Card>

        <Card className="neobrutal-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
            <UserCheck className="h-4 w-4 text-neobrutal-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neobrutal-green">{loading ? "..." : stats.approvedUsers}</div>
          </CardContent>
        </Card>

        <Card className="neobrutal-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-neobrutal-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neobrutal-red">{loading ? "..." : stats.rejectedUsers}</div>
          </CardContent>
        </Card>

        <Card className="neobrutal-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-neobrutal-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card className="neobrutal-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-neobrutal-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neobrutal-green">{loading ? "..." : stats.postsToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending-users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 neobrutal-card p-1 mb-6">
          <TabsTrigger
            value="pending-users"
            className="flex items-center gap-2 data-[state=active]:bg-neobrutal-yellow data-[state=active]:shadow-neobrutalism-sm"
          >
            <AlertTriangle className="h-4 w-4" />
            Pending Users
            {stats.pendingUsers > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {stats.pendingUsers}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="all-users"
            className="flex items-center gap-2 data-[state=active]:bg-neobrutal-yellow data-[state=active]:shadow-neobrutalism-sm"
          >
            <Users className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="flex items-center gap-2 data-[state=active]:bg-neobrutal-yellow data-[state=active]:shadow-neobrutalism-sm"
          >
            <FileText className="h-4 w-4" />
            Posts Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-users">
          <PendingUsersSection onStatsChange={refreshStats} />
        </TabsContent>

        <TabsContent value="all-users">
          <AllUsersSection onStatsChange={refreshStats} />
        </TabsContent>

        <TabsContent value="posts">
          <PostsManagementSection onStatsChange={refreshStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
