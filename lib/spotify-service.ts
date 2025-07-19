"use client";

import { getAccessToken } from "./auth-helpers";
import { SpotifyAPI } from "./spotify";

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

class SpotifyService {
  private player: any;
  private deviceId: string | null = null;
  private accessToken: string | null = null;
  private spotifyApi: SpotifyAPI | null = null;

  public onStateChange: ((state: any) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private async init() {
    this.accessToken = await getAccessToken();
    if (!this.accessToken) {
      console.error("Spotify access token not found");
      return;
    }

    const authHeaders = new Headers({
      Authorization: `Bearer ${this.accessToken}`,
    });
    this.spotifyApi = new SpotifyAPI(authHeaders);

    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        this.initializePlayer();
      };
    } else {
      this.initializePlayer();
    }
  }

  private initializePlayer() {
    this.player = new window.Spotify.Player({
      name: "Pulse Web Player",
      getOAuthToken: (cb: (token: string) => void) => {
        cb(this.accessToken!);
      },
    });

    this.player.addListener("ready", ({ device_id }: { device_id: string }) => {
      this.deviceId = device_id;
      console.log("Spotify Player is ready. Device ID:", this.deviceId);
    });

    this.player.addListener("player_state_changed", (state: any) => {
      if (this.onStateChange) {
        this.onStateChange(state);
      }
    });

    this.player.connect();
  }

  public async play(uri: string) {
    if (!this.deviceId) {
      console.error("Spotify player not ready");
      return;
    }
    if (!this.spotifyApi) {
      console.error("Spotify API not initialized");
      return;
    }

    await this.spotifyApi.play(this.deviceId, uri);
  }

  public async togglePlayback() {
    if (!this.player) return;
    await this.player.togglePlay();
  }

  public async skipToNext() {
    if (!this.player) return;
    await this.player.nextTrack();
  }

  public async skipToPrevious() {
    if (!this.player) return;
    await this.player.previousTrack();
  }

  public async setVolume(volume: number) {
    if (!this.player) return;
    await this.player.setVolume(volume / 100);
  }

  public async seekTo(position: number) {
    if (!this.player) return;
    await this.player.seek(position * 1000);
  }
}

export const spotifyService = new SpotifyService();