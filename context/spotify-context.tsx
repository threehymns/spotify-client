"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { spotifyService } from "@/lib/spotify-service";
import { useAuth } from "./auth-context";

type SpotifyContextType = {
  currentTrack: any;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  position: number;
  duration: number;
  play: (uri: string) => void;
  togglePlayback: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  setVolume: (volume: number) => void;
  seekTo: (position: number) => void;
  isAlbumSaved: (albumId: string) => Promise<boolean>;
  toggleSaveAlbum: (albumId: string, save: boolean) => Promise<void>;
  isPlaylistFollowed: (playlistId: string) => Promise<boolean>;
  toggleFollowPlaylist: (playlistId: string, follow: boolean) => Promise<void>;
  isArtistFollowed: (artistId: string) => Promise<boolean>;
  toggleFollowArtist: (artistId: string, follow: boolean) => Promise<void>;
  areTracksSaved: (trackIds: string[]) => Promise<boolean[]>;
  toggleSaveTrack: (trackId: string, save: boolean) => Promise<void>;
};

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const { api, user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const handleStateChange = (state: any) => {
      if (state) {
        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setPosition(state.position / 1000);
        setDuration(state.duration / 1000);
        setVolume(state.volume * 100);
        setIsMuted(state.volume === 0);
      }
    };

    spotifyService.onStateChange = handleStateChange;

    return () => {
      spotifyService.onStateChange = null;
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      volume,
      isMuted,
      position,
      duration,
      play: (uri: string) => spotifyService.play(uri),
      togglePlayback: () => spotifyService.togglePlayback(),
      skipToNext: () => spotifyService.skipToNext(),
      skipToPrevious: () => spotifyService.skipToPrevious(),
      setVolume: (vol: number) => spotifyService.setVolume(vol),
      seekTo: (pos: number) => spotifyService.seekTo(pos),
      isAlbumSaved: async (albumId: string) => {
        if (!api) return false;
        const results = await api.checkSavedAlbums([albumId]);
        return results[0];
      },
      toggleSaveAlbum: async (albumId: string, save: boolean) => {
        if (!api) return;
        if (save) {
          await api.saveAlbums([albumId]);
        } else {
          await api.removeSavedAlbums([albumId]);
        }
      },
      isPlaylistFollowed: async (playlistId: string) => {
        if (!api || !user) return false;
        const results = await api.checkPlaylistFollowed(playlistId, user.id);
        return results[0];
      },
      toggleFollowPlaylist: async (playlistId: string, follow: boolean) => {
        if (!api) return;
        if (follow) {
          await api.followPlaylist(playlistId);
        } else {
          await api.unfollowPlaylist(playlistId);
        }
      },
      isArtistFollowed: async (artistId: string) => {
        if (!api) return false;
        const results = await api.checkFollowingArtists([artistId]);
        return results[0];
      },
      toggleFollowArtist: async (artistId: string, follow: boolean) => {
        if (!api) return;
        if (follow) {
          await api.followArtists([artistId]);
        } else {
          await api.unfollowArtists([artistId]);
        }
      },
      areTracksSaved: async (trackIds: string[]) => {
        if (!api) return [];
        return api.checkSavedTracks(trackIds);
      },
      toggleSaveTrack: async (trackId: string, save: boolean) => {
        if (!api) return;
        if (save) {
          await api.saveTracks([trackId]);
        } else {
          await api.removeSavedTracks([trackId]);
        }
      },
    }),
    [
      currentTrack,
      isPlaying,
      volume,
      isMuted,
      position,
      duration,
      api,
      user,
    ],
  );

  return (
    <SpotifyContext.Provider value={contextValue}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return context;
}