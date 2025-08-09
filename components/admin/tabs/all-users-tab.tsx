"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Shield, ShieldOff, Trash2, CheckCircle, XCircle } from "lucide-react"
import type { UserProfile } from "@/lib/types"
import { toggleAdmin, toggleApproval, deleteUser } from "@/actions/admin"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function AllUsersTab({ initialAllUsers }: { initialAllUsers: UserProfile[] }) {
  const [users, setUsers] = useState(initialAllUsers)
  const { toast } = useToast()

  const handleAction = async (
    action: (userId: string) => Promise<{ success: boolean; error?: string }>,
    userId: string,
    updateFn: (user: UserProfile) => Partial<UserProfile>,
    successMessage: string,
  ) => {
    const result = await action(userId)
    if (result.success) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...updateFn(u) } : u)))
      toast({
        title: "Success",
        description: successMessage,
        className: "neobrutal-card bg-neobrutal-green border-neobrutal-primary",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        className: "neobrutal-card bg-neobrutal-red text-white border-neobrutal-primary",
      })
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This is irreversible.")) {
      return
    }
    const result = await deleteUser(userId)
    if (result.success) {
      setUsers(users.filter((u) => u.id !== userId))
      toast({
        title: "User Deleted",
        description: "The user has been permanently deleted.",
        className: "neobrutal-card bg-neobrutal-green border-neobrutal-primary",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        className: "neobrutal-card bg-neobrutal-red text-white border-neobrutal-primary",
      })
    }
  }

  return (
    <div className="neobrutal-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-neobrutal-primary bg-neobrutal-yellow">
            <TableHead className="font-bold">Name</TableHead>
            <TableHead className="font-bold">Email</TableHead>
            <TableHead className="font-bold">Joined</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-b-2 border-neobrutal-primary last:border-b-0">
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {user.is_approved ? (
                    <span className="flex items-center gap-1 text-neobrutal-green">
                      <CheckCircle className="h-4 w-4" /> Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neobrutal-red">
                      <XCircle className="h-4 w-4" /> Not Approved
                    </span>
                  )}
                  {user.is_admin && (
                    <span className="flex items-center gap-1 text-neobrutal-blue">
                      <Shield className="h-4 w-4" /> Admin
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleAction(
                      toggleApproval,
                      user.id,
                      (u) => ({ is_approved: !u.is_approved }),
                      `User approval ${user.is_approved ? "revoked" : "granted"}.`,
                    )
                  }
                  className={`neobrutal-button ${user.is_approved ? "bg-neobrutal-secondary" : "bg-neobrutal-green"}`}
                >
                  {user.is_approved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleAction(
                      toggleAdmin,
                      user.id,
                      (u) => ({ is_admin: !u.is_admin }),
                      `User admin status ${user.is_admin ? "revoked" : "granted"}.`,
                    )
                  }
                  className={`neobrutal-button ${user.is_admin ? "bg-neobrutal-secondary" : "bg-neobrutal-blue"}`}
                >
                  {user.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  className="neobrutal-button bg-neobrutal-red text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
