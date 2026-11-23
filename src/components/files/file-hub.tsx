"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Link2,
  Loader2,
  BookOpen,
  Send,
  Clock,
  MessageSquareText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LessonItem, MaterialItem, SubmissionItem } from "@/lib/supabase/types";
import { getDriveLinks, isValidHttpUrl } from "@/utils/driveHelpers";
import { useUserRole } from "@/components/providers/role-provider";
import { publishNotification } from "@/lib/notifications";
import {
  MATERIAL_CATEGORIES,
  MaterialCategory,
  encodeMaterialFileType,
  parseMaterialFileType,
} from "@/utils/materialCategory";

interface FileHubProps {
  lessonId?: string;
}

type MaterialWithLesson = MaterialItem & {
  lessons?: { title: string } | null;
};

type SubmissionWithLesson = SubmissionItem & {
  lessons?: { title: string } | null;
};

const MATERIAL_TYPES = [
  "Google Doc / Word",
  "PDF",
  "Google Colab / Código",
  "Hoja de Cálculo (Excel/Sheets)",
  "Presentación",
  "Carpeta / ZIP",
  "Otro Enlace",
] as const;

export function FileHub({ lessonId }: FileHubProps) {
  const { userName: contextUserName } = useUserRole();
  const [hubTab, setHubTab] = useState<"materials" | "submissions">("materials");
  const [materialCategoryTab, setMaterialCategoryTab] = useState<MaterialCategory>("Teoría");

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [materials, setMaterials] = useState<MaterialWithLesson[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de formulario Materiales
  const [selectedLessonId, setSelectedLessonId] = useState(
    lessonId && lessonId !== "global-hub" ? lessonId : ""
  );
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState<string>(MATERIAL_TYPES[0]);
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>("Teoría");
  const [driveUrl, setDriveUrl] = useState("");
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);

  // Estados de formulario Entregar Práctica
  const [studentName, setStudentName] = useState(contextUserName);
  const [submissionLessonId, setSubmissionLessonId] = useState(
    lessonId && lessonId !== "global-hub" ? lessonId : ""
  );
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmittingPractice, setIsSubmittingPractice] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setStudentName(contextUserName);
  }, [contextUserName]);

  const fetchHubData = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const lessonsQuery = supabase
        .from("lessons")
        .select("id, title, description, video_url, module_name, order_index, created_at")
        .order("order_index", { ascending: true });

      let materialsQuery = supabase
        .from("materials")
        .select("id, lesson_id, title, file_type, drive_url, created_at, lessons(title)")
        .order("created_at", { ascending: false });

      let submissionsQuery = supabase
        .from("submissions")
        .select("id, student_name, lesson_id, title, submission_url, notes, status, feedback, created_at, lessons(title)")
        .order("created_at", { ascending: false });

      if (lessonId && lessonId !== "global-hub") {
        materialsQuery = materialsQuery.eq("lesson_id", lessonId);
        submissionsQuery = submissionsQuery.eq("lesson_id", lessonId);
      }

      const [lessonsRes, materialsRes, submissionsRes] = await Promise.all([
        lessonsQuery,
        materialsQuery,
        submissionsQuery,
      ]);

      if (!lessonsRes.error && lessonsRes.data) {
        setLessons(lessonsRes.data as LessonItem[]);
      }

      if (!materialsRes.error && materialsRes.data) {
        setMaterials(materialsRes.data as unknown as MaterialWithLesson[]);
      }

      if (!submissionsRes.error && submissionsRes.data) {
        setSubmissions(submissionsRes.data as unknown as SubmissionWithLesson[]);
      }
    } catch (err) {
      console.error("Error cargando Hub de Archivos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!title.trim() || !driveUrl.trim()) {
      setStatusMessage({
        type: "error",
        text: "Ingresa el título del documento y una URL válida.",
      });
      return;
    }

    if (!isValidHttpUrl(driveUrl)) {
      setStatusMessage({
        type: "error",
        text: "Ingresa una URL válida que comience con https:// o http://.",
      });
      return;
    }

    const supabase = createClient();
    setIsSubmittingMaterial(true);

    try {
      const { data, error } = await supabase
        .from("materials")
        .insert({
          lesson_id: selectedLessonId || null,
          title: title.trim(),
          file_type: encodeMaterialFileType(fileType, materialCategory),
          drive_url: driveUrl.trim(),
        })
        .select("id, lesson_id, title, file_type, drive_url, created_at, lessons(title)")
        .single();

      if (error) {
        setStatusMessage({ type: "error", text: `Error al guardar: ${error.message}` });
      } else if (data) {
        const createdMaterial = data as unknown as MaterialWithLesson;
        const parsed = parseMaterialFileType(createdMaterial.file_type);
        setMaterials((prev) => [createdMaterial, ...prev]);
        setTitle("");
        setDriveUrl("");
        setMaterialCategory("Teoría");
        setMaterialCategoryTab(parsed.category);
        setStatusMessage({
          type: "success",
          text: "Documento registrado exitosamente.",
        });
        void publishNotification({
          id: `archivo-${createdMaterial.id}`,
          tipo: "archivo",
          titulo: createdMaterial.title,
          modulo: createdMaterial.lessons?.title
            ? `Material (${parsed.category}) en ${createdMaterial.lessons.title}`
            : `${parsed.category} · ${parsed.fileType} en Hub`,
          created_at: createdMaterial.created_at || new Date().toISOString(),
          href: "/files",
        });
      }
    } catch (err) {
      console.error("Error agregando material:", err);
      setStatusMessage({ type: "error", text: "Error inesperado al registrar el documento." });
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  const handleSubmitPractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!studentName.trim() || !submissionTitle.trim() || !submissionUrl.trim()) {
      setStatusMessage({
        type: "error",
        text: "Completa tu nombre, el título de la práctica y la URL compartida.",
      });
      return;
    }

    if (!isValidHttpUrl(submissionUrl)) {
      setStatusMessage({
        type: "error",
        text: "La URL del trabajo debe comenzar con https:// o http://.",
      });
      return;
    }

    const supabase = createClient();
    setIsSubmittingPractice(true);

    try {
      const { data, error } = await supabase
        .from("submissions")
        .insert({
          student_name: studentName.trim(),
          lesson_id: submissionLessonId || null,
          title: submissionTitle.trim(),
          submission_url: submissionUrl.trim(),
          notes: submissionNotes.trim() || null,
          status: "Pendiente",
        })
        .select("id, student_name, lesson_id, title, submission_url, notes, status, feedback, created_at, lessons(title)")
        .single();

      if (error) {
        setStatusMessage({ type: "error", text: `Error al enviar práctica: ${error.message}` });
      } else if (data) {
        setSubmissions((prev) => [data as unknown as SubmissionWithLesson, ...prev]);
        setSubmissionTitle("");
        setSubmissionUrl("");
        setSubmissionNotes("");
        setStatusMessage({
          type: "success",
          text: "¡Práctica enviada correctamente! Queda pendiente de revisión por el docente.",
        });
      }
    } catch (err) {
      console.error("Error enviando práctica:", err);
      setStatusMessage({ type: "error", text: "Error inesperado al enviar la práctica." });
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  const canSubmitMaterial = Boolean(title.trim() && driveUrl.trim()) && !isSubmittingMaterial;
  const canSubmitPractice =
    Boolean(studentName.trim() && submissionTitle.trim() && submissionUrl.trim()) &&
    !isSubmittingPractice;

  return (
    <div className="bg-[#0d0f12] text-gray-200 overflow-x-hidden">
      {/* Navegación de Pestañas del Hub */}
      <div className="px-4 md:px-8 pt-4 border-b border-[#232a35] bg-[#13161c] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setHubTab("materials");
            setStatusMessage(null);
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            hubTab === "materials"
              ? "border-indigo-500 text-indigo-300"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Materiales del Curso ({materials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setHubTab("submissions");
            setStatusMessage(null);
          }}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            hubTab === "submissions"
              ? "border-indigo-500 text-indigo-300"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Entregar Práctica ({submissions.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: MATERIALES DEL CURSO */}
      {hubTab === "materials" && (() => {
        const theoryMaterials = materials.filter(
          (item) => parseMaterialFileType(item.file_type).category === "Teoría"
        );
        const practiceMaterials = materials.filter(
          (item) => parseMaterialFileType(item.file_type).category === "Práctica"
        );
        const filteredMaterials =
          materialCategoryTab === "Teoría" ? theoryMaterials : practiceMaterials;

        return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-8">
          {/* Columna Izquierda: Lista de Materiales */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#232a35] pb-3">
              <h2 className="text-base font-semibold text-white">Documentos y Guías de Estudio</h2>
              <p className="text-xs text-gray-400">
                Abre o descarga materiales de Google Drive, Docs, Sheets, Slides, Colab y enlaces externos.
              </p>
            </div>

            {/* Sub-pestañas Teoría / Práctica */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#13161c] border border-[#232a35]">
              <button
                type="button"
                onClick={() => setMaterialCategoryTab("Teoría")}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  materialCategoryTab === "Teoría"
                    ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/35"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <span>Teoría ({theoryMaterials.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMaterialCategoryTab("Práctica")}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  materialCategoryTab === "Práctica"
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/35"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <span>Práctica ({practiceMaterials.length})</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Cargando documentos...</span>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#13161c] border border-[#232a35] text-xs text-gray-500 text-center">
                No hay documentos registrados en {materialCategoryTab} todavía.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMaterials.map((item) => {
                  const { previewUrl, downloadUrl } = getDriveLinks(item.drive_url);
                  const parsed = parseMaterialFileType(item.file_type);
                  const lessonLabel = item.lesson_id
                    ? item.lessons?.title || "Clase asignada"
                    : "Recurso General";

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#13161c] border border-[#232a35] hover:border-indigo-500/40 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-[#1a1f26] border border-[#232a35] text-indigo-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-200 truncate">{item.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-500">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                                parsed.category === "Práctica"
                                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                  : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                              }`}
                            >
                              {parsed.category}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px]">
                              {parsed.fileType}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border truncate max-w-[200px] ${
                                item.lesson_id
                                  ? "bg-[#1a1f26] text-gray-300 border-[#232a35]"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              }`}
                            >
                              {lessonLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f26] hover:bg-[#232a35] text-gray-200 border border-[#232a35] text-xs font-medium transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Abrir / Ver</span>
                        </a>
                        {downloadUrl && (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
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

          {/* Columna Derecha: Agregar Documento */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#232a35] pb-3">
              <h2 className="text-base font-semibold text-white">Agregar Documento por Enlace</h2>
              <p className="text-xs text-gray-400">
                Vincula documentos de Google (Docs, Sheets, Slides, Drive, Colab) o cualquier enlace externo.
              </p>
            </div>

            <form
              onSubmit={handleAddMaterial}
              className="space-y-4 bg-[#13161c] border border-[#232a35] rounded-xl p-5"
            >
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  Seleccionar Clase (Opcional)
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">General / Sin clase asignada</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      #{l.order_index} — {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Título del Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Apuntes en Google Docs / Repositorio"
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Tipo *
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    {MATERIAL_TYPES.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Categoría *
                  </label>
                  <select
                    required
                    value={materialCategory}
                    onChange={(e) => setMaterialCategory(e.target.value as MaterialCategory)}
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    {MATERIAL_CATEGORIES.map((categoryOption) => (
                      <option key={categoryOption} value={categoryOption}>
                        {categoryOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  URL del Documento o Recurso *
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://docs.google.com/..., https://drive.google.com/..., https://github.com/..."
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                    statusMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmitMaterial}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingMaterial ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando enlace...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Guardar Documento</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        );
      })()}

      {/* PESTAÑA 2: ENTREGAR PRÁCTICA (0 MB Storage - solo enlaces externos) */}
      {hubTab === "submissions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-8">
          {/* Formulario de Entrega de Práctica */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#232a35] pb-3">
              <h2 className="text-base font-semibold text-white">Entregar Práctica o Tarea</h2>
              <p className="text-xs text-gray-400">
                Envía tu trabajo mediante enlace compartido de Google Colab, GitHub, Google Drive o Docs.
              </p>
            </div>

            <form
              onSubmit={handleSubmitPractice}
              className="space-y-4 bg-[#13161c] border border-[#232a35] rounded-xl p-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Nombre del Estudiante *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Clase o Módulo Asociado
                  </label>
                  <select
                    value={submissionLessonId}
                    onChange={(e) => setSubmissionLessonId(e.target.value)}
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Entrega General</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.order_index} — {l.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  Título de la Práctica *
                </label>
                <input
                  type="text"
                  required
                  value={submissionTitle}
                  onChange={(e) => setSubmissionTitle(e.target.value)}
                  placeholder="Ej. Práctica 1 - Análisis en Python"
                  className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  URL Compartida del Trabajo *
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://colab.research.google.com/..., https://github.com/..., https://drive.google.com/..."
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  Comentario / Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Agrega observaciones o dudas sobre tu entrega..."
                  className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {statusMessage && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                    statusMessage.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmitPractice}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingPractice ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando entrega...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Práctica</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Lista de Entregas Enviadas */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#232a35] pb-3">
              <h2 className="text-base font-semibold text-white">Entregas Enviadas</h2>
              <p className="text-xs text-gray-400">
                Consulta el estado de revisión y la retroalimentación del docente.
              </p>
            </div>

            {isLoading ? (
              <div className="py-8 flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Cargando entregas...</span>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#13161c] border border-[#232a35] text-xs text-gray-500 text-center">
                Aún no hay entregas registradas en <code className="text-indigo-400">submissions</code>.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => {
                  const isReviewed = sub.status.toLowerCase() === "revisado";
                  const lessonLabel = sub.lesson_id
                    ? sub.lessons?.title || "Clase asignada"
                    : "Entrega General";

                  return (
                    <div
                      key={sub.id}
                      className="p-4 bg-[#13161c] border border-[#232a35] rounded-xl space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-white truncate">{sub.title}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Por <span className="text-gray-200 font-medium">{sub.student_name}</span> •{" "}
                            <span className="font-mono text-indigo-300">{lessonLabel}</span>
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
                            isReviewed
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {isReviewed ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{sub.status}</span>
                        </span>
                      </div>

                      {sub.notes && (
                        <p className="text-[11px] text-gray-400 bg-[#1a1f26] px-3 py-2 rounded-lg border border-[#232a35]">
                          {sub.notes}
                        </p>
                      )}

                      {sub.feedback && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200 flex items-start gap-2">
                          <MessageSquareText className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-emerald-300 block">
                              Retroalimentación del docente:
                            </span>
                            <span>{sub.feedback}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-gray-500 font-mono">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir enlace</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
