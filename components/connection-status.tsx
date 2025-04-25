"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { checkSpotifyConnection } from "@/lib/auth-helpers"

type ConnectionStatusProps = {
  onRetry?: () => void
  onReturn?: () => void
}

export default function ConnectionStatus({ onRetry, onReturn }: ConnectionStatusProps) {
  const [status, setStatus] = useState({
    connected: false,
    checking: true,
    error: null as string | null,
    lastChecked: null as Date | null,
  })

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setStatus((prev) => ({ ...prev, checking: true, error: null }))
    try {
      const connected = await checkSpotifyConnection()
      setStatus({
        connected,
        checking: false,
        error: connected ? null : "Could not connect to Spotify API. Please check your credentials.",
        lastChecked: new Date(),
      })
    } catch (error) {
      setStatus({
        connected: false,
        checking: false,
        error: `Connection error: ${error.message}`,
        lastChecked: new Date(),
      })
    }
  }

  if (status.checking) {
    return (
      <Alert className="bg-blue-900/20 border-blue-900">
        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        <AlertTitle>Checking Spotify connection...</AlertTitle>
        <AlertDescription>Please wait while we verify your connection to the Spotify API.</AlertDescription>
      </Alert>
    )
  }

  if (!status.connected) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          {status.error}
          <div className="mt-2 flex gap-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry || checkConnection}>
                Retry Connection
              </Button>
            )}
            {onReturn && (
              <Button variant="outline" size="sm" onClick={onReturn}>
                Return to Login
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-green-900/20 border-green-900">
      <CheckCircle2 className="h-4 w-4 text-green-500" />
      <AlertTitle>Connected to Spotify</AlertTitle>
      <AlertDescription>
        Your application is successfully connected to the Spotify API.
        {status.lastChecked && (
          <div className="text-xs text-green-400/70 mt-1">Last verified: {status.lastChecked.toLocaleTimeString()}</div>
        )}
      </AlertDescription>
    </Alert>
  )
}
