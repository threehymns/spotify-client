"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { getUserSavedTracks } from "@/lib/spotify-api"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"

export default function SongsPage() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack } = useSpotify()

  useEffect(() => {
    async function fetchTracks() {
      try {
        const data = await getUserSavedTracks()
        setTracks(data.items || [])
      } catch (e) {
        setTracks([])
      } finally {
        setLoading(false)
      }
    }
    fetchTracks()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Your Saved Songs</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-zinc-400">No saved songs found.</div>
      ) : (
        <div className="grid gap-4">
          {tracks.map(({ track }) => (
            <div key={track.id} className="flex items-center bg-zinc-900/50 p-3 rounded-md">
              <img src={track.album.images[0]?.url || "/placeholder.svg?height=40&width=40"} alt={track.name} className="h-10 w-10 rounded mr-3 object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  <Link href={`/albums/${track.album.id}`} className="hover:underline">
                    {track.name}
                  </Link>
                </div>
                <div className="text-xs text-zinc-400 truncate">
                  {track.artists.map(a => a.name).join(", ")}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => playTrack(track.uri)}>
                <Play className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
