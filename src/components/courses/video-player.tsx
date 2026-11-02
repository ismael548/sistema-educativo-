'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  CheckCircle2,
  Settings2,
  Sparkles
} from 'lucide-react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl?: string;
  title: string;
  initialWatchedSeconds?: number;
  onProgressUpdate?: (seconds: number, completed: boolean) => void;
}

export function VideoPlayer({
  lessonId,
  videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  title,
  initialWatchedSeconds = 0,
  onProgressUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  // Format time in mm:ss
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Play/Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  // Handle Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard Shortcuts (Space, Left/Right arrow, F, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys when typing in chat/inputs
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'arrowright':
          e.preventDefault();
          if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, duration]);

  // Sync mute to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle time update and completion (>90%)
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(cur);

    if (dur > 0 && !isCompleted && cur / dur >= 0.9) {
      setIsCompleted(true);
      onProgressUpdate?.(Math.floor(cur), true);
    } else if (Math.floor(cur) % 5 === 0) {
      // Throttle updates to Supabase every 5 seconds
      onProgressUpdate?.(Math.floor(cur), isCompleted);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialWatchedSeconds > 0 && initialWatchedSeconds < videoRef.current.duration) {
        videoRef.current.currentTime = initialWatchedSeconds;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={() => setShowControls(true)}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#232a35] group shadow-surface"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Floating Header (Clean title) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white drop-shadow truncate">{title}</p>
          {isCompleted && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completada
            </span>
          )}
        </div>
      </div>

      {/* Control Overlay Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 flex flex-col gap-2 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar (Scrubber) */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-700/60 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />
        </div>

        {/* Buttons and controls row */}
        <div className="flex items-center justify-between text-gray-300 text-xs mt-1">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-white transition-colors focus:outline-none"
              title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime -= 10;
              }}
              className="p-1.5 hover:text-white transition-colors"
              title="Retroceder 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 hover:text-white transition-colors"
                title="Silenciar (M)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  setIsMuted(val === 0);
                  if (videoRef.current) videoRef.current.volume = val;
                }}
                className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-400 opacity-60 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Time Stamp */}
            <span className="font-mono text-gray-400 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-[#13161c] px-1.5 py-0.5 rounded border border-[#232a35]">
              {[1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changeSpeed(rate)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-white transition-colors"
              title="Pantalla Completa (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
