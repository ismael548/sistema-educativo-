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
      {/* Fondo Interior: Nebulosa Radial Luminosa + Rejilla de Ingeniería */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Rejilla técnica cian */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(56, 189, 248, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.09) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 85% 75% at 50% 35%, #000 60%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 75% at 50% 35%, #000 60%, transparent 100%)",
          }}
        />
        {/* Halo cian vibrante superior izquierda/centro */}
        <div className="absolute -top-40 left-[12%] w-[650px] h-[650px] rounded-full bg-cyan-500/20 blur-[120px]" />
        {/* Halo azul eléctrico sutil en el centro */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[110px]" />
        {/* Halo índigo/violeta inferior derecha */}
        <div className="absolute -bottom-44 -right-28 w-[700px] h-[700px] rounded-full bg-indigo-600/25 blur-[130px]" />
      </div>

      {/* Sidebar responsivo (drawer en móvil, fijo en desktop) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Contenido (contenedores intermedios transparentes) */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 bg-transparent overflow-y-auto overflow-x-hidden">
        <Topbar
          isMenuOpen={isMobileMenuOpen}
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="relative z-10 flex-1 p-4 md:p-6 bg-transparent overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
