"use client";

import React, { useMemo } from "react";
import { Film, ExternalLink } from "lucide-react";
import { extractGoogleDriveId } from "@/utils/driveHelpers";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

function getEmbedUrl(rawUrl: string): { embedUrl: string | null; provider: "youtube" | "drive" | "other" } {
  if (!rawUrl || !rawUrl.trim()) {
    return { embedUrl: null, provider: "other" };
  }

  const url = rawUrl.trim();

  // 1. Detectar YouTube (watch?v=, youtu.be/, shorts/, embed/, live/)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      provider: "youtube",
    };
  }

  // 2. Detectar Google Drive (/file/d/{ID}/view... o ?id={ID})
  if (url.includes("drive.google.com")) {
    const driveId = extractGoogleDriveId(url);
    if (driveId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        provider: "drive",
      };
    }
  }

  // 3. Fallback si ya es una URL embebible
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { embedUrl: url, provider: "other" };
  }

  return { embedUrl: null, provider: "other" };
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const { embedUrl, provider } = useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

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
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-[#232a35] shadow-surface">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
        <span className="font-mono uppercase tracking-wider text-indigo-400">
          Fuente: {provider === "youtube" ? "YouTube" : provider === "drive" ? "Google Drive" : "Externo"}
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
  );
}
