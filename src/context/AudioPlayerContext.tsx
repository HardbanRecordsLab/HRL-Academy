import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  duration: number; // total seconds from metadata
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTrack: TrackMetadata | null;
  currentTrackId: string | null;
  progress: number; // seconds elapsed
  duration: number; // seconds total
  volume: number; // 0.0 - 1.0
  isMuted: boolean;
  error: string | null;
  authState: "unknown" | "authenticated" | "expired" | "forbidden";
}

type AudioPlayerAction =
  | { type: "SET_BUFFERING"; payload: boolean }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_TRACK"; payload: { track: TrackMetadata; trackId: string } }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_MUTED"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_AUTH_STATE"; payload: AudioPlayerState["authState"] }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function audioPlayerReducer(
  state: AudioPlayerState,
  action: AudioPlayerAction
): AudioPlayerState {
  switch (action.type) {
    case "SET_BUFFERING":
      return { ...state, isBuffering: action.payload };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_TRACK":
      return {
        ...state,
        currentTrack: action.payload.track,
        currentTrackId: action.payload.trackId,
        progress: 0,
        duration: action.payload.track.duration,
        error: null,
      };
    case "SET_PROGRESS":
      return { ...state, progress: action.payload };
    case "SET_DURATION":
      return { ...state, duration: action.payload };
    case "SET_VOLUME":
      return { ...state, volume: action.payload, isMuted: false };
    case "SET_MUTED":
      return { ...state, isMuted: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isBuffering: false };
    case "SET_AUTH_STATE":
      return { ...state, authState: action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

const initialState: AudioPlayerState = {
  isPlaying: false,
  isBuffering: false,
  currentTrack: null,
  currentTrackId: null,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  error: null,
  authState: "unknown",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves the JWT token from localStorage using the SSO v3 standard key.
 * Returns null if no token is stored.
 */
function getStoredJwt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hrl_sso_token_v3");
}

/**
 * Returns empty string for same-origin API paths.
 * All /api/* requests are proxied through Vercel edge (vercel.json rewrites)
 * to the backend — no cross-origin absolute URLs needed.
 * Using absolute VITE_API_URL forces browser CORS preflight and breaks requests.
 */
function getApiBaseUrl(): string {
  return "";
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AudioPlayerContextValue {
  state: AudioPlayerState;
  playTrack: (trackId: string, metadata: TrackMetadata) => Promise<void>;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  seek: (timeSeconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  stop: () => void;
}

const AudioPlayerCtx = createContext<AudioPlayerContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState);

  // Single recycled Audio instance — prevents DOM bloat.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track the current object URL so we can revoke it on change/unmount.
  const currentBlobUrlRef = useRef<string | null>(null);
  // Prevents SSR hydration mismatches.
  const [isMounted, setIsMounted] = React.useState(false);

  // -----------------------------------------------------------------------
  // Lifecycle: mount / unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    setIsMounted(true);

    // Create the single global Audio element.
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // --- Event listeners ---
    const onLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch({ type: "SET_DURATION", payload: audio.duration });
      }
    };

    const onTimeUpdate = () => {
      dispatch({ type: "SET_PROGRESS", payload: audio.currentTime });
    };

    const onWaiting = () => dispatch({ type: "SET_BUFFERING", payload: true });
    const onCanPlay = () => dispatch({ type: "SET_BUFFERING", payload: false });
    const onPlaying = () => {
      dispatch({ type: "SET_BUFFERING", payload: false });
      dispatch({ type: "SET_PLAYING", payload: true });
    };
    const onPause = () => dispatch({ type: "SET_PLAYING", payload: false });
    const onEnded = () => dispatch({ type: "SET_PLAYING", payload: false });
    const onError = () => {
      dispatch({
        type: "SET_ERROR",
        payload: "Audio playback error — verify network and auth token.",
      });
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      // Garbage-collect blob URL and clean up.
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      audio.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync volume changes onto the live Audio element.
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = state.isMuted ? 0 : state.volume;
  }, [state.volume, state.isMuted]);

  // -----------------------------------------------------------------------
  // Core: playTrack — secure Blob fetch with JWT (Zero-Trust streaming)
  // -----------------------------------------------------------------------
  const playTrack = useCallback(
    async (trackId: string, metadata: TrackMetadata) => {
      if (!audioRef.current || !isMounted) return;

      // 1. Revoke previous blob URL to prevent memory leaks.
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      dispatch({ type: "SET_BUFFERING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const jwt = getStoredJwt();
      if (!jwt) {
        dispatch({ type: "SET_AUTH_STATE", payload: "expired" });
        dispatch({
          type: "SET_ERROR",
          payload: "No SSO token found — please log in again.",
        });
        return;
      }

      const baseUrl = getApiBaseUrl();
      const streamUrl = `${baseUrl}/api/stream/${encodeURIComponent(trackId)}`;

      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          dispatch({ type: "SET_AUTH_STATE", payload: "forbidden" });
          dispatch({
            type: "SET_ERROR",
            payload: `Access denied (${response.status}). Your license may have expired.`,
          });
          dispatch({ type: "RESET" });
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Stream request failed with status ${response.status}`
          );
        }

        // 2. Convert the authenticated stream into a Blob.
        const blob = await response.blob();

        // 3. Create an object URL pointing to the in-memory Blob.
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrlRef.current = blobUrl;

        // 4. Feed the recycled Audio element.
        const audio = audioRef.current;
        audio.src = blobUrl;
        audio.load();

        // 5. Update metadata state.
        dispatch({ type: "SET_TRACK", payload: { track: metadata, trackId } });
        dispatch({ type: "SET_AUTH_STATE", payload: "authenticated" });

        // 6. Start playback.
        await audio.play();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown streaming error";
        dispatch({ type: "SET_ERROR", payload: message });
        dispatch({ type: "SET_BUFFERING", payload: false });
      }
    },
    [isMounted]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {
      dispatch({
        type: "SET_ERROR",
        payload: "Browser blocked autoplay — click play to resume.",
      });
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [state.isPlaying, pause, resume]);

  const seek = useCallback((timeSeconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeSeconds;
  }, []);

  const setVolumeAction = useCallback((vol: number) => {
    dispatch({ type: "SET_VOLUME", payload: Math.min(1, Math.max(0, vol)) });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: "SET_MUTED", payload: !state.isMuted });
  }, [state.isMuted]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    audioRef.current.src = "";
    audioRef.current.load();
    dispatch({ type: "RESET" });
  }, []);

  const value: AudioPlayerContextValue = {
    state,
    playTrack,
    pause,
    resume,
    togglePlayPause,
    seek,
    setVolume: setVolumeAction,
    toggleMute,
    stop,
  };

  return (
    <AudioPlayerCtx.Provider value={value}>{children}</AudioPlayerCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook to consume the AudioPlayer context.
 * Must be used within <AudioPlayerProvider>.
 */
export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerCtx);
  if (!ctx) {
    throw new Error(
      "useAudioPlayer must be used within an <AudioPlayerProvider>"
    );
  }
  return ctx;
}