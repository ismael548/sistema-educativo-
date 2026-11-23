"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Film,
  ExternalLink,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { extractGoogleDriveId } from "@/utils/driveHelpers";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

interface YTPlayerInstance {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
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
} {
  if (!rawUrl || !rawUrl.trim()) {
    return { embedUrl: null, provider: "other", youtubeId: null };
  }

  const url = rawUrl.trim();

  // 1. Detectar YouTube (watch?v=, youtu.be/, shorts/, embed/, live/)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&playsinline=1&fs=1`,
      provider: "youtube",
      youtubeId: ytMatch[1],
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
      };
    }
  }

  // 3. Fallback si ya es una URL embebible
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { embedUrl: url, provider: "other", youtubeId: null };
  }

  return { embedUrl: null, provider: "other", youtubeId: null };
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const { embedUrl, provider, youtubeId } = useMemo(
    () => getEmbedInfo(videoUrl),
    [videoUrl]
  );

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);

  const [isYtReady, setIsYtReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Inicializar API oficial de YouTube IFrame (sin guardar ni reanudar minuto)
  useEffect(() => {
    if (provider !== "youtube" || !youtubeId) {
      setIsYtReady(false);
      return;
    }

    let isMounted = true;
    setIsYtReady(false);

    const mountPlayer = () => {
      if (!isMounted || !ytHostRef.current || !window.YT?.Player) return;

      // Limpiar instancia previa si existe
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
      targetEl.className = "w-full h-full";
      ytHostRef.current.appendChild(targetEl);

      ytPlayerRef.current = new window.YT.Player(targetEl, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
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
                iframe.className = "w-full h-full border-0";
              }
            } catch {
              // Ignorar si no está disponible
            }
            setIsYtReady(true);
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
      }
    } catch {
      // Ignorar si el navegador bloquea fullscreen
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

  return (
    <div className="w-full flex flex-col gap-2">
      <div
        ref={playerContainerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#232a35] shadow-surface"
      >
        {provider === "youtube" && youtubeId ? (
          <div ref={ytHostRef} className="w-full h-full" aria-label={title} />
        ) : (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>

      {/* Barra de controles táctiles compacta */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-500 ml-auto">
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
            className="inline-flex items-center gap-1 text-gray-400 hover:text-indigo-300 transition-colors"
          >
            <span>Abrir enlace original</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
