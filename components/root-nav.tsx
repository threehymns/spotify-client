"use client";

import { useRouter, usePathname } from "next/navigation";
import Player from "@/components/player";
import UserProfile from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Search,
  Library,
  LogOut,
  Music2,
  DiscAlbum,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import React, { useState } from "react";
import { SearchContext } from "@/context/search-context";

export default function RootNav({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  if (isAuthRoute) return <>{children}</>;

  return (
    <SidebarProvider>
      <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
        <div className="flex flex-col h-screen w-full bg-black text-white">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar>
              <SidebarContent className="relative p-6 bg-zinc-950/80 backdrop-blur-xl shadow-2xl border-r border-zinc-900">
                <div className="flex items-center mb-10">
                  <Music2 className="h-9 w-9 text-green-500 mr-2 drop-shadow" />
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">
                    Pulse
                  </h1>
                </div>
                <nav className="flex flex-col gap-2">
                  {[
                    {
                      label: "Home",
                      icon: Home,
                      path: "/",
                    },
                    {
                      label: "Search",
                      icon: Search,
                      path: "/search",
                      onClick: () => {
                        router.push("/search");
                        setTimeout(() => {
                          searchInputRef.current?.focus();
                        }, 100);
                      },
                    },
                    {
                      label: "Playlists",
                      icon: Library,
                      path: "/playlists",
                    },
                    {
                      label: "Albums",
                      icon: DiscAlbum,
                      path: "/albums",
                    },
                    {
                      label: "Songs",
                      icon: Music2,
                      path: "/songs",
                    },
                  ].map(({ label, icon: Icon, path, onClick }) => (
                    <button
                      key={label}
                      className={`flex items-center w-full px-4 py-2 rounded-xl transition group/item text-base font-semibold focus:outline-none
                    ${pathname === path
                          ? "bg-green-900/40 border-l-4 border-green-500 text-green-100"
                          : "text-zinc-200 hover:bg-green-900/30 hover:text-green-300"
                        }
                  `}
                      onClick={onClick || (() => router.push(path))}
                    >
                      <Icon
                        className={`mr-3 h-6 w-6 ${pathname === path ? "text-green-300" : "text-zinc-400 group-hover/item:text-green-300"}`}
                      />
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
                      router.push("/login");
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                  </Button>
                  <div className="h-16 w-full"></div>
                </div>
              </SidebarContent>
            </Sidebar>
            {/* Main content with search bar */}
            <div className="flex-1 overflow-auto">
              <div className="sticky top-0 z-30 bg-gradient-to-b from-zinc-950/95 to-transparent px-4 pb-2 flex items-center justify-center" suppressHydrationWarning>
                {/* Search bar */}
                <div className="blur-gradient pt-3"
                >
                  {/* <button
                    aria-label="Back"
                    className="rounded-full border border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 p-2 transition disabled:opacity-50"
                    onClick={() => router.back()}
                    tabIndex={0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Forward"
                    className="rounded-full border border-zinc-700/80 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 p-2 transition disabled:opacity-50"
                    onClick={() => router.forward()}
                    tabIndex={0}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button> */}
                  {/* Search bar */}
                  <div className="relative w-full">
                    <Search className="absolute size-5 left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 z-10" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="What do you want to play?"
                      className="pl-12 pr-4 py-2 rounded-full bg-zinc-800/80 border border-zinc-700 focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 text-white w-full shadow-md backdrop-blur backdrop-saturate-200 transition-all duration-200 placeholder:text-zinc-500 focus:shadow-lg outline-none"
                      style={{ boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)" }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (pathname !== "/search") {
                          router.push("/search");
                        }
                      }}
                    />
                  </div>
                </div>
                <SidebarTrigger className="absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
              {children}
              <Player />
            </div>
          </div>
        </div>
      </SearchContext.Provider>
    </SidebarProvider>
  );
}
