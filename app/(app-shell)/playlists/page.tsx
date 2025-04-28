"use client"

import React from "react"
import PlaylistView from "@/components/playlist-view"
import { Headphones, ListMusic } from "lucide-react"

export default function PlaylistsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
          <ListMusic className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
          <p className="text-zinc-400 mt-1">Create, manage and enjoy your music collections</p>
        </div>
      </div>
      <PlaylistView />
    </div>
  )
}
