
import { 
  spotifyFetch, 
  checkSavedAlbums, 
  saveAlbums, 
  removeSavedAlbums, 
  checkPlaylistFollowed, 
  followPlaylist, 
  unfollowPlaylist, 
  checkFollowingArtists, 
  followArtists, 
  unfollowArtists, 
  checkSavedTracks, 
  saveTracks, 
  removeSavedTracks, 
  getUserProfile 
} from './spotify-api';
import { getAccessToken } from './auth-helpers';

// TODO: Add proper types for the Spotify SDK
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

  public onStateChange: ((state: any) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    this.accessToken = await getAccessToken();
    if (!this.accessToken) {
      console.error('Spotify access token not found');
      return;
    }

    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
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
      name: 'Pulse Web Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(this.accessToken!);
      },
    });

    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      this.deviceId = device_id;
      console.log('Spotify Player is ready. Device ID:', this.deviceId);
    });

    this.player.addListener('player_state_changed', (state: any) => {
      if (this.onStateChange) {
        this.onStateChange(state);
      }
    });

    this.player.connect();
  }

  public async play(uri: string) {
    if (!this.deviceId) {
      console.error('Spotify player not ready');
      return;
    }

    const body: any = {};
    if (uri.startsWith('spotify:track:')) {
      body.uris = [uri];
    } else {
      body.context_uri = uri;
    }

    await spotifyFetch(`/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
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

  public async isAlbumSaved(albumId: string) {
    const [isSaved] = await checkSavedAlbums([albumId]);
    return isSaved;
  }

  public async toggleSaveAlbum(albumId: string, save: boolean) {
    if (save) {
      await saveAlbums([albumId]);
    } else {
      await removeSavedAlbums([albumId]);
    }
  }

  public async isPlaylistFollowed(playlistId: string) {
    const user = await getUserProfile();
    const [isFollowed] = await checkPlaylistFollowed(playlistId, [user.id]);
    return isFollowed;
  }

  public async toggleFollowPlaylist(playlistId: string, follow: boolean) {
    if (follow) {
      await followPlaylist(playlistId);
    } else {
      await unfollowPlaylist(playlistId);
    }
  }

  public async isArtistFollowed(artistId: string) {
    const [isFollowed] = await checkFollowingArtists([artistId]);
    return isFollowed;
  }

  public async toggleFollowArtist(artistId: string, follow: boolean) {
    if (follow) {
      await followArtists([artistId]);
    } else {
      await unfollowArtists([artistId]);
    }
  }

  public async areTracksSaved(trackIds: string[]) {
    return await checkSavedTracks(trackIds);
  }

  public async toggleSaveTrack(trackId: string, save: boolean) {
    if (save) {
      await saveTracks([trackId]);
    } else {
      await removeSavedTracks([trackId]);
    }
  }
}

export const spotifyService = new SpotifyService();
