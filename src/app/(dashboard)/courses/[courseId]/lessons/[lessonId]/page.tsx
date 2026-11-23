"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  PlayCircle,
  FileText,
  ExternalLink,
  Download,
  ArrowLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  FolderOpen,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LessonItem, MaterialItem } from "@/lib/supabase/types";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LessonChat } from "@/components/chat/lesson-chat";
import { getDriveLinks } from "@/utils/driveHelpers";
import { parseMaterialFileType } from "@/utils/materialCategory";
import { useUserRole } from "@/components/providers/role-provider";

interface LessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

export default function LessonViewPage({ params }: LessonPageProps) {
  const { role, markLessonVisited, completedLessonIds, toggleLessonCompleted } = useUserRole();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // Cargar lista de lecciones desde Supabase
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const fetchLessons = async () => {
      setIsLoadingLessons(true);
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("id, title, description, video_url, module_name, order_index, created_at")
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error("Error cargando lecciones:", error.message);
          setLessons([]);
        } else {
          const list = (data as LessonItem[]) || [];
          setLessons(list);

          if (list.length > 0) {
            const matched = list.find((l) => l.id === params.lessonId);
            setSelectedLessonId(matched ? matched.id : list[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error inesperado cargando lecciones:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingLessons(false);
        }
      }
    };

    fetchLessons();

    return () => {
      isMounted = false;
    };
  }, [params.lessonId]);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || null,
    [lessons, selectedLessonId]
  );

  // Registrar última lección vista en localStorage
  useEffect(() => {
    if (selectedLesson) {
      markLessonVisited({ id: selectedLesson.id, title: selectedLesson.title });
    }
  }, [selectedLesson, markLessonVisited]);

  // Cargar materiales asociados a la lección seleccionada
  useEffect(() => {
    if (!selectedLessonId) {
      setMaterials([]);
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    const fetchMaterials = async () => {
      setIsLoadingMaterials(true);
      try {
        const { data, error } = await supabase
          .from("materials")
          .select("id, lesson_id, title, file_type, drive_url, created_at")
          .eq("lesson_id", selectedLessonId)
          .order("created_at", { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error("Error cargando materiales:", error.message);
          setMaterials([]);
        } else {
          setMaterials((data as MaterialItem[]) || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error inesperado cargando materiales:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMaterials(false);
        }
      }
    };

    fetchMaterials();

    return () => {
      isMounted = false;
    };
  }, [selectedLessonId]);

  // Agrupar lecciones por module_name preservando el orden
  const groupedModules = useMemo(() => {
    const map = new Map<string, LessonItem[]>();
    for (const lesson of lessons) {
      const modName = lesson.module_name?.trim() || "Módulo General";
      if (!map.has(modName)) {
        map.set(modName, []);
      }
      map.get(modName)!.push(lesson);
    }
    return Array.from(map.entries());
  }, [lessons]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] bg-[#0d0f12] gap-4">
      {/* Breadcrumb superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#232a35] text-xs">
        <div className="flex items-center gap-2 text-gray-400 min-w-0">
          <Link
            href="/student"
            className="hover:text-white flex items-center gap-1 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          <span className="text-gray-300 shrink-0">Clases</span>
          {selectedLesson && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              <span className="text-indigo-400 font-medium truncate max-w-md">
                {selectedLesson.title}
              </span>
            </>
          )}
        </div>

        {role === "instructor" && (
          <Link
            href="/admin"
            className="px-2.5 py-1 rounded bg-[#13161c] border border-[#232a35] text-gray-300 hover:text-white hover:border-indigo-500/40 transition-colors"
          >
            Gestionar Clases
          </Link>
        )}
      </div>

      {/* Layout principal: Lista de Clases + Video/Materiales + Chat en Tiempo Real */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Columna Izquierda: Lista de Lecciones */}
        <aside className="lg:col-span-3 bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden flex flex-col max-h-[420px] lg:max-h-[calc(100vh-11rem)]">
          <div className="h-12 px-4 border-b border-[#232a35] bg-[#171b22] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">Contenido del Curso</span>
            </div>
            <span className="text-[11px] font-mono text-gray-500">{lessons.length} clases</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {isLoadingLessons ? (
              <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Cargando clases...</span>
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                <p>No hay clases registradas todavía.</p>
                <Link
                  href="/admin"
                  className="inline-block text-indigo-400 hover:underline font-medium"
                >
                  Crear primera clase en Admin →
                </Link>
              </div>
            ) : (
              groupedModules.map(([moduleName, moduleLessons]) => (
                <div key={moduleName} className="space-y-1.5">
                  <h3 className="text-[11px] font-mono uppercase tracking-wider text-gray-400 px-1">
                    {moduleName}
                  </h3>
                  <div className="space-y-1">
                    {moduleLessons.map((lesson) => {
                      const isActive = lesson.id === selectedLessonId;
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? "bg-indigo-600/15 border border-indigo-500/40 text-indigo-300 font-medium"
                              : "bg-[#1a1f26] border border-transparent text-gray-400 hover:text-gray-200 hover:border-[#232a35]"
                          }`}
                        >
                          {completedLessonIds.includes(lesson.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <PlayCircle
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-indigo-400" : "text-gray-500"
                              }`}
                            />
                          )}
                          <span className="truncate flex-1">{lesson.title}</span>
                          <span className="text-[10px] font-mono text-gray-500 shrink-0">
                            #{lesson.order_index}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Columna Central: Reproductor de Video + Detalles + Materiales de Google Drive */}
        <section className="lg:col-span-5 xl:col-span-6 flex flex-col gap-4 min-w-0">
          {selectedLesson ? (
            <>
              <VideoPlayer
                videoUrl={selectedLesson.video_url}
                title={selectedLesson.title}
              />

              {/* Información de la clase + Checkbox de completado */}
              <div className="p-5 rounded-xl bg-[#13161c] border border-[#232a35] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                      {selectedLesson.module_name || "Módulo"}
                    </span>
                    <h1 className="text-lg font-bold text-white tracking-tight">
                      {selectedLesson.title}
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLessonCompleted(selectedLesson.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                      completedLessonIds.includes(selectedLesson.id)
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                        : "bg-[#1a1f26] border-[#232a35] text-gray-200 hover:border-indigo-500/50 hover:text-white"
                    }`}
                  >
                    {completedLessonIds.includes(selectedLesson.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Clase completada ✓</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-gray-400" />
                        <span>Marcar clase como completada</span>
                      </>
                    )}
                  </button>
                </div>

                {selectedLesson.description && (
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                    {selectedLesson.description}
                  </p>
                )}
              </div>

              {/* Materiales asociados desde Google Drive */}
              <div className="p-5 rounded-xl bg-[#13161c] border border-[#232a35] space-y-3">
                <div className="flex items-center justify-between border-b border-[#232a35] pb-2.5">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-semibold text-white">
                      Materiales Descargables
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">
                    {materials.length} archivo{materials.length === 1 ? "" : "s"}
                  </span>
                </div>

                {isLoadingMaterials ? (
                  <div className="py-4 flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Cargando materiales...</span>
                  </div>
                ) : materials.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">
                    No hay documentos adjuntos para esta clase.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {materials.map((mat) => {
                      const { previewUrl, downloadUrl } = getDriveLinks(mat.drive_url);

                      return (
                        <div
                          key={mat.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#1a1f26] border border-[#232a35] hover:border-indigo-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-[#13161c] border border-[#232a35] text-indigo-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-200 truncate">
                                {mat.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-300 uppercase">
                                  {parseMaterialFileType(mat.file_type).fileType}
                                </span>
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                                    parseMaterialFileType(mat.file_type).category === "Práctica"
                                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                      : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                                  }`}
                                >
                                  {parseMaterialFileType(mat.file_type).category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13161c] hover:bg-[#232a35] border border-[#232a35] text-xs text-gray-200 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Abrir / Ver</span>
                            </a>

                            {downloadUrl && (
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Descargar</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-10 rounded-xl bg-[#13161c] border border-[#232a35] text-center space-y-4">
              {isLoadingLessons ? (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Cargando reproductor...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-white">
                      Aún no hay clases publicadas
                    </h2>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Registra tu primera clase con un enlace de YouTube o Google Drive para activar el reproductor y el chat en tiempo real.
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                  >
                    <span>Ir al Panel de Admin para crear clase</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        {/* Columna Derecha (o debajo en móvil): Chat de la Clase en Tiempo Real */}
        <aside className="lg:col-span-4 xl:col-span-3 h-[480px] lg:h-[calc(100vh-11rem)]">
          {selectedLesson ? (
            <LessonChat lessonId={selectedLesson.id} />
          ) : (
            <div className="h-full rounded-xl bg-[#13161c] border border-[#232a35] flex items-center justify-center p-6 text-xs text-gray-500 text-center">
              Selecciona una clase para unirte al chat en tiempo real.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
