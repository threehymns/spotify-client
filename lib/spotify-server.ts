import "server-only";

import { getRefreshableAuthHeaders } from "@/lib/auth-helpers-server";
import { SpotifyAPI } from "@/lib/spotify";

export async function getSpotifyClient() {
	const authHeaders = await getRefreshableAuthHeaders();
	return new SpotifyAPI(authHeaders);
}
