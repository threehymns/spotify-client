import "server-only";

import { SpotifyAPI } from "@/lib/spotify";
import { getRefreshableAuthHeaders } from "@/lib/auth-helpers-server";

export async function getSpotifyClient() {
  const authHeaders = await getRefreshableAuthHeaders();
  return new SpotifyAPI(authHeaders);
}
