"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { getUserSavedTracks } from "@/lib/spotify-api"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import SongListing from "@/components/song-listing"

export default function SongsPage() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack } = useSpotify()

  useEffect(() => {
    async function fetchTracks() {
      try {
        const data = await getUserSavedTracks()
        setTracks(data?.items || [])
      } catch (e) {
        console.error("Saved tracks fetch error:", e)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }
    fetchTracks()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Your Saved Songs</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-zinc-400">No saved songs found.</div>
      ) : (
        <div className="grid gap-4">
          <SongListing tracks={tracks.map((item) => item.track)} />
        </div>
      )}
    </div>
  )
}
