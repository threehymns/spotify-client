"use client";
import { useEffect, useState, useCallback, use, memo, useRef } from "react";
import { ListMusic, Clock } from "lucide-react";

// Spotify API
import {
  getPlaylist,
  getPlaylistTracks,
  getUserProfile,
  SPOTIFY_API_LIMITS,
} from "@/lib/spotify-api";
import type { SpotifyPlaylist, SpotifyTrack } from "@/lib/spotify-api";

// Context and hooks
import { useSpotify } from "@/context/spotify-context";
import { useDominantColorWorker } from "@/hooks/useDominantColorWorker";

// Components
import { Button } from "@/components/ui/button";
import Loading from "@/components/loading";
import SongListing from "@/components/song-listing";
import { PlaylistHeader } from "@/components/playlist-header";

interface PlaylistTracksProps {
  tracks: SpotifyTrack[];
  totalTracks: number;
  isLoading: boolean;
  error: Error | null;
  onLoadMore: () => void;
}

export const PlaylistTracks = memo(function PlaylistTracks({
  tracks,
  totalTracks,
  isLoading,
  error,
  onLoadMore,
}: PlaylistTracksProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-zinc-900/20 p-4 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800">
        <div className="p-4 pt-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="p-1.5 bg-green-900/50 rounded-lg border border-green-700/30">
              <ListMusic className="h-4 w-4 text-green-300" />
            </div>
            Tracks
          </h2>
          <Button variant="ghost" className="text-zinc-400 hover:text-white">
            <Clock className="h-4 w-4" />
          </Button>
        </div>

        <SongListing tracks={tracks} />

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loading />
          </div>
        )}

        {!isLoading && !error && tracks.length === 0 && (
          <div className="text-center py-8 text-zinc-400">
            No tracks found in this playlist
          </div>
        )}

        {!isLoading && tracks.length > 0 && (
          <div className="text-center py-4 text-zinc-400 text-sm">
            Showing {tracks.length}/{totalTracks} tracks
          </div>
        )}

        {error && (
          <div className="text-red-400 text-center p-4">
            Failed to load more tracks: {error.message}
          </div>
        )}

        {tracks.length < totalTracks && !isLoading && (
          <button
            onClick={onLoadMore}
            className="w-full mt-4 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Load More Tracks
          </button>
        )}
      </div>
    </div>
  );
});

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PlaylistDetailPage({
  params,
}: PlaylistDetailPageProps) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  
  type FetchState = {
    loading: boolean;
    error: Error | null;
    type: 'playlist' | 'tracks' | 'follow-status' | null;
  };
  
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    type: null
  });

  const handleFetchError = useCallback((error: unknown, type: FetchState['type']) => {
    console.error(`Failed to load ${type}:`, error);
    setFetchState(prev => ({
      ...prev,
      loading: false,
      error: error instanceof Error ? error : new Error(`Failed to load ${type}`),
      type
    }));
  }, []);

  const loadMoreTracks = useCallback(async (signal?: AbortSignal) => {
    try {
      setFetchState({ loading: true, error: null, type: 'tracks' });

      const tracksResponse = await getPlaylistTracks(
        id,
        SPOTIFY_API_LIMITS.PLAYLIST_ITEMS,
        tracks.length,
        signal
      );

      setTracks((prevTracks) => {
        const uniqueNewTracks = tracksResponse.items
          .map((item: any) => item.track)
          .filter(
            (newTrack: SpotifyTrack) =>
              !prevTracks.some(
                (existingTrack) => existingTrack.id === newTrack.id
              )
          );

        return [...prevTracks, ...uniqueNewTracks];
      });
      setTotalTracks(tracksResponse.total);
    } catch (error) {
      handleFetchError(error, 'tracks');
    }
  }, [id, tracks.length, handleFetchError]);
  const { playUri } = useSpotify();

  // Load initial data
  useEffect(() => {
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;
    
    const loadInitialData = async () => {
      try {
        setFetchState({ loading: true, error: null, type: 'playlist' });
        
        // Load playlist and owner status together
        const [playlistData, userProfile] = await Promise.all([
          getPlaylist(id, signal),
          getUserProfile(signal)
        ]);
        
        if (signal.aborted) return;
        
        setPlaylist(playlistData);
        setTotalTracks(playlistData.tracks?.total || 0);
        setIsOwner(playlistData.owner.id === userProfile.id);
        
        // Only load tracks if playlist was successfully loaded
        if (playlistData.tracks?.total > 0) {
          await loadMoreTracks(signal);
        }
        
        if (!signal.aborted) {
          setFetchState({ loading: false, error: null, type: null });
        }
      } catch (error) {
        if (!signal.aborted) {
          handleFetchError(error, 'playlist');
        }
      }
    };

    loadInitialData();
    return () => {
      if (controllerRef.current && !controllerRef.current.signal.aborted) {
        try {
          controllerRef.current.abort();
        } catch (error) {
          // Ignore abort errors
        }
      }
      controllerRef.current = null;
    };
  }, [id, loadMoreTracks, handleFetchError]);

  // Extract dominant color from playlist image
  const imgUrl = playlist?.images?.[0]?.url;
  const { color } = useDominantColorWorker(id, imgUrl);

  // Get user profile and follow status
  const { isPlaylistFollowed, toggleFollowPlaylist } = useSpotify();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load follow status only if not owner
  useEffect(() => {
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    const loadFollowStatus = async () => {
      if (!isOwner) {
        try {
          setFetchState({ loading: true, error: null, type: 'follow-status' });
          const followed = await isPlaylistFollowed(id);
          if (!signal.aborted) {
            setIsLiked(followed);
          }
        } catch (error) {
          if (!signal.aborted) {
            handleFetchError(error, 'follow-status');
          }
        } finally {
          if (!signal.aborted) {
            setFetchState(prev => prev.type === 'follow-status' ?
              { ...prev, loading: false } : prev);
          }
        }
      }
    };

    loadFollowStatus();
    return () => {
      if (controllerRef.current && !controllerRef.current.signal.aborted) {
        try {
          controllerRef.current.abort();
        } catch (error) {
          // Ignore abort errors
        }
      }
      controllerRef.current = null;
    };
  }, [id, isOwner, isPlaylistFollowed, handleFetchError]);

  // Load initial follow status
  useEffect(() => {
    async function checkInitialLikeStatus() {
      if (id && !isOwner) {
        try {
          const followed = await isPlaylistFollowed(id);
          setIsLiked(followed);
        } catch (error) {
          console.error("Failed to load initial like status:", error);
        }
      }
    }
    checkInitialLikeStatus();
  }, [id, isOwner, isPlaylistFollowed]);

  if (fetchState.loading && !playlist) return <Loading />;
  if (fetchState.error && !playlist && fetchState.type === 'playlist')
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-red-400 text-center flex flex-col items-center">
          <span className="mb-2 text-4xl">⚠️</span>
          <h3 className="text-xl font-semibold mb-1">Error Loading Playlist</h3>
          <p>{fetchState.error.message}</p>
        </div>
      </div>
    );
  if (!fetchState.loading && !playlist)
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 text-zinc-400 text-center">
          Playlist not found.
        </div>
      </div>
    );

  // Calculate total duration
  const totalDuration = tracks.reduce(
    (acc, track) => acc + (track.duration_ms || 0),
    0
  );
  const totalMinutes = Math.floor(totalDuration / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const formattedDuration = totalHours > 0 ? `${totalHours} hr ${totalMinutes % 60} min` : `${totalMinutes} min`;

  return (
    <div className="min-h-screen">
      <PlaylistHeader
        playlist={playlist!}
        totalDuration={formattedDuration}
        dominantColor={color}
        isOwner={isOwner}
        isLiked={isLiked}
        isSaving={isSaving}
        onPlay={() => playUri(playlist!.uri)}
        onLikeToggle={async () => {
          if (isSaving) return;
          try {
            setIsSaving(true);
            await toggleFollowPlaylist(id, !isLiked);
            setIsLiked(!isLiked);
          } catch (error) {
            console.error("Failed to toggle follow status:", error);
            const currentStatus = await isPlaylistFollowed(id);
            setIsLiked(currentStatus);
          } finally {
            setIsSaving(false);
          }
        }}
      />

      <PlaylistTracks
        tracks={tracks}
        totalTracks={totalTracks}
        isLoading={fetchState.type === 'tracks' && fetchState.loading}
        error={fetchState.type === 'tracks' ? fetchState.error : null}
        onLoadMore={loadMoreTracks}
      />
    </div>
  );
}
