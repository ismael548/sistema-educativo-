import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#0d0f12] overflow-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar userRole="student" />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar />
        <main className="flex-1 p-6 bg-[#0d0f12]">
          {children}
        </main>
      </div>
    </div>
  );
}
