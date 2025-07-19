"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import type { SpotifyTrack } from "@/lib/zod-schemas";
import SongListing from "@/components/song-listing";
import { PlaylistHeader } from "@/components/playlist-header";


export default function SavedSongsPage() {
  const { api } = useAuth();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) return;
    const fetchSavedTracks = async () => {
      try {
        setLoading(true);
        const data = await api.getMySavedTracks();
        setTracks(data.items.map((item) => item.track));
      } catch (error) {
        console.error("Failed to fetch saved tracks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSavedTracks();
  }, [api]);

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
      />
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <SongListing tracks={tracks} />
        )}
      </div>
    </div>
  );
}