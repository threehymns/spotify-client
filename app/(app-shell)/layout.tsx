import RootNav from "@/components/root-nav";
import React from "react";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Spotify Client",
  description: "Spotify Client",
  generator: "Next.js",
};

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootNav>
      <div className="pb-24">{children}</div>
    </RootNav>
  );
}
