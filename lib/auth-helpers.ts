"use client"

import { encrypt, decrypt } from "@/lib/encryption"

// Store credentials securely in localStorage with encryption
export async function saveCredentials(clientId: string, clientSecret: string) {
  try {
    console.log("Saving credentials to localStorage...")
    const encryptedClientId = await encrypt(clientId)
    const encryptedClientSecret = await encrypt(clientSecret)

    localStorage.setItem("spotify_client_id", encryptedClientId)
    localStorage.setItem("spotify_client_secret", encryptedClientSecret)

    // Also store in cookies for server-side access
    document.cookie = `spotify_client_id=${encodeURIComponent(clientId)}; path=/; max-age=86400; SameSite=Lax`
    document.cookie = `spotify_client_secret=${encodeURIComponent(clientSecret)}; path=/; max-age=86400; SameSite=Lax`

    console.log("Credentials saved successfully")
    return true
  } catch (error) {
    console.error("Error saving credentials:", error)
    throw error
  }
}

// Get credentials from localStorage and decrypt
export async function getCredentials() {
  try {
    const encryptedClientId = localStorage.getItem("spotify_client_id")
    const encryptedClientSecret = localStorage.getItem("spotify_client_secret")

    if (!encryptedClientId || !encryptedClientSecret) {
      return null
    }

    const clientId = await decrypt(encryptedClientId)
    const clientSecret = await decrypt(encryptedClientSecret)

    return { clientId, clientSecret }
  } catch (error) {
    console.error("Error getting credentials:", error)
    return null
  }
}

// Get access token directly from localStorage without decryption
// This is used when we've stored the token directly from cookies
export async function getAccessToken(forceRefresh = false) {
  try {
    console.log("Getting access token...", forceRefresh ? "(force refresh)" : "")

    // First try to get the token directly (for tokens stored from cookies)
    const directAccessToken = localStorage.getItem("spotify_access_token")
    if (directAccessToken && !directAccessToken.includes(" ") && !forceRefresh) {
      console.log("Using direct access token from localStorage")
      return directAccessToken
    }

    // Fall back to the encrypted version
    const encryptedAccessToken = localStorage.getItem("spotify_access_token")
    const encryptedRefreshToken = localStorage.getItem("spotify_refresh_token")
    const expiresAt = localStorage.getItem("spotify_token_expires_at")

    if (!encryptedAccessToken || !encryptedRefreshToken || !expiresAt) {
      console.warn("No tokens found in localStorage")
      return null
    }

    // Check if token is expired or force refresh is requested
    if (Date.now() > Number.parseInt(expiresAt) || forceRefresh) {
      console.log(forceRefresh ? "Force refreshing access token..." : "Access token expired, refreshing...")
      return refreshAccessToken()
    }

    // Token is still valid
    try {
      const accessToken = await decrypt(encryptedAccessToken)
      console.log("Valid access token retrieved")
      return accessToken
    } catch (e) {
      // If decryption fails, return the token directly
      console.log("Decryption failed, using token directly")
      return encryptedAccessToken
    }
  } catch (error) {
    console.error("Error getting access token:", error)
    return null
  }
}

// Refresh the access token
async function refreshAccessToken() {
  try {
    console.log("Refreshing access token...")
    const credentials = await getCredentials()
    const refreshToken = localStorage.getItem("spotify_refresh_token")

    if (!credentials || !refreshToken) {
      console.error("Missing credentials or refresh token")
      return null
    }

    console.log("Making refresh token request...")
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("Failed to refresh token:", errorData)
      throw new Error(errorData.error || "Failed to refresh token")
    }

    const data = await response.json()
    console.log("Token refreshed successfully")

    // Save the new tokens directly (not encrypted)
    localStorage.setItem("spotify_access_token", data.access_token)
    if (data.refresh_token) {
      localStorage.setItem("spotify_refresh_token", data.refresh_token)
    }
    localStorage.setItem("spotify_token_expires_at", (Date.now() + data.expires_in * 1000).toString())

    return data.access_token
  } catch (error) {
    console.error("Error refreshing token:", error)
    return null
  }
}

// Check if user is authenticated
export async function checkAuth() {
  const accessToken = await getAccessToken()
  return !!accessToken
}

// Add a new function to check connection status
export async function checkSpotifyConnection() {
  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      console.log("No access token available")
      return false
    }

    console.log("Testing Spotify API connection...")
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("Spotify API connection test failed:", await response.json().catch(() => "Could not parse error"))
      return false
    }

    console.log("Spotify API connection successful")
    return true
  } catch (error) {
    console.error("Error checking Spotify connection:", error)
    return false
  }
}
