"use client"

import Link from "next/link"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAlbum } from "@/lib/spotify-api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import Loading from "@/components/loading"
import { useSpotify } from "@/context/spotify-context"
import SongListing from "@/components/song-listing"

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [album, setAlbum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { playUri } = useSpotify()
  const router = useRouter()

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const data = await getAlbum(id)
        setAlbum(data)
      } catch (e) {
        setAlbum(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAlbum()
  }, [id])

  if (loading) return <Loading />
  if (!album) return <div className="p-6">Album not found.</div>

  return (
    <div className="p-6">
      <div className="flex gap-6 items-center mb-6">
        <img src={album.images?.[0]?.url || "/placeholder.svg?height=200&width=200"} alt={album.name} className="w-48 h-48 object-cover rounded-lg" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{album.name}</h1>
          <div className="text-zinc-400 mb-2">
            {album.artists?.map((a: any, i: number) => (
              <React.Fragment key={a.id}>
                <Link href={`/artists/${a.id}`} className="hover:underline">{a.name}</Link>
                {i < album.artists.length - 1 && ', '}
              </React.Fragment>
            ))}
          </div>
          <Button size="sm" variant="default" onClick={() => playUri(album.uri)}>
            <Play className="h-4 w-4 mr-2" />
            Play Album
          </Button>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Tracks</h2>
        <SongListing tracks={album.tracks?.items?.map((track: any) => ({
          id: track.id,
          name: track.name,
          uri: track.uri,
          artists: track.artists,
          album: album
        })) || []} />
      </div>
    </div>
  )
}
