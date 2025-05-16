"use client";

import { useState, useEffect } from "react";
import { SpotifyPlaylist } from "@/lib/spotify-api";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSpotify } from "@/context/spotify-context";
import {
  getUserPlaylists,
  createPlaylist,
  getPlaylistTracks,
} from "@/lib/spotify-api";
import { motion } from "motion/react";
import { Play, Plus, ListMusic, Music, Clock } from "lucide-react";

export default function PlaylistView() {
  const { playUri } = useSpotify();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await getUserPlaylists();
        setPlaylists(data.items as SpotifyPlaylist[]);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreatingPlaylist(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName);
      setPlaylists([...playlists, newPlaylist as SpotifyPlaylist]);
      setNewPlaylistName("");
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create new playlist button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">My Playlists</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">
                Create New Playlist
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 focus:border-green-500 text-white"
              />
              <Button
                onClick={handleCreatePlaylist}
                disabled={isCreatingPlaylist || !newPlaylistName.trim()}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isCreatingPlaylist ? "Creating..." : "Create Playlist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playlists grid */}
      {playlists.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
            <ListMusic className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">
            No playlists found
          </h3>
          <p className="text-zinc-400 mb-4">
            Create your first playlist to get started
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
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
      ) : (
        <ScrollArea className="px-1 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <Clock className="h-6 w-6 mx-auto mb-2 text-zinc-400 animate-spin" />
                <p className="text-zinc-400">Loading playlists...</p>
              </div>
            ) : (
              playlists.map((playlist, index) => {
                if (!playlist || !playlist.id) return null;
                return (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    <Link href={`/playlists/${playlist.id}`}>
                      <Card className="bg-zinc-900/50 hover:bg-zinc-800/70 transition-all duration-300 border-zinc-800/50 overflow-hidden h-full group-hover:shadow-lg group-hover:shadow-purple-500/5 hover:border-zinc-700/80">
                        <div className="aspect-square relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
                            <Music className="h-1/3 w-1/3 text-zinc-800" />
                          </div>
                          <motion.div
                            layoutId={`playlist-cover-${playlist.id}`}
                            className="absolute inset-0 z-10"
                          >
                            <Image
                              src={
                                playlist.images?.[0]?.url ||
                                "/placeholder.svg?height=300&width=300"
                              }
                              alt={playlist.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </motion.div>
                          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/80 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-3 right-3">
                              <Button
                                size="icon"
                                className="rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playUri(playlist.uri);
                                }}
                              >
                                <Play
                                  className="h-5 w-5 ml-0.5"
                                  fill="currentColor"
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-white line-clamp-1 mb-1 group-hover:text-green-400 transition-colors duration-300">
                            {playlist.name}
                          </h3>
                          <div className="flex items-center text-xs text-zinc-400 space-x-2">
                            <span>{playlist.tracks.total} tracks</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                            <span>By {playlist.owner.display_name}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
