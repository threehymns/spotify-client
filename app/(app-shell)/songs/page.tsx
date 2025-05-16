"use client"

import React, { useEffect, useState } from "react"
import { getUserSavedTracks } from "@/lib/spotify-api"
import { LibraryIcon, MusicIcon, Music2Icon } from "lucide-react"
import { motion } from "motion/react"
import SongListing from "@/components/song-listing"
import { SavedTrack, SpotifyTrack } from "@/lib/spotify-api"

export default function SongsPage() {
  const [tracks, setTracks] = useState<SavedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchTracks() {
      try {
        const data = await getUserSavedTracks()
        setTracks(data?.items || [])
      } catch (e) {
        console.error("Saved tracks fetch error:", e)
        setError(true)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }
    fetchTracks()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-3 rounded-xl shadow-lg">
          <Music2Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Your Saved Songs</h1>
          <p className="text-zinc-400 mt-1">Your liked songs from Spotify</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-zinc-400 animate-pulse">
            Loading your collection...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MusicIcon className="h-16 w-16 text-zinc-700 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Unable to load songs
          </h2>
          <p className="text-zinc-400 max-w-md">
            There was an error loading your saved songs. Please try again
            later.
          </p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <LibraryIcon className="h-16 w-16 text-zinc-700 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            No saved songs found
          </h2>
          <p className="text-zinc-400 max-w-md">
            Start liking songs to see them in your library.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <SongListing tracks={tracks.map((item) => item.track)} />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
