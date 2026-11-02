'use client';

import React from 'react';
import { FileHub } from '@/components/files/file-hub';

export default function StandaloneFileHubPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="border-b border-[#232a35] pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">Hub Central de Archivos y Tareas</h1>
        <p className="text-xs text-gray-400">
          Descarga todos los recursos académicos y gestiona tus entregas evaluables con almacenamiento seguro.
        </p>
      </div>

      <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
        <FileHub lessonId="global-hub" />
      </div>
    </div>
  );
}
