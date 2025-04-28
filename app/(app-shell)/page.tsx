"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, GalleryVerticalEnd, RefreshCw, Play } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import SongListing from "@/components/song-listing";
import { motion } from "motion/react";
import { useSpotify } from "@/context/spotify-context";
import { useEffect, useState } from "react";
import {
  getUserPlaylists,
  getUserSavedTracks,
  getUserSavedAlbums,
  getUserProfile,
} from "@/lib/spotify-api";
import UniversalContextMenu from "@/components/universal-context-menu";
import Loading from "@/components/loading";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function ProfileOverview() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserProfile()
      .then((data) => {
        setProfile(data);
        setError(null);
      })
      .catch((e) => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-2xl w-full max-w-6xl mx-auto">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-green-950/50 to-zinc-950/90 backdrop-blur-sm" />

      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(0,255,170,0.06)_0%,transparent_60%)]" />

      <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 md:gap-10">
        {loading ? (
          <Loading text="Loading profile..." className="w-full py-10" />
        ) : error ? (
          <div className="flex items-center justify-center w-full p-6 rounded-lg bg-red-900/20 border border-red-800/50">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-300 font-medium">{error}</span>
          </div>
        ) : profile ? (
          <>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full opacity-75 blur-lg group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow" />
              <img
                src={
                  profile.images?.[0]?.url ||
                  "/placeholder.svg?height=96&width=96"
                }
                alt={profile.display_name}
                className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-full object-cover border-2 border-green-500/70 ring-4 ring-black/50 shadow-lg transition group-hover:scale-105 duration-300"
              />
            </div>
            <div className="flex flex-col items-center sm:items-start space-y-3 sm:space-y-4">
              <div className="bg-black/30 px-4 py-1 rounded-full backdrop-blur-sm inline-flex items-center">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                <span className="text-green-300 text-sm font-medium">
                  Online now
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md">
                Welcome, {profile.display_name}!
              </h1>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                <div className="text-zinc-300 font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profile.email}
                </div>

                <div className="text-green-300 font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-green-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {profile.followers?.total.toLocaleString() ?? 0} followers
                </div>
              </div>

              <button className="mt-2 px-6 py-2 bg-green-600/90 hover:bg-green-700 text-white rounded-full font-medium text-sm transition transform hover:scale-105 shadow-lg flex items-center gap-2 hover:gap-3 group">
                <span>Your full profile</span>
                <svg
                  className="w-4 h-4 transition-all group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function PlaylistsSection() {
  const { playUri } = useSpotify();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    getUserPlaylists()
      .then((data) => {
        setPlaylists(data?.items || []);
        setError(null);
      })
      .catch((e) => setError("Failed to load playlists."))
      .finally(() => setLoading(false));
  }, []);

  const visiblePlaylists = showAll ? playlists : playlists.slice(0, 9);

  return (
    <section className="w-full max-w-5xl mx-auto backdrop-blur-sm">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -top-6 -left-6 w-12 h-12 bg-green-500/20 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-600/10 rounded-full blur-xl" />

        <h2 className="flex items-center gap-3 text-2xl font-semibold mb-8 text-green-100 tracking-tight px-6 py-3 rounded-2xl bg-gradient-to-r from-green-950/80 to-zinc-950/90 border-b border-green-900/60 group shadow-lg">
          <span className="inline-flex items-center justify-center p-2 bg-green-900/60 rounded-lg shadow-inner mr-1 group-hover:bg-green-800/60 transition-colors">
            <svg
              width="22"
              height="22"
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
          </span>
          Your Playlists
        </h2>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loading className="scale-150" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-900/20 border border-red-800/50 text-red-300 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            {error}
          </div>
        ) : playlists.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 flex flex-col items-center gap-3">
            <svg
              className="w-12 h-12 text-zinc-600 mb-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            No playlists found.
            <Button
              variant="outline"
              className="mt-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
            >
              Create your first playlist
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal scroll, Desktop: grid */}
            <div className="hide-scrollbar overflow-hidden">
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x md:grid md:grid-cols-3 lg:grid-cols-3 md:gap-7 md:gap-y-9 md:overflow-x-visible">
                {visiblePlaylists.map((playlist: any, idx: number) => (
                  <UniversalContextMenu
                    type="playlist"
                    id={playlist.id}
                    key={playlist.id}
                  >
                    <div
                      className="relative group bg-gradient-to-br from-zinc-800/90 via-zinc-900/95 to-black rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 border border-zinc-700/50 hover:border-green-700/50 flex-shrink-0 min-w-[180px] max-w-[220px] snap-center md:min-w-0 md:max-w-none"
                      style={{
                        width: "100%",
                        transform: `perspective(1000px) rotateY(0deg)`,
                        transition: "transform 0.5s ease",
                      }}
                    >
                      <div className="relative p-3 pt-4">
                        <div className="relative overflow-hidden rounded-lg mb-3 group-hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] transition duration-500">
                          <motion.img
                            src={
                              playlist.images?.[0]?.url ||
                              "/placeholder.svg?height=200&width=200"
                            }
                            alt={playlist.name}
                            className="w-full aspect-square object-cover shadow-md group-hover:scale-110 transition duration-700 ease-out"
                            layoutId={`playlist-cover-${playlist.id}`}
                          />
                          {playlist.uri && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Play playlist: ${playlist.name}`}
                              className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 bg-green-600/90 hover:bg-green-700 text-white shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                playUri(playlist.uri);
                              }}
                            >
                              <Play className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                        <div className="px-1">
                          <div className="font-semibold text-white truncate mb-1 text-base group-hover:text-green-300 transition-colors">
                            {playlist.name}
                          </div>
                          <div className="text-xs text-zinc-400 mb-4 group-hover:text-zinc-300 transition-colors">
                            {playlist.tracks?.total ?? 0} tracks
                          </div>
                        </div>
                        <Link
                          href={`/playlists/${playlist.id}`}
                          className="absolute inset-0"
                          aria-label={`View playlist: ${playlist.name}`}
                        />
                      </div>

                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                  </UniversalContextMenu>
                ))}
              </div>
            </div>

            {playlists.length > 9 && (
              <div className="flex justify-center mt-8">
                <button
                  className="group px-5 py-2.5 rounded-full bg-gradient-to-r from-green-800 to-green-700 text-white hover:from-green-700 hover:to-green-600 transition-all duration-300 text-sm font-semibold shadow-lg border border-green-700/50 hover:border-green-500/50 flex items-center gap-2"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? (
                    <>
                      <svg
                        className="w-4 h-4 text-green-300 group-hover:-translate-y-0.5 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 text-green-300 group-hover:translate-y-0.5 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                      Show more ({playlists.length - 9} more)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SavedSongsSection() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playUri } = useSpotify();
  // Get dominant color from first song's album art
  const firstTrack = tracks[0];
  const albumId = firstTrack?.album?.id;
  const albumArt = firstTrack?.album?.images?.[0]?.url;
  // eslint-disable-next-line import/no-extraneous-dependencies
  // @ts-ignore
  const { color: dominantColor } =
    require("@/hooks/useDominantColorWorker").useDominantColorWorker(
      albumId,
      albumArt,
    );

  useEffect(() => {
    setLoading(true);
    getUserSavedTracks()
      .then((data) => {
        setTracks(data?.items?.map((item: any) => item.track) || []);
        setError(null);
      })
      .catch((e) => setError("Failed to load saved songs."))
      .finally(() => setLoading(false));
  }, []);

  const playAll = () => {
    if (tracks.length > 0) {
      playUri(tracks[0].album?.uri || tracks[0].uri);
    }
  };

  // Helper to lighten or darken an RGB color
  function adjustColor(rgb: number[], amount: number) {
    return `rgb(${rgb.map((c) => Math.max(0, Math.min(255, c + amount))).join(",")})`;
  }
  const accentRgb =
    dominantColor && Array.isArray(dominantColor) && dominantColor.length === 3
      ? `rgb(${dominantColor[0]},${dominantColor[1]},${dominantColor[2]})`
      : "rgb(16,185,129)"; // fallback green
  const accentRgbArr =
    dominantColor && Array.isArray(dominantColor) && dominantColor.length === 3
      ? dominantColor
      : [16, 185, 129]; // fallback green
  const accentDark = adjustColor(accentRgbArr, -125);
  const accentLight = adjustColor(accentRgbArr, 160);

  return (
    <section
      className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl animate-fade-in"
      style={
        accentRgb
          ? {
              background: `linear-gradient(135deg, ${accentRgb} -10%, #111 40%, #000 80%)`,
              borderColor: accentRgb,
              boxShadow: `0 10px 50px -5px ${adjustColor(accentRgbArr, -150)}, 0 5px 0 0 ${adjustColor(accentRgbArr, -150)}`,
            }
          : {}
      }
    >
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-10 mix-blend-overlay" />

      {/* Decorative gradients */}
      <div
        className="absolute -left-24 -top-24 w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{
          background: `radial-gradient(circle, ${accentLight} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -right-24 bottom-0 w-64 h-64 rounded-full blur-3xl opacity-20"
        style={{
          background: `radial-gradient(circle, ${accentLight} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 p-6 md:p-10">
        <div className="flex flex-col items-center md:items-start gap-4 min-w-[200px]">
          <div
            className="p-5 rounded-2xl shadow-lg mb-2 animate-pulse-slow relative group"
            style={{
              background: `linear-gradient(135deg, ${accentDark}, ${adjustColor(accentRgbArr, -140)})`,
              overflow: "hidden",
            }}
          >
            <GalleryVerticalEnd
              className="w-14 h-14 drop-shadow relative z-10"
              style={{ color: accentLight }}
            />
          </div>

          <h2
            className="text-3xl md:text-4xl font-extrabold drop-shadow-md mb-12 tracking-tight text-center md:text-left"
            style={{ color: accentLight }}
          >
            Your Liked Songs
          </h2>
          <button
            onClick={playAll}
            disabled={loading || tracks.length === 0}
            className="group inline-flex items-center gap-2 px-8 py-3 rounded-full text-white text-lg font-bold shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed animate-fade-in hover:scale-105"
            style={{
              background: `linear-gradient(90deg, ${accentDark} 0%, ${adjustColor(accentRgbArr, -100)} 100%)`,
              boxShadow: `0 4px 20px 0 ${adjustColor(accentRgbArr, -150)}`,
              color: accentLight,
            }}
          >
            <Play
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              style={{ color: accentLight }}
            />
            <span className="relative">
              Play All
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </span>
          </button>
        </div>
        <div
          className="flex-1 w-full relative overflow-hidden rounded-xl backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-72 p-6">
              <Loading />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 p-6 text-red-400 text-lg font-medium">
              <AlertCircle className="w-6 h-6 mr-2" />
              {error}
            </div>
          ) : tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 p-6">
              <div className="text-zinc-400 text-lg font-medium mb-3">
                No saved songs found.
              </div>
              <Button className="bg-white/10 hover:bg-white/20">
                Discover music
              </Button>
            </div>
          ) : (
            <ScrollArea className="w-full max-h-[350px] md:max-h-[400px] overflow-x-auto whitespace-nowrap">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {tracks.slice(0, 12).map((track: any, idx: number) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="group relative bg-black/30 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex gap-3 shadow-lg hover:shadow-xl hover:bg-black/40 hover:border-white/10 transition-all duration-300"
                  >
                    <div className="relative min-w-[50px]">
                      <motion.img
                        src={
                          track.album?.images?.[0]?.url ||
                          "/placeholder.svg?height=50&width=50"
                        }
                        alt={track.name}
                        className="rounded-md w-12 h-12 object-cover shadow-md"
                        layoutId={`saved-song-cover-${track.id}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          aria-label={`Play song: ${track.name}`}
                          className="p-2 rounded-full bg-green-600/90 hover:bg-green-700 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            playUri(track.uri);
                          }}
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center overflow-hidden">
                      <div className="font-semibold text-white text-sm truncate">
                        {track.name}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {track.artists?.map((a: any) => a.name).join(", ")}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-center p-4">
                <Link
                  href="/library/tracks"
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  View all songs
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          )}
        </div>
      </div>
    </section>
  );
}

function SavedAlbumsSection() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { playUri } = useSpotify();

  useEffect(() => {
    setLoading(true);
    getUserSavedAlbums()
      .then((data) => {
        setAlbums(data?.items?.map((item: any) => item.album) || []);
        setError(null);
      })
      .catch((e) => setError("Failed to load saved albums."))
      .finally(() => setLoading(false));
  }, []);

  const visibleAlbums = showAll ? albums : albums.slice(0, 9);

  return (
    <section className="w-full max-w-5xl mx-auto backdrop-blur-sm">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-green-500/10 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-600/5 rounded-full blur-xl" />

        <h2 className="flex items-center gap-3 text-2xl font-semibold mb-8 text-green-100 tracking-tight px-6 py-3 rounded-2xl bg-gradient-to-r from-zinc-950/90 to-green-950/80 border-b border-green-900/60 group shadow-lg">
          <span className="inline-flex items-center justify-center p-2 bg-green-900/60 rounded-lg shadow-inner mr-1 group-hover:bg-green-800/60 transition-colors">
            <GalleryVerticalEnd className="h-6 w-6 text-green-300" />
          </span>
          Your Saved Albums
        </h2>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loading className="scale-150" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-900/20 border border-red-800/50 text-red-300 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            {error}
          </div>
        ) : albums.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 flex flex-col items-center gap-3">
            <GalleryVerticalEnd className="w-12 h-12 text-zinc-600 mb-2" />
            <div className="text-center">
              <div className="font-medium mb-1">No saved albums found</div>
              <div className="text-sm text-zinc-500">
                Albums you save will appear here
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Browse music
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal scroll, Desktop: grid */}
            <div className="hide-scrollbar overflow-hidden">
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x md:grid md:grid-cols-3 lg:grid-cols-3 md:gap-7 md:gap-y-9 md:overflow-x-visible">
                {visibleAlbums.map((album: any, idx: number) => (
                  <UniversalContextMenu
                    type="album"
                    id={album.id}
                    artists={album.artists}
                    key={album.id}
                  >
                    <div
                      className="relative group bg-gradient-to-br from-zinc-800/90 via-zinc-900/95 to-black rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 border border-zinc-700/50 hover:border-green-700/50 flex-shrink-0 min-w-[180px] max-w-[220px] snap-center md:min-w-0 md:max-w-none"
                      style={{
                        width: "100%",
                        transform: `perspective(1000px) rotateY(0deg)`,
                        transition: "transform 0.5s ease",
                      }}
                    >
                      <div className="relative p-3 pt-4">
                        <div className="relative overflow-hidden rounded-lg mb-3 group-hover:shadow-[0_0_15px_rgba(74,222,128,0.2)] transition duration-500">
                          <motion.img
                            src={
                              album.images?.[0]?.url ||
                              "/placeholder.svg?height=200&width=200"
                            }
                            alt={album.name}
                            className="w-full aspect-square object-cover shadow-md group-hover:scale-110 transition duration-700 ease-out"
                            layoutId={`album-cover-${album.id}`}
                          />
                          {album.uri && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label={`Play album: ${album.name}`}
                              className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 bg-green-600/90 hover:bg-green-700 text-white shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                playUri(album.uri);
                              }}
                            >
                              <Play className="w-5 h-5" />
                            </Button>
                          )}
                        </div>
                        <div className="px-1">
                          <div className="font-semibold text-white truncate mb-1 text-base group-hover:text-green-300 transition-colors">
                            {album.name}
                          </div>
                          <div className="text-xs text-zinc-400 mb-1 group-hover:text-zinc-300 transition-colors truncate">
                            {album.artists?.map((a: any) => a.name).join(", ")}
                          </div>
                          <div className="text-xs text-zinc-500 mb-4">
                            {album.tracks?.total ?? 0} tracks
                          </div>
                        </div>
                        <Link
                          href={`/albums/${album.id}`}
                          className="absolute inset-0"
                          aria-label={`View album: ${album.name}`}
                        />
                      </div>

                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                  </UniversalContextMenu>
                ))}
              </div>
            </div>

            {albums.length > 9 && (
              <div className="flex justify-center mt-8">
                <button
                  className="group px-5 py-2.5 rounded-full bg-gradient-to-r from-green-800 to-green-700 text-white hover:from-green-700 hover:to-green-600 transition-all duration-300 text-sm font-semibold shadow-lg border border-green-700/50 hover:border-green-500/50 flex items-center gap-2"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? (
                    <>
                      <svg
                        className="w-4 h-4 text-green-300 group-hover:-translate-y-0.5 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 text-green-300 group-hover:translate-y-0.5 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                      Show more ({albums.length - 9} more)
                    </>
                  )}
                </button>
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-green-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-green-400/5 rounded-full blur-3xl" />
      </div>

      {/* Connection status alert */}
      {connectionStatus.checking && (
        <Alert className="m-6 bg-blue-900/30 border-blue-800 backdrop-blur-sm shadow-lg animate-fade-in">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
          <AlertTitle className="text-blue-200 font-semibold">
            Checking Spotify connection...
          </AlertTitle>
          <AlertDescription className="text-blue-300">
            Please wait while we verify your connection to the Spotify API.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection error alert */}
      {!connectionStatus.checking && !connectionStatus.connected && (
        <Alert
          variant="destructive"
          className="m-6 bg-red-950/60 border-red-800 backdrop-blur-sm shadow-lg animate-fade-in"
        >
          <AlertCircle className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-200 font-semibold">
            Connection Error
          </AlertTitle>
          <AlertDescription className="text-red-300">
            {connectionStatus.error}
            <div className="flex flex-wrap gap-3 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshConnection}
                className="bg-red-950/60 border-red-800 text-red-200 hover:bg-red-900/60 hover:text-red-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="bg-red-950/60 border-red-800 text-red-200 hover:bg-red-900/60 hover:text-red-100"
              >
                Return to Login
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main content with enhanced spacing and layering */}
      <div className="relative z-10 px-4 py-8 md:p-10 max-w-7xl mx-auto">
        {connectionStatus.connected ? (
          <div className="w-full flex flex-col gap-12 md:gap-20 pb-16 mx-auto">
            {/* Profile overview section */}
            {/* <ProfileOverview /> */}

            {/* Saved Songs Section */}
            <SavedSongsSection />

            {/* Playlists and Albums section */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">
              <PlaylistsSection />
              <SavedAlbumsSection />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
