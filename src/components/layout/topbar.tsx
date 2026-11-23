"use client";

import React from "react";
import Link from "next/link";
import { Bell, Search, Menu, X } from "lucide-react";
import logoImg from "@/assets/noxius-brand.jpg";
import { useUserRole } from "@/components/providers/role-provider";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  isMenuOpen?: boolean;
  onMenuClick?: () => void;
}

function DiscordMiniIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function Topbar({
  title = "Panel de Aprendizaje",
  subtitle,
  isMenuOpen = false,
  onMenuClick,
}: TopbarProps) {
  const { discordUrl } = useUserRole();

  return (
    <header className="h-16 bg-[#070b14]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors shrink-0"
            aria-label={isMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* Logo compacto en móvil (< 768px) */}
        <Link href="/student" className="flex items-center gap-2 md:hidden min-w-0">
          <img
            src={logoImg.src}
            alt="Logo Noxius LM"
            className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
          />
          <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1 truncate">
            Noxius
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-indigo-500/30 font-mono">
              LM
            </span>
          </span>
        </Link>

        {/* Título en escritorio (>= 768px) */}
        <div className="hidden md:block min-w-0">
          <h1 className="text-base font-bold text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 font-normal truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search bar */}
        <div className="relative w-56 xl:w-64 hidden lg:block">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar lecciones, recursos..."
            className="w-full bg-[#0c1220]/80 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        {/* Botón compacto de Discord */}
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] border border-[#5865F2]/40 text-xs font-medium transition-colors"
          title="Comunidad en Discord"
        >
          <DiscordMiniIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Discord</span>
        </a>

        {/* Live Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px]">En Línea</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
