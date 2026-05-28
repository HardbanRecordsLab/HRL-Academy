import React, { useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Loader2,
  Disc,
  AlertTriangle,
} from "lucide-react";
import { useAudioPlayer } from "../context/AudioPlayerContext";

// ---------------------------------------------------------------------------
// Helper: format seconds → m:ss
// ---------------------------------------------------------------------------
function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AudioPlayerBar({
  onSkipNext,
  onSkipPrev,
}: {
  onSkipNext?: () => void;
  onSkipPrev?: () => void;
}) {
  const {
    state,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    stop,
  } = useAudioPlayer();

  const {
    isPlaying,
    isBuffering,
    currentTrack,
    progress,
    duration,
    volume,
    isMuted,
    error,
    authState,
  } = state;

  // Progress scrubber
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      seek(Number(e.target.value));
    },
    [seek]
  );

  // Volume slider
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(Number(e.target.value));
    },
    [setVolume]
  );

  // -----------------------------------------------------------------------
  // Track metadata fallback
  // -----------------------------------------------------------------------
  const trackTitle = currentTrack?.title ?? "No track selected";
  const trackArtist = currentTrack?.artist ?? "Select a playlist to begin";
  const trackCover = currentTrack?.coverUrl ?? null;
  const coverLabel = currentTrack
    ? trackCover ??
      (currentTrack.title?.[0]?.toUpperCase() ?? "?") +
        (currentTrack.artist?.[0]?.toUpperCase() ?? "?")
    : "H";

  // -----------------------------------------------------------------------
  // Progress fraction used for the background gradient fill
  // -----------------------------------------------------------------------
  const progressPercent =
    duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-[200]
        transition-transform duration-500 ease-in-out
      "
    >
      {/* Glassmorphic container — AMOLED Premium spec */}
      <div
        className="
          mx-2 mb-2 md:mx-4 md:mb-3
          rounded-2xl
          bg-[rgba(18,15,12,0.75)]
          backdrop-blur-[12px] saturate-[1.4]
          border border-[#1c1c1c]
          shadow-[0_-8px_32px_rgba(0,0,0,0.55)]
          px-3 py-2.5 md:px-5 md:py-3
          flex flex-col gap-2
        "
      >
        {/* ---- Top row: controls, metadata, time ---- */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Cover art / placeholder */}
          <div className="relative flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-[#1c1c1c] bg-[#0a0a0a]">
            {trackCover ? (
              <img
                src={trackCover}
                alt={currentTrack?.title ?? "Track cover"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1c1610] to-[#0a0a0a]">
                {isBuffering ? (
                  <Loader2 className="w-5 h-5 text-[#38bdf8] animate-spin" />
                ) : isPlaying ? (
                  <Disc className="w-5 h-5 text-[#C8A96E] animate-spin [animation-duration:4s]" />
                ) : (
                  <span className="text-[#C8A96E] text-xs font-bold font-[Cinzel] tracking-wider select-none">
                    {coverLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Track metadata */}
          <div className="flex-1 min-w-0">
            <p className="text-[#F5F0E6] text-sm md:text-base font-semibold font-[Inter] truncate leading-tight">
              {trackTitle}
            </p>
            <p className="text-[#a89f92] text-xs md:text-sm font-[Inter] truncate">
              {trackArtist}
            </p>
            {/* Auth / error indicators */}
            {authState === "forbidden" && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-[#ef4444] font-mono">
                <AlertTriangle className="w-3 h-3" /> ACCESS DENIED
              </span>
            )}
            {error && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-[#f97316] font-mono truncate max-w-[220px]">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {error}
              </span>
            )}
          </div>

          {/* Time counters */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#94a3b8] tabular-nums flex-shrink-0">
            <span className="text-[#C8A96E]">{fmtTime(progress)}</span>
            <span className="text-[#475569]">/</span>
            <span>{fmtTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Skip back */}
            <button
              type="button"
              aria-label="Previous track"
              onClick={onSkipPrev}
              className="p-1.5 md:p-2 rounded-lg text-[#94a3b8] hover:text-[#C8A96E] hover:bg-[rgba(200,169,110,0.08)] transition-colors duration-200"
            >
              <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Play / Pause / Buffering */}
            <button
              type="button"
              aria-label={
                isBuffering ? "Buffering" : isPlaying ? "Pause" : "Play"
              }
              onClick={togglePlayPause}
              disabled={isBuffering && !isPlaying}
              className="
                p-2 md:p-2.5 rounded-full
                bg-gradient-to-br from-[#C8A96E] to-[#a89050]
                text-[#000000]
                shadow-[0_0_18px_rgba(200,169,110,0.3)]
                hover:shadow-[0_0_28px_rgba(200,169,110,0.5)]
                hover:scale-105 active:scale-95
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isBuffering ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Skip forward */}
            <button
              type="button"
              aria-label="Next track"
              onClick={onSkipNext}
              className="p-1.5 md:p-2 rounded-lg text-[#94a3b8] hover:text-[#C8A96E] hover:bg-[rgba(200,169,110,0.08)] transition-colors duration-200"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              aria-label={isMuted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-[#C8A96E] transition-colors duration-200"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              className="w-20 h-1.5 appearance-none rounded-full outline-none cursor-pointer
                [&::-webkit-slider-runnable-track]:bg-[rgba(255,255,255,0.08)]
                [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-runnable-track]:h-1.5
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#C8A96E]
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(200,169,110,0.5)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:mt-[-0.35rem]
                [&::-moz-range-track]:bg-[rgba(255,255,255,0.08)]
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:h-1.5
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-3.5
                [&::-moz-range-thumb]:h-3.5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#C8A96E]
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:cursor-pointer
              "
              style={{
                background: `linear-gradient(to right, #C8A96E ${volume * 100}%, rgba(255,255,255,0.08) ${volume * 100}%)`,
              }}
            />
          </div>
        </div>

        {/* ---- Progress bar ---- */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#C8A96E] tabular-nums sm:hidden w-8 text-right">
            {fmtTime(progress)}
          </span>
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              onChange={handleProgressChange}
              aria-label="Track progress"
              className="
                w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer
                [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-runnable-track]:h-1.5
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#C8A96E]
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(200,169,110,0.6)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:mt-[-0.35rem]
                [&::-webkit-slider-thumb]:opacity-0
                [&::-webkit-slider-thumb]:transition-opacity
                [&:hover::-webkit-slider-thumb]:opacity-100
                [&::-moz-range-track]:rounded-full
                [&::-moz-range-track]:h-1.5
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-3.5
                [&::-moz-range-thumb]:h-3.5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#C8A96E]
                [&::-moz-range-thumb]:border-none
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:opacity-0
                [&::-moz-range-thumb]:transition-opacity
                [&:hover::-moz-range-thumb]:opacity-100
              "
              style={{
                background: `linear-gradient(to right, #C8A96E ${progressPercent}%, rgba(255,255,255,0.06) ${progressPercent}%)`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-[#94a3b8] tabular-nums sm:hidden w-8 text-left">
            {fmtTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}