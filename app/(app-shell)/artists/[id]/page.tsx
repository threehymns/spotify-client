"use client";

import React, { useEffect, useState, use } from "react";
import {
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  SpotifyTrack,
  SpotifyPaging,
  SpotifyAlbum,
} from "@/lib/spotify-api";
import { useSpotify } from "@/context/spotify-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import SongListing from "@/components/song-listing";
import { AlbumCard } from "@/components/album-card";
import {
  Play,
  Heart,
  Share2,
  Clock,
  Music,
  Award,
  AlbumIcon,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import Loading from "@/components/loading";
import { useDominantColorWorker } from "@/hooks/useDominantColorWorker";
import { motion } from "motion/react";

export default function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topTracks, setTopTracks] = useState<any[] | null>(null);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [albums, setAlbums] = useState<any[] | null>(null);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playUri, isArtistFollowed, toggleFollowArtist } = useSpotify();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extract dominant color from artist image
  const imgUrl = artist?.images?.[0]?.url;
  const { color } = useDominantColorWorker(id, imgUrl);

  useEffect(() => {
    let cancelled = false;
    async function fetchArtistData() {
      setLoading(true);
      setError(null);
      try {
        const artistData = await getArtist(id);
        if (!cancelled) {
          setArtist(artistData);
          // Fetch initial following status after artist data is loaded
          const following = await isArtistFollowed(id);
          setIsFollowing(following);
        }
      } catch (e) {
        if (!cancelled) {
          setArtist(null);
          setError("Failed to load artist.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchArtistData();
    return () => {
      cancelled = true;
    };
  }, [id, isArtistFollowed]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTopTracks() {
      setTracksLoading(true);
      try {
        const res = await getArtistTopTracks(id) as { tracks: SpotifyTrack[] };
        if (!cancelled) setTopTracks(res?.tracks || []);
      } catch {
        if (!cancelled) setTopTracks([]);
      } finally {
        if (!cancelled) setTracksLoading(false);
      }
    }
    if (id) fetchTopTracks();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAlbums() {
      setAlbumsLoading(true);
      try {
        const res = await getArtistAlbums(id, {
          include_groups: "album,single",
          market: "from_token",
          limit: "12",
        }) as SpotifyPaging<SpotifyAlbum>;
        if (!cancelled) setAlbums(res?.items || []);
      } catch {
        if (!cancelled) setAlbums([]);
      } finally {
        if (!cancelled) setAlbumsLoading(false);
      }
    }
    if (id) fetchAlbums();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loading />;

  if (error)
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-red-400 text-center flex flex-col items-center">
          <span className="mb-2 text-4xl">⚠️</span>
          <h3 className="text-xl font-semibold mb-1">Error Loading Artist</h3>
          <p>{error}</p>
        </div>
      </div>
    );

  if (!artist)
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-zinc-400 text-center">
          Artist not found.
        </div>
      </div>
    );

  return (
    <div className="min-h-screen">
      {/* Hero section with artist info */}
      <div className="relative">
        {/* Gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-zinc-900/60 to-black z-0"
          style={{
            backgroundImage: artist.images?.[0]?.url
              ? `linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgba(0, 0, 0, 0.9)), url(${artist.images[0].url})`
              : "linear-gradient(to bottom, rgba(88, 28, 135, 0.3), rgba(0, 0, 0, 0.95))",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(30px)",
            opacity: 0.6,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <motion.div
              layoutId={`artist-image-${artist.id}`}
              className="w-52 h-52 md:w-60 md:h-60 flex-shrink-0 shadow-2xl rounded-md overflow-hidden"
              initial={{ opacity: 0.8, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={
                  artist.images?.[0]?.url ||
                  "/placeholder.svg?height=240&width=240"
                }
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <Badge
                variant="outline"
                className="mb-2 uppercase text-xs font-semibold tracking-wide text-white bg-white/10 backdrop-blur-sm border-white/20 px-3 py-1"
              >
                <Award className="w-2.5 h-2.5 text-purple-300" />
                Artist
              </Badge>
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {artist.name}
              </motion.h1>
              <motion.div
                className="text-zinc-300 mb-3 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {artist.genres?.length > 0 && (
                  <span className="text-zinc-300">
                    {artist.genres.slice(0, 3).join(" • ")}
                  </span>
                )}
              </motion.div>
              <motion.div
                className="text-zinc-400 text-sm flex items-center flex-wrap gap-x-2 mb-4 justify-center md:justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {artist.followers && (
                  <span className="font-medium text-white">
                    {artist.followers.total.toLocaleString()} followers
                  </span>
                )}
              </motion.div>
              <motion.div
                className="flex items-center gap-3 flex-wrap justify-center md:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Button
                  onClick={() => playUri(`spotify:artist:${artist.id}`)}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white px-8"
                  style={{
                    backgroundColor: color
                      ? `rgb(${color[0]},${color[1]},${color[2]})`
                      : "",
                    borderColor: color
                      ? `rgb(${color[0]},${color[1]},${color[2]})`
                      : "",
                  }}
                >
                  <Play className="h-5 w-5 mr-2 fill-current" /> Play
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full border-zinc-700 ${isFollowing ? 'text-green-500 hover:text-green-500' : 'text-zinc-300 hover:text-white'} hover:bg-zinc-800`}
                  disabled={isSaving}
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      console.log("Toggling artist follow status:", { id, isFollowing });
                      await toggleFollowArtist(id, !isFollowing);
                      // Update local state based on the toggle result
                      setIsFollowing(prev => !prev);
                    } catch (error) {
                      console.error("Failed to toggle artist follow status:", error);
                      // If toggle failed, refresh the status to show the current state from the API
                      const currentStatus = await isArtistFollowed(id);
                      setIsFollowing(currentStatus);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <Heart className="h-5 w-5" fill={isFollowing ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Top tracks section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-zinc-900/20 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800 mb-8">
          <div className="p-4 pb-0 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-green-900/50 rounded-lg border border-green-700/30">
                <Music className="h-4 w-4 text-green-300" />
              </div>
              Popular Tracks
            </h2>
            <Button variant="ghost" className="text-zinc-400 hover:text-white">
              <Clock className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="p-4 max-h-[400px]">
            {tracksLoading ? (
              <div className="grid gap-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-zinc-800/50 rounded-md animate-pulse"
                  />
                ))}
              </div>
            ) : topTracks && topTracks.length > 0 ? (
              <SongListing tracks={topTracks.slice(0, 5)} />
            ) : (
              <div className="text-zinc-400 flex flex-col items-center justify-center py-10">
                <Music className="h-12 w-12 text-zinc-700 mb-2" />
                <p>No top songs found for this artist.</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Albums section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-purple-900/50 rounded-lg border border-purple-700/30">
              <AlbumIcon className="h-4 w-4 text-purple-300" />
            </div>
            Albums & Singles
          </h2>
          {albumsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-zinc-800/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : albums && albums.length > 0 ? (
            <ScrollArea className="pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 pb-3">
                {albums.map((album) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <AlbumCard
                      album={album}
                      href={`/albums/${album.id}`}
                      showArtists={false}
                      showPlayButton={true}
                      className="h-full transition-transform duration-200 hover:scale-[1.02] focus-within:scale-[1.02]"
                    />
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-zinc-400 flex flex-col items-center justify-center py-12 bg-zinc-900/40 rounded-lg">
              <AlbumIcon className="h-12 w-12 text-zinc-700 mb-2" />
              <p>No albums found for this artist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
