"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, Eye, ZoomIn } from "lucide-react"
import type { UserProfile } from "@/lib/types"
import { toggleApproval, rejectUser } from "@/actions/admin"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Image from "next/image"

// Modal component for viewing verification photos
function VerificationPhotoModal({
  isOpen,
  onClose,
  photoUrl,
  userName,
}: {
  isOpen: boolean
  onClose: () => void
  photoUrl: string
  userName: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <Image
            src={photoUrl || "/placeholder.svg"}
            alt={`Verification photo for ${userName}`}
            width={800}
            height={600}
            className="max-w-full max-h-[80vh] object-contain neobrutal-card"
          />
          <Button
            onClick={onClose}
            className="absolute top-2 right-2 neobrutal-button bg-neobrutal-red text-white"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-bold text-white">Verification Photo for {userName}</h3>
          <p className="text-gray-300 text-sm">Click outside to close</p>
        </div>
      </div>
    </div>
  )
}

export default function PendingUsersTab({ initialPendingUsers }: { initialPendingUsers: UserProfile[] }) {
  const [pendingUsers, setPendingUsers] = useState(initialPendingUsers)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; userName: string } | null>(null)
  const { toast } = useToast()

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setLoadingStates((prev) => ({ ...prev, [userId]: true }))
    let result
    if (action === "approve") {
      result = await toggleApproval(userId, true)
    } else {
      result = await rejectUser(userId)
    }

    if (result.success) {
      setPendingUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
      toast({
        title: action === "approve" ? "User Approved" : "User Rejected",
        description: `User has been ${action === "approve" ? "approved" : "rejected"}.`,
        className: `neobrutal-card ${action === "approve" ? "bg-neobrutal-green" : "bg-neobrutal-red"} border-neobrutal-primary`,
      })
    } else {
      toast({
        title: `Error ${action === "approve" ? "approving" : "rejecting"} user`,
        description: result.error,
        variant: "destructive",
        className: "neobrutal-card bg-neobrutal-red text-white border-neobrutal-primary",
      })
    }
    setLoadingStates((prev) => ({ ...prev, [userId]: false }))
  }

  const openPhotoModal = (photoUrl: string, userName: string) => {
    setSelectedPhoto({ url: photoUrl, userName })
  }

  const closePhotoModal = () => {
    setSelectedPhoto(null)
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="neobrutal-card p-8 text-center">
        <p className="text-neobrutal-secondary">No pending users.</p>
      </div>
    )
  }

  return (
    <>
      <div className="neobrutal-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-neobrutal-primary bg-neobrutal-yellow">
              <TableHead className="font-bold">Full Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Verification Photo</TableHead>
              <TableHead className="font-bold">Signed Up</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.map((user) => (
              <TableRow key={user.id} className="border-b-2 border-neobrutal-primary last:border-b-0">
                <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.verification_photo_url ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Image
                          src={user.verification_photo_url || "/placeholder.svg"}
                          alt={`Verification photo for ${user.full_name || user.email}`}
                          width={60}
                          height={60}
                          className="object-cover rounded border-2 border-neobrutal-primary cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openPhotoModal(user.verification_photo_url!, user.full_name || user.email)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded cursor-pointer">
                          <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPhotoModal(user.verification_photo_url!, user.full_name || user.email)}
                        className="neobrutal-button bg-neobrutal-blue text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-neobrutal-secondary italic">No photo</span>
                  )}
                </TableCell>
                <TableCell>{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAction(user.id, "approve")}
                    disabled={loadingStates[user.id]}
                    className="neobrutal-button bg-neobrutal-green text-white"
                  >
                    {loadingStates[user.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAction(user.id, "reject")}
                    disabled={loadingStates[user.id]}
                    className="neobrutal-button bg-neobrutal-red text-white"
                  >
                    {loadingStates[user.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    <span className="sr-only">Reject</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Verification Photo Modal */}
      {selectedPhoto && (
        <VerificationPhotoModal
          isOpen={true}
          onClose={closePhotoModal}
          photoUrl={selectedPhoto.url}
          userName={selectedPhoto.userName}
        />
      )}
    </>
  )
}
