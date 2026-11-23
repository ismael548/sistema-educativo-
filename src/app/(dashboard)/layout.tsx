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
    <div className="flex h-screen w-full bg-[#05070d] overflow-hidden overflow-x-hidden">
      {/* Sidebar responsivo (drawer en móvil, fijo en desktop) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
        <Topbar
          isMenuOpen={isMobileMenuOpen}
          onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 md:p-6 bg-[#05070d] overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
