"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { getUserSavedAlbums, type SavedAlbum } from "@/lib/spotify-api"
import { AlbumCard } from "@/components/album-card"
import { GalleryVerticalEnd, LibraryIcon, MusicIcon } from "lucide-react"
import { motion } from "motion/react"

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<SavedAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    controllerRef.current = new AbortController()
    const { signal } = controllerRef.current

    async function fetchAlbums() {
      try {
        const data = await getUserSavedAlbums(signal)
        if (!signal.aborted) {
          setAlbums(data.items ?? [])
        }
      } catch (e) {
        if (!signal.aborted && (!(e instanceof Error) || e.name !== 'AbortError')) {
          setError(true)
          setAlbums([])
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }
    fetchAlbums()

    return () => {
      controllerRef.current = null
    }
  }, [])

  const container = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }), []);

  const item = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }), []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
          <GalleryVerticalEnd className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Your Albums</h1>
          <p className="text-zinc-400 mt-1">Your saved albums from Spotify</p>
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
            Unable to load albums
          </h2>
          <p className="text-zinc-400 max-w-md">
            There was an error loading your saved albums. Please try again
            later.
          </p>
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <LibraryIcon className="h-16 w-16 text-zinc-700 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            No saved albums found
          </h2>
          <p className="text-zinc-400 max-w-md">
            Start saving albums to your library to see them here.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {albums.map(
            ({ album }: SavedAlbum) => (
              <motion.div key={album.id} variants={item}>
                <AlbumCard
                  album={album}
                  href={`/albums/${album.id}`}
                  className="h-full transition-transform duration-300 hover:scale-[1.02] backdrop-blur-sm hover:backdrop-blur-md shadow-md rounded-md overflow-hidden"
                />
              </motion.div>
            ),
          )}
        </motion.div>
      )}
    </div>
  )
}