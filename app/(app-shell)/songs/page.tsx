"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import type { z } from "zod";
import {
  SpotifyTrack,
  SpotifyPaging,
  SpotifySavedTrack,
} from "@/lib/zod-schemas";
import SongListing from "@/components/song-listing";
import { PlaylistHeader } from "@/components/playlist-header";
import { ListMusic } from "lucide-react";
import Loading from "@/components/loading";
import { useDominantColorWorker } from "@/hooks/useDominantColorWorker";

export default function SavedSongsPage() {
  const { api } = useAuth();
  const [tracks, setTracks] = useState<z.infer<typeof SpotifyTrack>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextTracksUrl, setNextTracksUrl] = useState<string | null>(null);
  const [totalTracks, setTotalTracks] = useState(0);

  // Extract dominant color from playlist image
  const { color } = useDominantColorWorker(
    "liked-songs",
    "/liked-songs.png"
  );

  useEffect(() => {
    if (!api) return;
    const fetchSavedTracks = async () => {
      try {
        setLoading(true);
        const data = await api.getMySavedTracks();
        setTracks(data.items.map((item) => item?.track));
        setNextTracksUrl(data.next);
        setTotalTracks(data.total);
      } catch (error) {
        console.error("Failed to fetch saved tracks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedTracks();
  }, [api]);

  const loadMoreTracks = useCallback(async () => {
    if (!nextTracksUrl || !api) return;

    try {
      setLoadingMore(true);
      const tracksResponse = await api.fetchUrl(
        nextTracksUrl,
        SpotifyPaging(SpotifySavedTrack),
      );
      setTracks((prev) => [
        ...prev,
        ...tracksResponse.items.map((item) => item?.track).filter(Boolean),
      ]);
      setNextTracksUrl(tracksResponse.next);
    } catch (error) {
      console.error("Failed to load more tracks:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [nextTracksUrl, api]);

  const playlist = {
    name: "Liked Songs",
    description: "Your saved tracks from Spotify.",
    images: [{ url: "/liked-songs.png" }],
    owner: { display_name: "You" },
    followers: { total: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PlaylistHeader
        playlist={playlist}
        isOwner={true}
        isLiked={false}
        isSaving={false}
        onPlay={() => {}}
        onLikeToggle={async () => {}}
        totalDuration=""
        dominantColor={color}
      />
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-zinc-900/20 p-4 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800">
              <div className="p-4 pt-0 flex items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-1.5 bg-green-900/50 rounded-lg border border-green-700/30">
                    <ListMusic className="h-4 w-4 text-green-300" />
                  </div>
                  Tracks
                </h2>
              </div>
              <SongListing tracks={tracks} />
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loading />
                </div>
              )}
              {!loading && tracks.length > 0 && (
                <div className="text-center py-4 text-zinc-400 text-sm">
                  Showing {tracks.length}/{totalTracks} tracks
                </div>
              )}
              {nextTracksUrl && !loadingMore && (
                <button
                  type="button"
                  onClick={loadMoreTracks}
                  className="w-full mt-4 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Load More Tracks
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
