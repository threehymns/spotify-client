"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  GalleryVerticalEnd,
  RefreshCw,
  Play,
  Heart,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { motion } from "motion/react";
import { useSpotify } from "@/context/spotify-context";
import { useEffect, useState } from "react";
import UniversalContextMenu from "@/components/universal-context-menu";
import Loading from "@/components/loading";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyUser,
} from "@/lib/zod-schemas";

function ProfileOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setProfile(user);
    setLoading(false);
  }, [user]);

  const profileImageUrl = profile?.images?.[0]?.url;

  return (
    <section className="relative">
      {/* Optional: Blurred background derived from profile image (or default) */}
      <div
        className="absolute inset-0 z-0 bg-gradient-to-b from-green-900/50 via-zinc-900/70 to-black/90 opacity-80"
        style={
          profileImageUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(22, 100, 50, 0.6), rgba(0, 0, 0, 0.95)), url(${profileImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center top", // Adjust as needed
                filter: "blur(40px)",
                opacity: 0.5, // Reduced opacity
              }
            : {}
        } // Keep the default gradient if no image
      />

      <div className="relative z-10 pt-12 pb-8 md:pt-16 md:pb-12">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loading text="Loading profile..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-6 rounded-lg bg-red-900/30 border border-red-800/50 max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
            <span className="text-red-300 font-medium text-center">
              {error}
            </span>
          </div>
        ) : profile ? (
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
            <motion.div
              className="w-36 h-36 md:w-48 md:h-48 flex-shrink-0 rounded-full overflow-hidden shadow-xl border-2 border-green-600/50 ring-2 ring-black/30"
              initial={{ opacity: 0.8, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={profileImageUrl || "/placeholder.svg?height=192&width=192"}
                alt={profile.display_name || "User"}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              className="flex flex-col items-center md:items-start text-center md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="text-sm font-medium text-green-400 mb-1">
                Welcome back,
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md mb-3">
                {profile.display_name || "Spotify User"}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 text-sm text-zinc-400 mb-4">
                {profile.email && (
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1.5 text-zinc-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {profile.email}
                  </div>
                )}
                {profile.followers?.total !== undefined && (
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1.5 text-zinc-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <polyline points="17 11 19 13 23 9" />
                    </svg>
                    {profile.followers.total.toLocaleString()} follower
                    {profile.followers.total !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              {/* Placeholder for potential future actions */}
              {/* <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">View Profile</Button> */}
            </motion.div>
          </div>
        ) : (
          <div className="text-center text-zinc-500">
            Could not load profile data.
          </div>
        )}
      </div>
    </section>
  );
}

function PlaylistsSection() {
  const { play } = useSpotify();
  const { api } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Limit initial display
  const INITIAL_DISPLAY_COUNT = 6;

  useEffect(() => {
    if (!api) return;
    setLoading(true);
    api
      .getMyPlaylists()
      .then((data) => {
        setPlaylists(data?.items || []);
        setError(null);
      })
      .catch((e) => {
        console.error("Playlists fetch error:", e);
        setError("Failed to load playlists.");
      })
      .finally(() => setLoading(false));
  }, [api]);

  const visiblePlaylists = showAll
    ? playlists
    : playlists.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="p-2 bg-green-900/50 rounded-lg border border-green-700/30">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-green-300"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
          Your Playlists
        </h2>
      </div>

      {/* Content Area */}
      <div className="relative bg-zinc-900/30 backdrop-blur-md rounded-xl border border-white/10 p-4 md:p-6 shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loading />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-red-300 text-center">
            <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
            <span className="font-medium">{error}</span>
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
            <svg
              className="w-12 h-12 text-zinc-600 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <div className="text-zinc-400 font-medium mb-2">
              No playlists found.
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Create or follow playlists to see them here.
            </p>
            {/* Optional: Add a button to create/find playlists */}
            {/* <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/70">Create Playlist</Button> */}
          </div>
        ) : (
          <>
            {/* Grid for playlists */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {visiblePlaylists.map((playlist, idx) => (
                <UniversalContextMenu
                  type="playlist"
                  id={playlist.id}
                  key={playlist.id || idx}
                >
                  <motion.div
                    className="relative group bg-gradient-to-b from-zinc-800/70 to-zinc-900/80 rounded-lg overflow-hidden shadow-md hover:shadow-lg border border-white/5 hover:border-white/10 transition-all duration-300"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Link
                      href={`/playlists/${playlist.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View playlist: ${playlist.name}`}
                    />
                    <div className="relative p-3">
                      <div className="relative aspect-square overflow-hidden rounded-md mb-3 shadow group-hover:shadow-green-900/30 transition duration-300">
                        <motion.img
                          src={
                            playlist.images?.[0]?.url ||
                            "/placeholder.svg?height=200&width=200"
                          }
                          alt={playlist.name || "Playlist"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          // Consider removing layoutId if causing issues or not needed across views
                          // layoutId={`playlist-cover-${playlist.id}`}
                        />
                        {playlist.uri && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Play playlist: ${playlist.name}`}
                            className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-green-600/90 hover:bg-green-500 text-white rounded-full w-9 h-9 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent link navigation
                              e.preventDefault();
                              play(playlist.uri);
                            }}
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </Button>
                        )}
                      </div>
                      <div className="px-1 pb-1">
                        <div className="font-semibold text-sm text-white truncate group-hover:text-green-300 transition-colors">
                          {playlist.name || "Unnamed Playlist"}
                        </div>
                        <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors truncate">
                          {playlist.tracks?.total ?? 0} tracks
                        </div>
                      </div>
                    </div>
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-950/30 via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-lg" />
                  </motion.div>
                </UniversalContextMenu>
              ))}
            </div>

            {/* Show More Button */}
            {playlists.length > INITIAL_DISPLAY_COUNT && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/70 hover:border-zinc-600 group px-4"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5 text-zinc-400 group-hover:text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {" "}
                        <path d="M18 15l-6-6-6 6" />{" "}
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5 text-zinc-400 group-hover:text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {" "}
                        <path d="M6 9l6 6 6-6" />{" "}
                      </svg>
                      Show {playlists.length - INITIAL_DISPLAY_COUNT} more
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SavedSongsSection() {
  const { api } = useAuth();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { play } = useSpotify();

  useEffect(() => {
    if (!api) return;
    setLoading(true);
    api
      .getMySavedTracks()
      .then((data) => {
        setTracks(data?.items.map((item) => item.track) || []);
        setError(null);
      })
      .catch((e) => {
        console.error("Saved tracks fetch error:", e);
        setError("Failed to load saved songs.");
      })
      .finally(() => setLoading(false));
  }, [api]);

  const playAll = () => {
    // Consider playing the collection URI if available, or the first track
    const trackUris = tracks.map((t) => t.uri).filter(Boolean);
    if (trackUris.length > 0) {
      // Spotify API might require a context URI (like playlist/album)
      // or a list of track URIs for playback. Playing just the first track for now.
      play(trackUris[0]);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-zinc-900/60 via-zinc-950/80 to-black/90 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/10 shadow-xl">
      {/* Optional decorative elements */}
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-green-500/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-green-600/5 rounded-full blur-3xl opacity-40" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 p-6 md:p-8">
        {/* Left Column: Title & Play Button */}
        <div className="flex flex-col items-center md:items-start gap-4 min-w-[180px] md:min-w-[220px] flex-shrink-0 text-center md:text-left">
          <div className="p-4 bg-gradient-to-br from-green-700/30 to-green-900/50 rounded-xl shadow-lg mb-3 border border-green-600/30">
            <Heart className="w-10 h-10 text-green-300 fill-current" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md mb-2">
            Liked Songs
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            Your saved favorite tracks.
          </p>
          <Button
            onClick={playAll}
            disabled={loading || tracks.length === 0}
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white px-6 shadow-md hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed group w-full md:w-auto"
          >
            <Play className="h-5 w-5 mr-2 fill-current group-hover:scale-110 transition-transform" />{" "}
            Play All
          </Button>
        </div>

        {/* Right Column: Track List */}
        <div className="flex-1 w-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-inner">
          {loading ? (
            <div className="flex items-center justify-center h-64 p-6">
              <Loading />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 p-6 text-red-300 text-center">
              <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
              <span className="font-medium">{error}</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <Heart className="w-12 h-12 text-zinc-600 mb-3" />
              <div className="text-zinc-400 font-medium mb-3">
                No saved songs yet.
              </div>
              <div className="text-sm text-zinc-500 mb-4">
                Songs you like will appear here.
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/70"
              >
                Find Music
              </Button>
            </div>
          ) : (
            <ScrollArea className="w-full max-h-[350px] md:max-h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {/* Display limited tracks initially, maybe 6-9 */}
                {tracks.slice(0, 9).map((track, idx) => (
                  <motion.div
                    key={track.id || idx} // Use idx as fallback key if id is missing
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="group relative bg-zinc-800/50 hover:bg-zinc-700/70 border border-transparent hover:border-white/10 rounded-lg p-3 flex gap-3 items-center shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="relative flex-shrink-0 w-12 h-12">
                      <motion.img
                        src={
                          track.album?.images?.[0]?.url ||
                          "/placeholder.svg?height=50&width=50"
                        }
                        alt={track.name || "Track"}
                        className="rounded w-full h-full object-cover shadow"
                        layoutId={`saved-song-cover-${track.id}`} // Keep layoutId if useful elsewhere
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          aria-label={`Play song: ${track.name}`}
                          className="p-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (track.uri) play(track.uri);
                          }}
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">
                        {track.name || "Unknown Track"}
                      </div>
                      <div className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">
                        {track.artists?.map((a: any) => a.name).join(", ") ||
                          "Unknown Artist"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Link to view all songs if there are more */}
              {tracks.length > 9 && (
                <div className="flex justify-center p-3 pt-1 border-t border-white/10 mt-2">
                  <Link
                    href="/songs" // Ensure this route exists
                    className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    View all {tracks.length} songs
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          )}
        </div>
      </div>
    </section>
  );
}
function SavedAlbumsSection() {
  const { api } = useAuth();
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { play } = useSpotify();

  // Limit initial display
  const INITIAL_DISPLAY_COUNT = 6;

  useEffect(() => {
    if (!api) return;
    setLoading(true);
    api
      .getMySavedAlbums()
      .then((data) => {
        setAlbums(data?.items.map((item) => item.album) || []);
        setError(null);
      })
      .catch((e) => {
        console.error("Saved albums fetch error:", e);
        setError("Failed to load saved albums.");
      })
      .finally(() => setLoading(false));
  }, [api]);

  const visibleAlbums = showAll
    ? albums
    : albums.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="p-2 bg-green-900/50 rounded-lg border border-green-700/30">
          <GalleryVerticalEnd className="h-5 w-5 text-green-300" />
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
          Saved Albums
        </h2>
      </div>

      {/* Content Area */}
      <div className="relative bg-zinc-900/30 backdrop-blur-md rounded-xl border border-white/10 p-4 md:p-6 shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loading />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-red-300 text-center">
            <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
            <span className="font-medium">{error}</span>
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
            <GalleryVerticalEnd className="w-12 h-12 text-zinc-600 mb-3" />
            <div className="text-zinc-400 font-medium mb-2">
              No saved albums yet.
            </div>
            <p className="text-sm text-zinc-500 mb-4">
              Albums you save will appear here.
            </p>
            {/* Optional: Add a button to browse music */}
            {/* <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/70">Browse Music</Button> */}
          </div>
        ) : (
          <>
            {/* Grid for albums */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {visibleAlbums.map((album, idx) => (
                <UniversalContextMenu
                  type="album"
                  id={album.id}
                  artists={album.artists}
                  key={album.id || idx}
                >
                  <motion.div
                    className="relative group bg-gradient-to-b from-zinc-800/70 to-zinc-900/80 rounded-lg overflow-hidden shadow-md hover:shadow-lg border border-white/5 hover:border-white/10 transition-all duration-300"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Link
                      href={`/albums/${album.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View album: ${album.name}`}
                    />
                    <div className="relative p-3">
                      <div className="relative aspect-square overflow-hidden rounded-md mb-3 shadow group-hover:shadow-green-900/30 transition duration-300">
                        <motion.img
                          src={
                            album.images?.[0]?.url ||
                            "/placeholder.svg?height=200&width=200"
                          }
                          alt={album.name || "Album"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          // layoutId={`album-cover-${album.id}`} // Consider removing layoutId
                        />
                        {album.uri && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Play album: ${album.name}`}
                            className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-green-600/90 hover:bg-green-500 text-white rounded-full w-9 h-9 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              play(album.uri);
                            }}
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </Button>
                        )}
                      </div>
                      <div className="px-1 pb-1">
                        <div className="font-semibold text-sm text-white truncate group-hover:text-green-300 transition-colors">
                          {album.name || "Unnamed Album"}
                        </div>
                        <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors truncate">
                          {album.artists?.map((a: any) => a.name).join(", ") ||
                            "Unknown Artist"}
                        </div>
                      </div>
                    </div>
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-950/30 via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none rounded-lg" />
                  </motion.div>
                </UniversalContextMenu>
              ))}
            </div>

            {/* Show More Button */}
            {albums.length > INITIAL_DISPLAY_COUNT && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/70 hover:border-zinc-600 group px-4"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5 text-zinc-400 group-hover:text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {" "}
                        <path d="M18 15l-6-6-6 6" />{" "}
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1.5 text-zinc-400 group-hover:text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {" "}
                        <path d="M6 9l6 6 6-6" />{" "}
                      </svg>
                      Show {albums.length - INITIAL_DISPLAY_COUNT} more
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { isLoading, connectionStatus, refreshConnection, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Blurred Gradient Background */}
      <div
        className="absolute inset-0 z-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(22, 163, 74, 0.4), rgba(0, 0, 0, 0.95) 50%)", // Greenish top fade
          filter: "blur(60px)",
        }}
      />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Connection Status Alerts */}
        {connectionStatus.checking && (
          <Alert className="mb-6 bg-blue-900/50 border border-blue-800/50 backdrop-blur-md shadow-lg animate-fade-in">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-300" />
            <AlertTitle className="text-blue-100 font-semibold">
              Checking Spotify connection...
            </AlertTitle>
            <AlertDescription className="text-blue-200">
              Please wait while we verify your connection.
            </AlertDescription>
          </Alert>
        )}

        {!connectionStatus.checking && !connectionStatus.connected && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-950/70 border border-red-800/60 backdrop-blur-md shadow-lg animate-fade-in"
          >
            <AlertCircle className="h-5 w-5 text-red-300" />
            <AlertTitle className="text-red-100 font-semibold">
              Connection Error
            </AlertTitle>
            <AlertDescription className="text-red-200">
              {connectionStatus.error || "Could not connect to Spotify."}
              <div className="flex flex-wrap gap-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshConnection}
                  className="bg-red-950/70 border-red-700 text-red-100 hover:bg-red-900/70 hover:border-red-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="bg-zinc-800/70 border-zinc-700 text-zinc-200 hover:bg-zinc-700/70 hover:border-zinc-600"
                >
                  Logout
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Content */}
        {connectionStatus.connected ? (
          <div className="flex flex-col gap-10 md:gap-16">
            {/* Profile Overview Section */}
            {/* <ProfileOverview /> */}

            {/* Saved Songs Section */}
            <SavedSongsSection />

            {/* Playlists and Albums Section (Side-by-Side on larger screens) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
              <PlaylistsSection />
              <SavedAlbumsSection />
            </div>
          </div>
        ) : (
          // Optional: Show a placeholder or message when not connected but no error
          !connectionStatus.checking && (
            <div className="flex flex-col items-center justify-center text-center h-[50vh]">
              <h2 className="text-2xl font-semibold text-zinc-400 mb-4">
                Connect to Spotify to see your dashboard.
              </h2>
              <Button onClick={() => logout()} variant="outline">
                Go to Login
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}