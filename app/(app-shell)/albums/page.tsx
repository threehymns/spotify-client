"use client";

import React, { useEffect, useState } from "react";
import { getUserSavedAlbums } from "@/lib/spotify-api";
import { useSpotify } from "@/context/spotify-context";
import { AlbumCard } from "@/components/album-card";
import { GalleryVerticalEnd, LibraryIcon, MusicIcon } from "lucide-react";
import { motion } from "motion/react";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const data = await getUserSavedAlbums();
        setAlbums(data.items || []);
      } catch (e) {
        setError(true);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 md:p-8 pb-24 min-h-screen bg-gradient-to-b from-zinc-900/80 to-black/95">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
              <GalleryVerticalEnd className="h-8 w-8 text-green-500" />
              Your Collection
            </h1>
            <p className="text-zinc-400">Your saved albums from Spotify</p>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-zinc-400 animate-pulse">
              Loading your collection...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MusicIcon className="h-16 w-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Unable to load albums
            </h2>
            <p className="text-zinc-400 max-w-md">
              There was an error loading your saved albums. Please try again
              later.
            </p>
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LibraryIcon className="h-16 w-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No saved albums found
            </h2>
            <p className="text-zinc-400 max-w-md">
              Start saving albums to your library to see them here.
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {albums.map(
              ({
                album,
              }: {
                album: {
                  id: string;
                  name: string;
                  images: any[];
                  artists: any[];
                  uri: string;
                };
              }) => (
                <motion.div key={album.id} variants={item}>
                  <AlbumCard
                    album={album}
                    href={`/albums/${album.id}`}
                    className="h-full transition-transform duration-300 hover:scale-[1.02] backdrop-blur-sm hover:backdrop-blur-md"
                  />
                </motion.div>
              ),
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
