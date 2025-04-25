"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { getUserProfile } from "@/lib/spotify-api"

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await getUserProfile()
        setUser(data)
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-3 flex items-center">
          <div className="animate-pulse flex items-center w-full">
            <div className="rounded-full bg-zinc-700 h-10 w-10 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-zinc-700 rounded w-24 mb-2"></div>
              <div className="h-3 bg-zinc-700 rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardContent className="p-3 flex items-center">
        <div className="relative h-10 w-10 mr-3">
          <Image
            src={user.images[0]?.url || "/placeholder.svg?height=40&width=40"}
            alt={user.display_name}
            fill
            className="object-cover rounded-full"
          />
        </div>
        <div>
          <div className="font-medium truncate">{user.display_name}</div>
          <div className="text-xs text-zinc-400">{user.product === "premium" ? "Premium" : "Free"}</div>
        </div>
      </CardContent>
    </Card>
  )
}
