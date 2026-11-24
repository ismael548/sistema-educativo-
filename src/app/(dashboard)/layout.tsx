"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardNeuralBackground } from "@/components/DashboardNeuralBackground";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full max-w-full bg-[#050811] relative overflow-hidden overflow-x-hidden">
      {/* Fondo 3D Interactivo: Esfera de Red Neuronal / Átomo + Campo Estelar */}
      <DashboardNeuralBackground />

      {/* Sidebar responsivo (drawer en móvil, fijo en desktop) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Contenido (contenedores intermedios transparentes) */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 max-w-full bg-transparent overflow-y-auto overflow-x-hidden">
        <Topbar
          isMenuOpen={isMobileMenuOpen}
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="relative z-10 flex-1 p-3 sm:p-4 md:p-6 bg-transparent overflow-x-hidden max-w-full">
          {children}
          <div></div>
        </main>
      </div>
    </div>
  );
}
