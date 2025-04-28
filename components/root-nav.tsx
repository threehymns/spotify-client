"use client"

import { useRouter, usePathname } from "next/navigation"
import Player from "@/components/player"
import UserProfile from "@/components/user-profile"
import { Button } from "@/components/ui/button"
import { Home, Search, Library, LogOut, Music2, DiscAlbum } from "lucide-react"
import React, { useState } from "react";
import { SearchContext } from "@/context/search-context";

export default function RootNav({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth")

  const [searchQuery, setSearchQuery] = useState("");

  if (isAuthRoute) return <>{children}</>;

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="flex flex-col h-screen bg-black text-white">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-zinc-950/80 backdrop-blur-xl shadow-2xl p-6 hidden md:block relative border-r border-zinc-900">
            <div className="flex items-center mb-10">
              <Music2 className="h-9 w-9 text-green-500 mr-2 drop-shadow" />
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Pulse</h1>
            </div>
            <nav className="flex flex-col gap-2">
              {[{
                label: 'Home',
                icon: Home,
                path: '/'
              }, {
                label: 'Search',
                icon: Search,
                path: '/search'
              }, {
                label: 'Playlists',
                icon: Library,
                path: '/playlists'
              }, {
                label: 'Albums',
                icon: DiscAlbum,
                path: '/albums'
              }, {
                label: 'Songs',
                icon: Music2,
                path: '/songs'
              }].map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  className={`flex items-center w-full px-4 py-2 rounded-xl transition group text-base font-semibold focus:outline-none
                  ${pathname === path
                      ? 'bg-green-900/40 border-l-4 border-green-500 text-green-100'
                      : 'text-zinc-200 hover:bg-green-900/30 hover:text-green-300'}
                `}
                  onClick={() => router.push(path)}
                >
                  <Icon className={`mr-3 h-6 w-6 ${pathname === path ? 'text-green-300' : 'text-zinc-400 group-hover:text-green-300'}`} />
                  {label}
                </button>
              ))}

            </nav>
            <div className="absolute bottom-4 left-4 right-4 gap-3 flex flex-col border-t border-zinc-800 pt-4 mt-4">
              <UserProfile />
              <Button
                variant="ghost"
                className="w-full justify-start text-zinc-400 hover:text-white"
                onClick={() => {
                  localStorage.clear();
                  router.push("/login")
                }}
              >
                <LogOut className="mr-2 h-5 w-5" /> Logout
              </Button>
              <div className="h-16 w-full">
              </div>
            </div>
          </div>
          {/* Main content with search bar */}
          <div className="flex-1 overflow-auto bg-gradient-to-b from-zinc-900 to-black">
            <div className="sticky top-0 z-30 bg-gradient-to-b from-zinc-950/95 to-transparent px-6 pt-4 pb-2 flex items-center gap-3">
              <div className="relative w-full max-w-sm mx-auto">
                <Search className="absolute size-5 left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 z-10" />
                <input
                  type="search"
                  placeholder="What do you want to play?"
                  className="pl-12 pr-4 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 text-white w-full text-lg shadow-md backdrop-blur backdrop-saturate-200 transition-all duration-200 placeholder:text-zinc-500 focus:shadow-lg outline-none"
                  style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (pathname !== "/search") {
                      router.push("/search");
                    }
                  }}
                />
              </div>
            </div>
            {children}
            <Player />
          </div>
        </div>
      </div>
    </SearchContext.Provider>
  )
}
