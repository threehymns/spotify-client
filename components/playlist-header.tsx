"use client";

import { memo, useMemo } from "react";
import { motion } from "motion/react";
import {
  Heart,
  ListMusic,
  Play,
  Share2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SpotifyPlaylist } from "@/lib/spotify-api";
import DOMPurify from 'isomorphic-dompurify';

// Utility function to decode and sanitize HTML entities
const decodeAndSanitize = (text: string): string => {
  if (typeof document === 'undefined') {
    return DOMPurify.sanitize(text);
  }
  const div = document.createElement('div');
  div.innerHTML = text;
  const decodedText = div.textContent || '';
  return DOMPurify.sanitize(decodedText);
};

interface PlaylistHeaderProps {
  playlist: SpotifyPlaylist;
  totalDuration: string;
  dominantColor?: number[] | null;
  isOwner: boolean;
  isLiked: boolean;
  isSaving: boolean;
  onPlay: () => void;
  onLikeToggle: () => Promise<void>;
}

export const PlaylistHeader = memo(function PlaylistHeader({
  playlist,
  totalDuration,
  dominantColor,
  isOwner,
  isLiked,
  isSaving,
  onPlay,
  onLikeToggle,
}: PlaylistHeaderProps) {
  const gradientStyle = playlist.images?.[0]?.url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(88, 28, 135, 0.5), rgba(0, 0, 0, 0.9)), url(${playlist.images[0].url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: "linear-gradient(to bottom, rgba(88, 28, 135, 0.3), rgba(0, 0, 0, 0.95))",
      };

  return (
    <div className="relative">
      <div
        className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-zinc-900/60 to-black z-0"
        style={{
          ...gradientStyle,
          filter: "blur(30px)",
          opacity: 0.6,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
          <motion.div
            layoutId={`playlist-cover-${playlist.id}`}
            className="w-52 h-52 md:w-60 md:h-60 flex-shrink-0 shadow-2xl rounded-md overflow-hidden"
            initial={{ opacity: 0.8, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={playlist.images?.[0]?.url || "/placeholder.svg?height=240&width=240"}
              alt={playlist.name}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </motion.div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Badge
              variant="outline"
              className="mb-2 uppercase text-xs font-semibold tracking-wide text-white bg-white/10 backdrop-blur-sm border-white/20 px-3 py-1"
            >
              <ListMusic className="w-3 h-3 mr-1" /> Playlist
            </Badge>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {playlist.name}
            </motion.h1>
            <motion.div
              className="text-zinc-300 mb-3 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {useMemo(() => decodeAndSanitize(playlist.description || ""), [playlist.description])}
            </motion.div>
            <motion.div
              className="text-zinc-400 text-sm flex items-center flex-wrap gap-x-2 mb-4 justify-center md:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="font-medium text-white">
                {totalDuration}
              </span>
              <span className="font-medium text-white">
                {playlist.owner?.display_name || "Unknown"}
              </span>
              <span>•</span>
              <span>{playlist.tracks?.total} tracks</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-3 flex-wrap justify-center md:justify-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                onClick={onPlay}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8"
                style={{
                  backgroundColor: dominantColor
                    ? `rgb(${dominantColor[0]},${dominantColor[1]},${dominantColor[2]})`
                    : "",
                  borderColor: dominantColor
                    ? `rgb(${dominantColor[0]},${dominantColor[1]},${dominantColor[2]})`
                    : "",
                }}
              >
                <Play className="h-5 w-5 mr-2 fill-current" /> Play
              </Button>
              {!isOwner && (
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full border-zinc-700 ${
                    isLiked
                      ? "text-green-500 hover:text-green-500"
                      : "text-zinc-300 hover:text-white"
                  } hover:bg-zinc-800`}
                  disabled={isSaving}
                  onClick={() => onLikeToggle()}
                >
                  <Heart
                    className="h-5 w-5"
                    fill={isLiked ? "currentColor" : "none"}
                  />
                </Button>
              )}
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
  );
});