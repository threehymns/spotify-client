"use client";
import React, { useEffect, useState } from "react";
import { getPlaylist, getPlaylistTracks } from "@/lib/spotify-api";
import { useSpotify } from "@/context/spotify-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Heart, ListMusic, Play, Share2, Clock, MoreHorizontal } from "lucide-react";
import Loading from "@/components/loading";
import SongListing from "@/components/song-listing";
import { motion } from "motion/react";

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const { id } = React.use(params);
  const [playlist, setPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playUri } = useSpotify();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlaylist(id);
        if (!cancelled) setPlaylist(data);
        const tracksData = await getPlaylistTracks(id);
        if (!cancelled) setTracks(tracksData.items.map((item: any) => item.track));
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load playlist.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loading />;
  if (error) return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-red-400 text-center flex flex-col items-center">
        <span className="mb-2 text-4xl">⚠️</span>
        <h3 className="text-xl font-semibold mb-1">Error Loading Playlist</h3>
        <p>{error}</p>
      </div>
    </div>
  );
  if (!playlist) return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-zinc-400 text-center">
        Playlist not found.
      </div>
    </div>
  );

  // Format duration
  const getTotalDuration = () => {
    const totalMs = tracks.reduce((acc, track) => acc + (track.duration_ms || 0), 0);
    const minutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours} hr ${minutes % 60} min` : `${minutes} min`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero section with playlist info */}
      <div className="relative">
        {/* Gradient background */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-zinc-900/60 to-black z-0"
          style={{
            backgroundImage: playlist.images?.[0]?.url ? 
              `linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgba(0, 0, 0, 0.9)), url(${playlist.images[0].url})` : 
              'linear-gradient(to bottom, rgba(88, 28, 135, 0.3), rgba(0, 0, 0, 0.95))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(30px)',
            opacity: 0.6,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <motion.div 
              layoutId={`playlist-cover-${playlist.id}`}
              className="w-52 h-52 md:w-60 md:h-60 flex-shrink-0 shadow-2xl rounded-md overflow-hidden"
              initial={{ opacity: 0.8, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src={playlist.images?.[0]?.url || "/placeholder.svg?height=240&width=240"}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <Badge variant="outline" className="mb-2 uppercase text-xs font-semibold tracking-wide text-white bg-white/10 backdrop-blur-sm border-white/20 px-3 py-1">
                <ListMusic className="w-3 h-3 mr-1" /> Playlist
              </Badge>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {playlist.name}
              </motion.h1>
              <motion.div 
                className="text-zinc-300 mb-3 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {playlist.description}
              </motion.div>
              <motion.div 
                className="text-zinc-400 text-sm flex items-center flex-wrap gap-x-2 mb-4 justify-center md:justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <span className="font-medium text-white">{playlist.owner?.display_name || "Unknown"}</span>
                <span>•</span>
                <span>{playlist.tracks?.total ?? tracks.length} tracks</span>
                {tracks.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{getTotalDuration()}</span>
                  </>
                )}
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 flex-wrap justify-center md:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button 
                  onClick={() => playUri(playlist.uri)} 
                  size="lg" 
                  className="bg-green-500 hover:bg-green-600 text-white px-8"
                >
                  <Play className="h-5 w-5 mr-2 fill-current" /> Play
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Track listing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-zinc-900/20 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800">
          <div className="p-4 pb-0 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Tracks</h2>
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              <Clock className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="p-4 max-h-[calc(100vh-400px)]">
            <SongListing tracks={tracks} />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
