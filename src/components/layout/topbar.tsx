'use client';

import React from 'react';
import { Bell, Search, Radio, Sparkles } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({ title = 'Panel de Aprendizaje', subtitle }: TopbarProps) {
  return (
    <header className="h-16 bg-[#0d0f12]/95 backdrop-blur border-b border-[#232a35] px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 font-normal">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar lecciones, recursos..."
            className="w-full bg-[#13161c] border border-[#232a35] rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Live Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[11px]">En Línea</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#13161c] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
