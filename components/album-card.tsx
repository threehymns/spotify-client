"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useDominantColorWorker } from '@/hooks/useDominantColorWorker';
import { useInView } from 'react-intersection-observer';
import { cn } from "@/lib/utils";
import { useSpotify } from "@/context/spotify-context";
import UniversalContextMenu from "./universal-context-menu";

interface AlbumCardProps {
  album: {
    id: string;
    name: string;
    images: any[];
    artists?: { id: string; name: string }[];
    uri?: string;
    release_date?: string;
  };
  showArtists?: boolean;
  showPlayButton?: boolean;
  className?: string;
  href?: string;
}

export function AlbumCard({ album, showArtists = true, showPlayButton = true, className = "", href }: AlbumCardProps) {
  const { play } = useSpotify();
  const imgUrl = album.images[0]?.url;
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });
  const { color } = useDominantColorWorker(album.id, inView ? imgUrl : undefined);
  const bg = Array.isArray(color)
    ? `rgb(${color.map(c => Math.max(0, c - (c * 0.4))).join(',')})`
    : '#222';

  return (
    <div ref={ref} className={cn("relative p-4 rounded-xl overflow-hidden flex flex-col group", className)} style={{ background: bg }}>
      {href && (
        <UniversalContextMenu type="album" id={album.id} artists={album.artists}>
          <Link
            href={href}
            aria-label={album.name}
            className="z-10 absolute inset-1 rounded focus:outline-none focus:ring-4 focus:ring-green-500"
          />
        </UniversalContextMenu>
      )}
      <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow">
        <img src={imgUrl || "/placeholder.svg?height=200&width=200"} alt={album.name} className="w-full h-full object-cover" />
        {showPlayButton && play && album.uri && (
          <Button
            className="absolute bottom-0 right-0 m-auto h-1/4 w-1/4 flex items-center justify-center rounded-tl-3xl text-white opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 focus:opacity-100 focus:translate-y-0 transition-all duration-200 z-20 brightness-125 hover:brightness-150"
            style={{ backgroundColor: bg }}
            variant="default"
            aria-label={`Play ${album.name}`}
            tabIndex={0}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              play(album.uri || '');
            }}
          >
            <Play className="!size-2/3" fill="white" />
          </Button>
        )}
      </div>
      <div className="py-2 px-3 flex-1 flex flex-col relative">
        <div className="font-medium truncate z-20">
          {href ? (
            <span>{album.name}</span>
          ) : (
            <Link href={`/albums/${album.id}`} className="hover:underline">{album.name}</Link>
          )}
        </div>
        <div className="text-white/60 truncate flex justify-between items-center">
          {showArtists && album.artists && (
            <span className="z-20 text-xs whitespace-normal">
            {album.artists.map(({ id, name }, i) => (
              <React.Fragment key={id}>
                <UniversalContextMenu type="artist" id={id}>
                  <Link href={`/artists/${id}`} className="z-20 text-xs hover:underline">
                    {name}
                  </Link>
                </UniversalContextMenu>
                {album.artists && album.artists.length > 1 && i < album.artists.length - 1 ? ", " : ""}
              </React.Fragment>
            ))}
            </span>
          )}
          {album.release_date && (
            <span className="z-20 text-xs">{album.release_date.slice(0, 4)}</span>
          )}
        </div>
      </div>
      {/* Gradient overlay at bottom */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-2"
        style={{background: "linear-gradient(to top, rgba(24,24,24,0.5) 60%, transparent 100%)"}}
      />
    </div>
  );
}
