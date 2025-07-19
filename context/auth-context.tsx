"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { checkAuth, checkSpotifyConnection } from "@/lib/auth-helpers";
import { SpotifyUser } from "@/lib/zod-schemas";
import { SpotifyAPI } from "@/lib/spotify";
import { getAccessToken } from "@/lib/auth-helpers";

interface ConnectionStatus {
  connected: boolean;
  checking: boolean;
  error: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  user: SpotifyUser | null;
  api: SpotifyAPI | null;
  refreshConnection: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [api, setApi] = useState<SpotifyAPI | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    checking: true,
    error: null,
  });

  const checkLocalTokens = () => {
    const accessToken =
      typeof window !== "undefined" &&
      localStorage.getItem("spotify_access_token");
    const refreshToken =
      typeof window !== "undefined" &&
      localStorage.getItem("spotify_refresh_token");
    return !!(accessToken && refreshToken);
  };

  const verifyAuth = async () => {
    try {
      if (checkLocalTokens()) {
        setIsAuthenticated(true);
      } else {
        const authenticated = await checkAuth();
        if (!authenticated) {
          router.push("/login");
          return;
        }
        setIsAuthenticated(true);
      }
      refreshConnection();
    } catch (error: any) {
      setIsAuthenticated(false);
      setConnectionStatus({
        connected: false,
        checking: false,
        error: `Authentication error: ${error.message}`,
      });
      setIsLoading(false);
    }
  };

  const refreshConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, checking: true }));
    try {
      const connected = await checkSpotifyConnection();
      setConnectionStatus({
        connected,
        checking: false,
        error: connected
          ? null
          : "Could not connect to Spotify API. Please check your credentials.",
      });
    } catch (error: any) {
      setConnectionStatus({
        connected: false,
        checking: false,
        error: `Connection error: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    setIsAuthenticated(false);
    router.push("/login");
  };

  useEffect(() => {
    verifyAuth();
    // eslint-disable-next-line
  }, [router]);

  useEffect(() => {
    const initApi = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        const authHeaders = new Headers({
          Authorization: `Bearer ${accessToken}`,
        });
        const newApi = new SpotifyAPI(authHeaders);
        setApi(newApi);
        newApi.getMe().then(setUser);
      } else {
        setApi(null);
        setUser(null);
      }
    };

    if (isAuthenticated) {
      initApi();
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        connectionStatus,
        user,
        api,
        refreshConnection,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
