"use client"

import { useEffect, useState } from "react"
import Loading from "@/components/loading";
import { useRouter } from "next/navigation"

export default function AuthSuccessPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Initializing...")

  useEffect(() => {
    const storeTokensAndRedirect = async () => {
      try {
        setStatus("Reading authentication tokens...");
        // Fetch tokens from the new API endpoint
        const res = await fetch("/api/auth/tokens");
        if (!res.ok) {
          console.error("Tokens not found in cookies");
          setStatus("Authentication failed. Tokens not found.");
          setTimeout(() => {
            router.push("/login?error=token_missing");
          }, 2000);
          return;
        }
        const { accessToken, refreshToken } = await res.json();
        setStatus("Storing tokens securely...");
        // Store tokens directly in localStorage
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
        // Calculate expiry time (60 hours from now)
        const expiresAt = Date.now() + 3600 * 1000 * 60;
        localStorage.setItem("spotify_token_expires_at", expiresAt.toString());
        console.log("Tokens stored in localStorage");
        setStatus("Authentication successful! Redirecting...");
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 0);
      } catch (error) {
        console.error("Error in auth success page:", error)
        setStatus("Authentication error. Please try again.")
        setTimeout(() => {
          router.push("/login?error=token_storage")
        }, 2000)
      }
    }

    storeTokensAndRedirect()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center w-full">
        <Loading text={status || "Authentication in progress"} />
      </div>
    </div>
  )
}
