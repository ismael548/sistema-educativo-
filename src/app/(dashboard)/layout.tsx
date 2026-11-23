"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#050811] relative overflow-hidden overflow-x-hidden">
      {/* Fondo Interior: Rejilla Arquitectónica + Nebulosa Radial Ambiental */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 100%)",
          }}
        />
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full bg-indigo-600/15 blur-[140px]" />
      </div>

      {/* Sidebar responsivo (drawer en móvil, fijo en desktop) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Contenido */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
        <Topbar
          isMenuOpen={isMobileMenuOpen}
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
