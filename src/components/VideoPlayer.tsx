"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Film,
  ExternalLink,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
} from "lucide-react";
import { extractGoogleDriveId } from "@/utils/driveHelpers";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

interface YTPlayerInstance {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState?: () => number;
  getIframe?: () => HTMLIFrameElement;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
      };
    }
  ) => YTPlayerInstance;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function getEmbedInfo(rawUrl: string): {
  embedUrl: string | null;
  provider: "youtube" | "drive" | "other";
  youtubeId: string | null;
  driveId: string | null;
} {
  if (!rawUrl || !rawUrl.trim()) {
    return { embedUrl: null, provider: "other", youtubeId: null, driveId: null };
  }

  const url = rawUrl.trim();

  // 1. Detectar YouTube (watch?v=, youtu.be/, shorts/, embed/, live/)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?controls=1&rel=0&modestbranding=1&playsinline=1&fs=1`,
      provider: "youtube",
      youtubeId: ytMatch[1],
      driveId: null,
    };
  }

  // 2. Detectar Google Drive (/file/d/{ID}/view... o ?id={ID})
  if (url.includes("drive.google.com")) {
    const driveId = extractGoogleDriveId(url);
    if (driveId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        provider: "drive",
        youtubeId: null,
        driveId,
      };
    }
  }

  // 3. Fallback si ya es una URL embebible
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { embedUrl: url, provider: "other", youtubeId: null, driveId: null };
  }

  return { embedUrl: null, provider: "other", youtubeId: null, driveId: null };
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const { embedUrl, provider, youtubeId, driveId } = useMemo(
    () => getEmbedInfo(videoUrl),
    [videoUrl]
  );

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const driveVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isYtReady, setIsYtReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [driveNativeFailed, setDriveNativeFailed] = useState(false);

  // Detectar viewport móvil (< 768px / md)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  // Reiniciar estado de fallback de Drive al cambiar de video
  useEffect(() => {
    setDriveNativeFailed(false);
  }, [driveId]);

  // Sincronizar estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const active = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            unlock?: () => void;
          };
          orientation?.unlock?.();
        } catch {
          // Ignorar en navegadores sin soporte
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Inicializar API oficial de YouTube IFrame con controles nativos inmediatos (controls: 1)
  useEffect(() => {
    if (provider !== "youtube" || !youtubeId) {
      setIsYtReady(false);
      setIsPlaying(false);
      return;
    }

    let isMounted = true;
    setIsYtReady(false);
    setIsPlaying(false);

    const mountPlayer = () => {
      if (!isMounted || !ytHostRef.current || !window.YT?.Player) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignorar errores al destruir
        }
        ytPlayerRef.current = null;
      }

      ytHostRef.current.innerHTML = "";
      const targetEl = document.createElement("div");
      targetEl.className = "w-full h-full pointer-events-auto";
      ytHostRef.current.appendChild(targetEl);

      ytPlayerRef.current = new window.YT.Player(targetEl, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 1,
          fs: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            try {
              const iframe = event.target.getIframe?.();
              if (iframe) {
                iframe.setAttribute("allowfullscreen", "true");
                iframe.allow =
                  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
                iframe.className = "w-full h-full border-0 pointer-events-auto";
              }
            } catch {
              // Ignorar si no está disponible
            }
            setIsYtReady(true);
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            setIsPlaying(event.data === 1);
          },
        },
      });
    };

    if (window.YT?.Player) {
      mountPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        mountPlayer();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignorar errores al desmontar
        }
        ytPlayerRef.current = null;
      }
    };
  }, [provider, youtubeId]);

  const handleSeek = useCallback((deltaSeconds: number) => {
    const player = ytPlayerRef.current;
    if (!player) return;
    try {
      const currentTime = player.getCurrentTime();
      const targetTime = Math.max(0, currentTime + deltaSeconds);
      player.seekTo(targetTime, true);
    } catch {
      // Ignorar si el reproductor aún no está listo
    }
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    const player = ytPlayerRef.current;
    if (!player) return;
    try {
      const state = player.getPlayerState?.();
      if (state === 1 || isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    } catch {
      // Ignorar si el reproductor aún no está listo
    }
  }, [isPlaying]);

  const handleToggleFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };

    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } catch {
        // Ignorar error al salir
      }
      return;
    }

    const container = playerContainerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;
    if (!container) return;

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen();
      } else {
        const videoEl = driveVideoRef.current as
          | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
          | null;
        videoEl?.webkitEnterFullscreen?.();
      }
    } catch {
      const videoEl = driveVideoRef.current as
        | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        | null;
      videoEl?.webkitEnterFullscreen?.();
    }

    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: "landscape" | "portrait") => Promise<void>;
      };
      await orientation?.lock?.("landscape");
    } catch {
      // Ignorar en escritorio o iOS donde lock no está soportado
    }
  }, []);

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-[#13161c] border border-[#232a35] rounded-xl flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
          <Film className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-gray-200">{title || "Video no disponible"}</p>
        <p className="text-xs text-gray-500 mt-1 max-w-md">
          No se encontró un enlace válido de YouTube o Google Drive para esta clase.
        </p>
      </div>
    );
  }

  const driveDirectUrl = driveId
    ? `https://drive.google.com/uc?export=download&id=${driveId}`
    : null;

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Marco limpio del reproductor 16:9 */}
      <div
        ref={playerContainerRef}
        className="relative w-full aspect-video overflow-hidden rounded-xl bg-black border border-[#232a35] shadow-surface"
      >
        {provider === "youtube" && youtubeId ? (
          <div
            ref={ytHostRef}
            className="w-full h-full pointer-events-auto"
            aria-label={title}
          />
        ) : provider === "drive" && driveId ? (
          isMobileViewport ? (
            driveNativeFailed ? (
              /* Fallback elegante en móvil si Drive bloquea descarga directa (>100 MB) */
              <div className="w-full h-full bg-gradient-to-br from-[#0b1120] via-[#0d152a] to-[#050811] flex flex-col items-center justify-center text-center p-5 gap-3">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-semibold text-white line-clamp-2">
                    {title || "Video de la Clase"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Este video de Google Drive se reproduce mejor en pantalla completa nativa.
                  </p>
                </div>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50 transition-colors touch-manipulation"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reproducir Video en Pantalla Completa</span>
                </a>
              </div>
            ) : (
              /* Reproductor HTML5 nativo en móvil (nítido, ±10s, zoom y fullscreen horizontal real) */
              <video
                ref={driveVideoRef}
                src={driveDirectUrl || undefined}
                controls
                playsInline
                preload="metadata"
                onError={() => setDriveNativeFailed(true)}
                className="w-full h-full object-contain bg-black pointer-events-auto"
              />
            )
          ) : (
            /* Escritorio (md: en adelante): reproductor embebido /preview normal sin cambios */
            <iframe
              src={embedUrl}
              title={title}
              className="hidden md:block w-full h-full border-0 pointer-events-auto"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )
        ) : (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0 block pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>

      {/* Barra de controles táctiles justo debajo del video (nunca superpuesta) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {provider === "youtube" && (
            <>
              <button
                type="button"
                onClick={() => handleSeek(-10)}
                disabled={!isYtReady}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13161c] hover:bg-[#1a1f26] border border-[#232a35] hover:border-indigo-500/40 text-xs font-medium text-gray-200 disabled:opacity-45 transition-colors touch-manipulation"
                title="Retroceder 10 segundos"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>-10s</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePlayPause}
                disabled={!isYtReady}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13161c] hover:bg-[#1a1f26] border border-[#232a35] hover:border-indigo-500/40 text-xs font-medium text-gray-200 disabled:opacity-45 transition-colors touch-manipulation"
                title={isPlaying ? "Pausar video" : "Reproducir video"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{isPlaying ? "Pausar" : "Reproducir"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSeek(10)}
                disabled={!isYtReady}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13161c] hover:bg-[#1a1f26] border border-[#232a35] hover:border-indigo-500/40 text-xs font-medium text-gray-200 disabled:opacity-45 transition-colors touch-manipulation"
                title="Adelantar 10 segundos"
              >
                <span>+10s</span>
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </>
          )}

          {!(provider === "drive" && isMobileViewport && driveNativeFailed) && (
            <button
              type="button"
              onClick={() => void handleToggleFullscreen()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/35 text-xs font-medium text-indigo-200 transition-colors touch-manipulation"
              title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-indigo-300" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span>{isFullscreen ? "Salir" : "Pantalla Completa"}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-gray-500 ml-auto">
          <span className="font-mono uppercase tracking-wider text-indigo-400">
            Fuente:{" "}
            {provider === "youtube"
              ? "YouTube"
              : provider === "drive"
                ? "Google Drive"
                : "Externo"}
          </span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#13161c] hover:bg-[#1a1f26] border border-[#232a35] text-gray-200 hover:text-indigo-300 transition-colors touch-manipulation"
          >
            <span>
              {provider === "drive"
                ? "Abrir en Drive / Ver en pantalla completa nativa"
                : "Abrir enlace original"}
            </span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}
