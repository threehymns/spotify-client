"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, GalleryVerticalEnd, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import SongListing from "@/components/song-listing"
import { motion } from "motion/react"
import { useSpotify } from "@/context/spotify-context"
import { useEffect, useState } from "react"
import { getUserPlaylists, getUserSavedTracks, getUserSavedAlbums, getUserProfile } from "@/lib/spotify-api"
import UniversalContextMenu from "@/components/universal-context-menu"
import Loading from "@/components/loading"

function ProfileOverview() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserProfile()
      .then(data => {
        setProfile(data);
        setError(null);
      })
      .catch(e => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flex flex-col sm:flex-row items-center gap-6 mb-8 bg-gradient-to-r from-green-900/40 to-zinc-900/20 p-4 sm:p-6 rounded-xl shadow w-full max-w-5xl mx-auto">
      {loading ? (
        <Loading text="Loading profile..." />
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : profile ? (
        <>
          <img src={profile.images?.[0]?.url || "/placeholder.svg?height=96&width=96"} alt={profile.display_name} className="w-24 h-24 rounded-full border-4 border-green-600 shadow-lg" />
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl font-bold text-white mb-1">Welcome, {profile.display_name}!</h1>
            <div className="text-zinc-300 mb-1">{profile.email}</div>
            <div className="text-green-300 font-medium">{profile.followers?.total ?? 0} followers</div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function PlaylistsSection() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    getUserPlaylists()
      .then(data => {
        setPlaylists(data?.items || []);
        setError(null);
      })
      .catch(e => setError("Failed to load playlists."))
      .finally(() => setLoading(false));
  }, []);

  const visiblePlaylists = showAll ? playlists : playlists.slice(0, 9);

  return (
    <section className="w-full max-w-5xl mx-auto mb-12">
      <h2
        className="flex items-center gap-3 text-2xl font-semibold mb-7 text-green-100 tracking-tight px-4 py-2 rounded-xl bg-zinc-950/60 border-b border-green-900/40 group"
      >
        <span className="inline-flex items-center justify-center mr-2">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-green-300"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </span>
        Your Playlists
      </h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : playlists.length === 0 ? (
        <div className="text-zinc-400">No playlists found.</div>
      ) : (
        <>
          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="hide-scrollbar flex gap-6 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-3 lg:grid-cols-3 md:gap-7 md:gap-y-9 md:overflow-x-visible">
            {visiblePlaylists.map((playlist: any) => (
            <UniversalContextMenu type="playlist" id={playlist.id} key={playlist.id}> 
              <div
                className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/60 rounded-xl p-4 flex flex-col shadow-lg group hover:shadow-xl hover:scale-[1.03] hover:bg-green-950/30 transition border border-zinc-700 flex-shrink-0 min-w-[180px] max-w-[220px] snap-center md:min-w-0 md:max-w-none md:snap-none"
                style={{ width: '100%' }}
              >
                <motion.img
                  src={playlist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                  alt={playlist.name}
                  className="rounded-md w-full aspect-square object-cover mb-3 shadow-md border border-zinc-700"
                  layoutId={`playlist-cover-${playlist.id}`}
                />
                <div className="font-semibold text-white truncate mb-1 text-base">{playlist.name}</div>
                <div className="text-xs text-zinc-400 mb-2">{playlist.tracks?.total ?? 0} tracks</div>
                  <Link href={`/playlists/${playlist.id}`} className="absolute inset-0" aria-label={`View playlist: ${playlist.name}`} />
              </div>
            </UniversalContextMenu>
            ))}
          </div>
          {playlists.length > 9 && (
            <div className="flex justify-center mt-4">
              <button
                className="px-5 py-2 rounded-full bg-gradient-to-r from-green-700 to-green-600 text-white hover:from-green-800 hover:to-green-700 transition text-sm font-semibold shadow-lg border-2 border-green-900"
                onClick={() => setShowAll(v => !v)}
              >
                {showAll ? 'Show less' : `Show more (${playlists.length - 9} more)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SavedSongsSection() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserSavedTracks()
      .then(data => {
        setTracks(data?.items?.map((item: any) => item.track) || []);
        setError(null);
      })
      .catch(e => setError("Failed to load saved songs."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-3 text-green-100 bg-zinc-950/60 rounded-xl px-4 py-2 border-b border-green-900/40">Your Saved Songs</h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : tracks.length === 0 ? (
        <div className="text-zinc-400">No saved songs found.</div>
      ) : (
        <SongListing tracks={tracks.slice(0, 10)} />
      )}
      <Link href="/songs" className="text-green-400 hover:underline text-xs font-medium mt-2 inline-block">See all saved songs</Link>
    </section>
  );
}

function SavedAlbumsSection() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { playUri } = useSpotify()

  useEffect(() => {
    setLoading(true);
    getUserSavedAlbums()
      .then(data => {
        setAlbums(data?.items?.map((item: any) => item.album) || []);
        setError(null);
      })
      .catch(e => setError("Failed to load saved albums."))
      .finally(() => setLoading(false));
  }, []);

  const visibleAlbums = showAll ? albums : albums.slice(0, 9);

  return (
    <section className="w-full max-w-5xl mx-auto mb-12">
      <h2
        className="flex items-center gap-3 text-2xl font-semibold mb-7 text-green-100 tracking-tight px-4 py-2 rounded-xl bg-zinc-950/60 border-b border-green-900/40 group"
      >
        <span className="inline-flex items-center justify-center mr-2">
          <GalleryVerticalEnd className="h-6 w-6 text-green-300" />
        </span>
        Your Saved Albums
      </h2>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : albums.length === 0 ? (
        <div className="text-zinc-400">No saved albums found.</div>
      ) : (
        <>
          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="hide-scrollbar flex gap-6 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-3 lg:grid-cols-3 md:gap-7 md:gap-y-9 md:overflow-x-visible">
            {visibleAlbums.map((album: any) => (
              <UniversalContextMenu type="album" id={album.id} artists={album.artists} key={album.id}>
                <div
                  className="relative flex-shrink-0 min-w-[180px] max-w-[220px] snap-center md:min-w-0 md:max-w-none md:snap-none bg-gradient-to-br from-zinc-800/80 to-zinc-900/60 rounded-xl p-4 shadow-lg group hover:shadow-xl hover:scale-[1.03] hover:bg-green-950/30 transition border border-zinc-700"
                  style={{ width: '100%' }}
                >
                  <img
                    src={album.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                    alt={album.name}
                    className="rounded-md w-full aspect-square object-cover mb-3 shadow-md border border-zinc-700"
                  />
                  <div className="font-semibold text-white truncate mb-1 text-base">{album.name}</div>
                  <div className="text-xs text-zinc-400 mb-2">{album.tracks?.total ?? 0} tracks</div>
                  <Link href={`/albums/${album.id}`} className="absolute inset-0" aria-label={`View album: ${album.name}`} />
                </div>
              </UniversalContextMenu>
            ))}
          </div>
          {albums.length > 9 && (
            <div className="flex justify-center mt-4">
              <button
                className="px-5 py-2 rounded-full bg-gradient-to-r from-green-700 to-green-600 text-white hover:from-green-800 hover:to-green-700 transition text-sm font-semibold shadow-lg border-2 border-green-900"
                onClick={() => setShowAll(v => !v)}
              >
                {showAll ? 'Show less' : `Show more (${albums.length - 9} more)`}
              </button>
            </div>
          )}
        </>
      )}
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
    )
  }

  return (
    <div className="">

      {/* Connection status alert */}
      {connectionStatus.checking && (
        <Alert className="m-4 bg-blue-900/20 border-blue-900">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          <AlertTitle>Checking Spotify connection...</AlertTitle>
          <AlertDescription>Please wait while we verify your connection to the Spotify API.</AlertDescription>
        </Alert>
      )}

      {/* Connection error alert */}
      {!connectionStatus.checking && !connectionStatus.connected && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {connectionStatus.error}
            <Button variant="outline" size="sm" onClick={refreshConnection} className="ml-2 mt-2">
              Retry Connection
            </Button>
            <Button variant="outline" size="sm" onClick={() => logout()} className="ml-2 mt-2">
              Return to Login
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main content with enhanced spacing and layering */}
      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
        {connectionStatus.connected ? (
          <div className="w-full flex flex-col gap-16 pb-12 mx-auto">
            <div className="flex flex-col md:flex-row gap-12 w-full">
              <div className="flex-1 min-w-0">
                <PlaylistsSection />
              </div>
              <div className="flex-1 min-w-0">
                <SavedAlbumsSection />
              </div>
            </div>
            <div className="mt-10">
              <SavedSongsSection />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
