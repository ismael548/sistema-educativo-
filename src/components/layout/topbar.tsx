"use client";

import React from "react";
import Link from "next/link";
import { Bell, Search, Menu, X } from "lucide-react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  isMenuOpen?: boolean;
  onMenuClick?: () => void;
}

export function Topbar({
  title = "Panel de Aprendizaje",
  subtitle,
  isMenuOpen = false,
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="h-16 bg-[#0d0f12]/95 backdrop-blur border-b border-[#232a35] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-gray-300 hover:text-white hover:bg-[#13161c] border border-[#232a35] transition-colors shrink-0"
            aria-label={isMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* Logo compacto en móvil (< 768px) */}
        <Link href="/student" className="flex items-center gap-2 md:hidden min-w-0">
          <img
            src="/logo-noxius.jpg"
            alt="Logo Noxius LM"
            className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
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
          <h1 className="text-base font-semibold text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 font-normal truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Search bar */}
        <div className="relative w-64 hidden lg:block">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar lecciones, recursos..."
            className="w-full bg-[#13161c] border border-[#232a35] rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Live Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px]">En Línea</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#13161c] transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
