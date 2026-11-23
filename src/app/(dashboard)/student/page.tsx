"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  BookOpen,
  FileText,
  Video,
  MessageSquare,
  ArrowRight,
  PlusCircle,
  UploadCloud,
  Radio,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LessonItem } from "@/lib/supabase/types";
import { useUserRole } from "@/components/providers/role-provider";
import logoImg from "@/assets/noxius-brand.jpg";

function DiscordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url
    .trim()
    .match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
  return match?.[1] || null;
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    role,
    userName,
    discordUrl,
    setDiscordUrl,
    isHydrated,
    hasActiveSession,
    lastWatchedLesson,
    visitedLessonIds,
    completedLessonIds,
  } = useUserRole();

  const [discordDraft, setDiscordDraft] = useState(discordUrl);
  const [discordSaved, setDiscordSaved] = useState(false);

  useEffect(() => {
    setDiscordDraft(discordUrl);
  }, [discordUrl]);

  const handleSaveDiscordUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscordUrl(discordDraft);
    setDiscordSaved(true);
    window.setTimeout(() => setDiscordSaved(false), 2500);
  };

  useEffect(() => {
    if (!isHydrated) return;
    let hasLocalSession = false;
    try {
      hasLocalSession = Boolean(
        localStorage.getItem("noxius_student_name") ||
          localStorage.getItem("student_name") ||
          sessionStorage.getItem("noxius_student_name") ||
          sessionStorage.getItem("student_name") ||
          localStorage.getItem("aether_user_role") === "instructor"
      );
    } catch {
      hasLocalSession = false;
    }

    if (!hasActiveSession && !hasLocalSession) {
      router.replace("/");
    }
  }, [isHydrated, hasActiveSession, router]);

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [livePeersCount, setLivePeersCount] = useState(0);
  const [isLivePresenting, setIsLivePresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();
      const [lessonsResult, materialsResult, messagesResult] = await Promise.allSettled([
        supabase
          .from("lessons")
          .select("id, title, description, video_url, module_name, order_index, created_at")
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("lesson_messages").select("id", { count: "exact", head: true }),
      ]);

      if (
        lessonsResult.status === "fulfilled" &&
        !lessonsResult.value.error &&
        Array.isArray(lessonsResult.value.data)
      ) {
        setLessons(lessonsResult.value.data as LessonItem[]);
      } else {
        setLessons([]);
      }

      if (
        materialsResult.status === "fulfilled" &&
        !materialsResult.value.error &&
        typeof materialsResult.value.count === "number"
      ) {
        setMaterialsCount(materialsResult.value.count);
      } else {
        setMaterialsCount(0);
      }

      if (
        messagesResult.status === "fulfilled" &&
        !messagesResult.value.error &&
        typeof messagesResult.value.count === "number"
      ) {
        setMessagesCount(messagesResult.value.count);
      } else {
        setMessagesCount(0);
      }
    } catch (err) {
      console.error("Error cargando datos del Dashboard:", err);
      setLessons([]);
      setMaterialsCount(0);
      setMessagesCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Escuchar presencia real en el canal 'noxius-live-room' con fallback seguro
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase.channel("noxius-live-room");

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ isPresenting?: boolean }>();
        setLivePeersCount(Object.keys(state).length);
        const presenting = Object.values(state).some((entries) =>
          entries.some((entry) => entry.isPresenting === true)
        );
        setIsLivePresenting(presenting);
      });

      channel.subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("No se pudo conectar a presencia de live-classroom:", err);
      return undefined;
    }
  }, []);

  const handleDeleteLesson = async (lessonId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (!error) {
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    }
  };

  // Determinar última lección vista válida o primera disponible
  const matchedLastLesson = lastWatchedLesson
    ? lessons.find((l) => l.id === lastWatchedLesson.id)
    : null;
  const resumeLesson = matchedLastLesson || lessons[0] || null;
  const resumeHref = resumeLesson
    ? `/courses/general/lessons/${resumeLesson.id}`
    : "/courses/general/lessons/1";

  // Progreso real basado en lecciones completadas en localStorage
  const completedCount = lessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercentage =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // ========================================================
  // VISTA MODO DOCENTE
  // ========================================================
  if (role === "instructor") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Docente */}
        <div className="rounded-2xl bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={logoImg.src}
              alt="Logo Noxius LM"
              className="w-11 h-11 rounded-full object-cover border border-white/15 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Modo Docente Activo • Noxius LM
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                Panel de Control Docente
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Gestiona tus clases en video, materiales en Google Drive/Colab y transmisiones en vivo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Nueva Clase</span>
            </Link>
            <Link
              href="/files"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1f26] hover:bg-[#232a35] border border-[#232a35] text-gray-200 text-xs font-medium transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>Subir Documento al Hub</span>
            </Link>
            <Link
              href="/live/room-matematicas-avanzadas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Iniciar Transmisión en Vivo</span>
            </Link>
          </div>
        </div>

        {/* Métricas Reales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-2 border-t-indigo-500/40 hover:border-white/20 transition rounded-xl p-5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div>
              <span className="text-xs text-gray-400 font-medium">Clases Publicadas</span>
              <p className="text-3xl font-bold tracking-tight text-white mt-1">{lessons.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-2 border-t-emerald-500/40 hover:border-white/20 transition rounded-xl p-5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div>
              <span className="text-xs text-gray-400 font-medium">Materiales en Drive/Colab</span>
              <p className="text-3xl font-bold tracking-tight text-white mt-1">{materialsCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-2 border-t-cyan-500/40 hover:border-white/20 transition rounded-xl p-5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div>
              <span className="text-xs text-gray-400 font-medium">Mensajes en Chat</span>
              <p className="text-3xl font-bold tracking-tight text-white mt-1">{messagesCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Configuración rápida: Enlace de invitación a Discord */}
        <form
          onSubmit={handleSaveDiscordUrl}
          className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#8ea1e1]">
              <DiscordIcon className="w-4 h-4" />
            </div>
            <div>
              <label
                htmlFor="discord-invite-input"
                className="text-xs font-semibold text-white block"
              >
                Enlace de invitación a Discord
              </label>
              <p className="text-[11px] text-gray-400">
                Visible para todos los estudiantes en el banner superior
              </p>
            </div>
          </div>

          <div className="flex flex-1 sm:max-w-md items-center gap-2">
            <input
              id="discord-invite-input"
              type="url"
              required
              value={discordDraft}
              onChange={(e) => setDiscordDraft(e.target.value)}
              placeholder="https://discord.gg/tu-servidor"
              className="flex-1 min-w-0 bg-[#05070d] border border-white/10 focus:border-[#5865F2] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-medium transition-colors shrink-0"
            >
              {discordSaved ? "Guardado ✓" : "Guardar"}
            </button>
          </div>
        </form>

        {/* Lista de Clases Publicadas */}
        <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Clases Publicadas en Supabase ({lessons.length})
            </h2>
            <Link href="/admin" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              Ir al gestor completo →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Cargando clases...</span>
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No hay clases publicadas todavía. Usa <strong>Crear Nueva Clase</strong> para comenzar.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                        #{lesson.order_index} • {lesson.module_name || "Módulo General"}
                      </span>
                      <h3 className="text-sm font-bold tracking-tight text-white truncate">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{lesson.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/courses/general/lessons/${lesson.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/80 to-cyan-600/80 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-medium transition-all shadow-sm"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLesson(lesson.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                      title="Eliminar clase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // VISTA MODO ESTUDIANTE (POR DEFECTO)
  // ========================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={logoImg.src}
              alt="Logo Noxius LM"
              className="w-11 h-11 rounded-full object-cover border border-white/15 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Portal del Estudiante • Noxius LM
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                Bienvenido, {userName}
              </h1>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Accede a tus clases grabadas, materiales compartidos y transmisiones en vivo desde un solo lugar.
              </p>
            </div>
          </div>

          <Link
            href={resumeHref}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors self-start md:self-auto shadow-glow"
          >
            <span>Continuar Última Lección</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Banner Superior Compacto de Comunidad y Sala en Vivo */}
      <div className="bg-[#0d111a]/90 border border-white/10 backdrop-blur-md rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Lado izquierdo: Estado de Sala en Vivo de Noxius LM */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {isLivePresenting ? (
            <>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-mono font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sala en Vivo Activa</span>
              </span>
              <Link
                href="/live/room-matematicas-avanzadas"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Unirse a la transmisión</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                <span>Sala en espera</span>
              </span>
              <p className="text-xs text-gray-400">
                Cuando inicie la sesión en vivo aparecerá aquí al instante
              </p>
            </div>
          )}
        </div>

        {/* Lado derecho: Acceso Directo a Discord */}
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium px-4 py-2.5 rounded-lg flex items-center justify-center sm:justify-start gap-2.5 transition shrink-0"
        >
          <DiscordIcon className="w-5 h-5 shrink-0" />
          <div className="text-left leading-tight">
            <span className="text-xs font-semibold block">Comunidad en Discord</span>
            <span className="text-[10px] text-white/80 block">
              Dudas rápidas y salas de voz
            </span>
          </div>
        </a>
      </div>

      {/* Tarjetas superiores con datos reales desde Supabase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-2 border-t-indigo-500/40 hover:border-white/20 transition rounded-xl p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Clases Publicadas</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-white">
              {isLoading ? "—" : lessons.length}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Disponibles en plataforma</p>
          </div>
        </div>

        <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-2 border-t-emerald-500/40 hover:border-white/20 transition rounded-xl p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Recursos Disponibles</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-white">
              {isLoading ? "—" : materialsCount}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Guías, PDFs, Docs y Colab</p>
          </div>
        </div>

        <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-2 border-t-cyan-500/40 hover:border-white/20 transition rounded-xl p-4 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Última Clase Vista</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold tracking-tight text-white truncate">
              {resumeLesson ? resumeLesson.title : "Sin clases disponibles"}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {matchedLastLesson
                ? "Retoma donde lo dejaste"
                : resumeLesson
                ? "Primera clase disponible"
                : "Esperando contenido"}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Progreso Real */}
      <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-xl p-4 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <span className="font-medium text-gray-300">Progreso del Curso</span>
          <span className="font-mono text-indigo-300">
            {isLoading
              ? "Calculando progreso..."
              : `${completedCount} de ${lessons.length} clases completadas — ${progressPercentage}%`}
          </span>
        </div>
        <div className="w-full h-2 bg-[#1a1f26] rounded-full overflow-hidden border border-[#232a35]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal: Continuar Aprendiendo (Clases Reales) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Continuar Aprendiendo</h2>
            <Link href={resumeHref} className="text-xs text-indigo-400 hover:underline">
              Ir al reproductor →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-10 rounded-xl bg-[#13161c] border border-[#232a35] flex items-center justify-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Cargando clases desde Supabase...</span>
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-10 rounded-xl bg-[#13161c] border border-[#232a35] text-center space-y-2">
              <PlayCircle className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-medium text-gray-300">
                Aún no hay clases publicadas
              </p>
              <p className="text-xs text-gray-500">
                Cuando el docente publique una clase aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => {
                const ytId = extractYouTubeId(lesson.video_url);
                const thumbnailUrl = ytId
                  ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                  : null;
                const isCompleted = completedLessonIds.includes(lesson.id);
                const isVisited = visitedLessonIds.includes(lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/general/lessons/${lesson.id}`}
                    className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-white/20 transition-all group"
                  >
                    {/* Miniatura automática de YouTube o fallback limpio */}
                    <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden bg-[#1a1f26] border border-[#232a35] shrink-0 relative flex items-center justify-center">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={lesson.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-400">
                          <PlayCircle className="w-8 h-8 text-indigo-400" />
                          <span className="text-[10px] font-mono uppercase">Video Drive</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-9 h-9 text-white drop-shadow" />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider truncate">
                            {lesson.module_name || "Módulo General"}
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completada</span>
                            </span>
                          ) : isVisited ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[10px] font-mono shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Vista</span>
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate mt-1">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-gray-500">
                        <span>Clase #{lesson.order_index}</span>
                        <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                          Abrir clase →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Lateral: Aula Virtual en Vivo + Accesos */}
        <div className="space-y-6">
          <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/20 transition rounded-xl p-5 space-y-4">
            {/* Indicador claro de estado de sala arriba del bloque en vivo */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              {isLivePresenting ? (
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En vivo ahora</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  <span>Sala en espera</span>
                </span>
              )}
              <span className="text-[11px] font-mono text-gray-400">
                {livePeersCount > 0 ? `${livePeersCount} en sala` : "Disponible"}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Aula Virtual en Vivo
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Conéctate al aula virtual para ver la pantalla del docente en vivo con zoom interactivo y código auditable.
              </p>
            </div>

            <Link
              href="/live/room-matematicas-avanzadas"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span>Entrar al Aula Virtual</span>
            </Link>
          </div>

          <div className="bg-[#0c1220]/70 backdrop-blur-xl border border-white/10 border-t-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Accesos Rápidos
            </h3>
            <div className="space-y-2">
              <Link
                href="/files"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1f26] hover:bg-[#202732] text-xs text-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Hub de Archivos ({materialsCount})</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </Link>

              <Link
                href={resumeHref}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1f26] hover:bg-[#202732] text-xs text-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PlayCircle className="w-4 h-4 text-indigo-400" />
                  <span>Reproductor de Clases</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
