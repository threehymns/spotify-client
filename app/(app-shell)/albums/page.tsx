"use client"

import React, { useEffect, useState } from "react"
import { getUserSavedAlbums } from "@/lib/spotify-api"
import { useSpotify } from "@/context/spotify-context"
import { AlbumCard } from '@/components/album-card';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const data = await getUserSavedAlbums()
        setAlbums(data.items || [])
      } catch (e) {
        setAlbums([])
      } finally {
        setLoading(false)
      }
    }
    fetchAlbums()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Your Saved Albums</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : albums.length === 0 ? (
        <div className="text-zinc-400">No saved albums found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map(({ album }: { album: { id: string; name: string; images: any[]; artists: any[]; uri: string } }) => (
            <AlbumCard key={album.id} album={album} href={`/albums/${album.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
