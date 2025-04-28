"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Play, Plus, Trash2 } from "lucide-react"
import { useSpotify } from "@/context/spotify-context"
import { getUserPlaylists, createPlaylist, getPlaylistTracks, removeTrackFromPlaylist } from "@/lib/spotify-api"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import SongListing from "@/components/song-listing"

export default function PlaylistView() {
  const { playTrack } = useSpotify()
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistTracks, setPlaylistTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await getUserPlaylists()
        setPlaylists(data.items)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch playlists:", error)
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  const handlePlaylistSelect = async (playlist) => {
    setSelectedPlaylist(playlist)
    setLoading(true)

    try {
      const data = await getPlaylistTracks(playlist.id)
      setPlaylistTracks(data.items)
    } catch (error) {
      console.error("Failed to fetch playlist tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    setIsCreatingPlaylist(true)
    try {
      const newPlaylist = await createPlaylist(newPlaylistName)
      setPlaylists([...playlists, newPlaylist])
      setNewPlaylistName("")
    } catch (error) {
      console.error("Failed to create playlist:", error)
    } finally {
      setIsCreatingPlaylist(false)
    }
  }

  const handleRemoveTrack = async (trackUri, position) => {
    try {
      await removeTrackFromPlaylist(selectedPlaylist.id, trackUri, position)
      setPlaylistTracks(playlistTracks.filter((_, index) => index !== position))
    } catch (error) {
      console.error("Failed to remove track:", error)
    }
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(playlistTracks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setPlaylistTracks(items)
    // Here you would also call the Spotify API to reorder the playlist
  }

  if (loading && !selectedPlaylist) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      {/* Playlists sidebar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Playlists</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-zinc-700">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  {isCreatingPlaylist ? "Creating..." : "Create Playlist"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {playlists.map((playlist) => (
            <Card
              key={playlist.id}
              className={`bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border-zinc-800 cursor-pointer ${
                selectedPlaylist?.id === playlist.id ? "border-green-500" : ""
              }`}
              onClick={() => handlePlaylistSelect(playlist)}
            >
              <CardContent className="p-3 flex items-center">
                <div className="relative h-10 w-10 mr-3 flex-shrink-0">
                  <Image
                    src={playlist.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                    alt={playlist.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{playlist.name}</div>
                  <div className="text-xs text-zinc-400">{playlist.tracks.total} tracks</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Playlist content */}
      <div>
        {selectedPlaylist ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <div className="relative h-16 w-16 mr-4">
                  <Image
                    src={selectedPlaylist.images[0]?.url || "/placeholder.svg?height=64&width=64"}
                    alt={selectedPlaylist.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-400">PLAYLIST</div>
                  <CardTitle className="text-2xl font-bold">{selectedPlaylist.name}</CardTitle>
                  <div className="text-sm text-zinc-400 mt-1">
                    {selectedPlaylist.tracks.total} tracks • By {selectedPlaylist.owner.display_name}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : playlistTracks.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">This playlist is empty. Add some tracks!</div>
              ) : (
                <div className="space-y-2">
                  <SongListing
                    tracks={playlistTracks.map((item) => ({
                      id: item.track.id,
                      name: item.track.name,
                      uri: item.track.uri,
                      artists: item.track.artists,
                      album: item.track.album,
                    }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="text-zinc-400 mb-4">Select a playlist to view its tracks</div>
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() => document.querySelector('[aria-label="Create New Playlist"]')?.click()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Playlist
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
