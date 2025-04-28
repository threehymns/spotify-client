"use client";
import React, { useEffect, useState } from "react";
import { getPlaylist, getPlaylistTracks } from "@/lib/spotify-api";
import { useSpotify } from "@/context/spotify-context";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
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

  if (loading) return <div className="p-6 text-zinc-400">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!playlist) return <div className="p-6 text-zinc-400">Playlist not found.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-6 mb-6">
        <motion.img
          src={playlist.images?.[0]?.url || "/placeholder.svg?height=160&width=160"}
          alt={playlist.name}
          className="w-40 h-40 rounded shadow object-cover"
          layoutId={`playlist-cover-${playlist.id}`}
        />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
          <div className="text-zinc-400 mb-1">By {playlist.owner?.display_name || "Unknown"}</div>
          <div className="text-zinc-400 text-sm mb-2">{playlist.tracks?.total ?? tracks.length} tracks</div>
          <Button size="sm" variant="default" onClick={() => playUri(playlist.uri)}>
            <Play className="h-4 w-4 mr-2" /> Play Playlist
          </Button>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Tracks</h2>
        <SongListing tracks={tracks} />
      </div>
    </div>
  );
}
