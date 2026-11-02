import Link from 'next/link';
import { ArrowRight, BookOpen, Video, Shield, Zap, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0d0f12] text-gray-200 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" /> LMS Next.js 14 + Supabase + WebRTC
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Plataforma Educativa de <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
            Alto Rendimiento y Cero Fricción
          </span>
        </h1>

        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
          Diseñada para ingenieros y estudiantes con interfaz oscura elegante (#0d0f12), streaming en vivo con Jitsi Meet, foros en tiempo real y almacenamiento cifrado.
        </p>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/student"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-glow hover:shadow-indigo-500/30"
          >
            <span>Entrar al Portal Estudiante</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#13161c] hover:bg-[#1a1f26] border border-[#232a35] text-gray-300 hover:text-white font-medium text-sm transition-colors"
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Panel de Administración</span>
          </Link>
        </div>

        {/* Highlight Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-4 rounded-xl bg-[#13161c] border border-[#232a35]">
            <Zap className="w-5 h-5 text-indigo-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Rendimiento Extremo</h3>
            <p className="text-xs text-gray-400 mt-1">Next.js App Router, renderizado optimizado y tema oscuro sin bloatware.</p>
          </div>

          <div className="p-4 rounded-xl bg-[#13161c] border border-[#232a35]">
            <Video className="w-5 h-5 text-cyan-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Streaming WebRTC</h3>
            <p className="text-xs text-gray-400 mt-1">Salas de conferencias interactivas integradas con Jitsi Meet y chat lateral.</p>
          </div>

          <div className="p-4 rounded-xl bg-[#13161c] border border-[#232a35]">
            <Shield className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Supabase RLS & Storage</h3>
            <p className="text-xs text-gray-400 mt-1">Seguridad estricta a nivel de fila y carga de archivos con verificación MIME.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
