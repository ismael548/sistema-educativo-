"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  FileText,
  Video,
  Search,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link2,
  Clock,
  MessageSquareText,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LessonItem, MaterialItem, SubmissionItem } from "@/lib/supabase/types";
import { getDriveLinks, isValidHttpUrl } from "@/utils/driveHelpers";
import { publishNotification } from "@/lib/notifications";
import {
  MATERIAL_CATEGORIES,
  MaterialCategory,
  encodeMaterialFileType,
  inferResourceFileType,
  parseMaterialFileType,
} from "@/utils/materialCategory";

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

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "lessons" | "materials" | "submissions" | "students"
  >("lessons");

  // Estado desde Supabase
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [materials, setMaterials] = useState<MaterialWithLesson[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithLesson[]>([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario: Crear Clase (lessons)
  const [lessonTitle, setLessonTitle] = useState("");
  const [moduleName, setModuleName] = useState("Módulo 1: Fundamentos");
  const [orderIndex, setOrderIndex] = useState(1);
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // Recursos adjuntos al crear nueva clase
  const [pendingResources, setPendingResources] = useState<
    Array<{ id: string; title: string; category: MaterialCategory; url: string }>
  >([]);
  const [pendingResTitle, setPendingResTitle] = useState("");
  const [pendingResCategory, setPendingResCategory] = useState<MaterialCategory>("Teoría");
  const [pendingResUrl, setPendingResUrl] = useState("");

  // Gestor de recursos de clase existente
  const [managingLessonId, setManagingLessonId] = useState<string | null>(null);
  const [lessonResTitle, setLessonResTitle] = useState("");
  const [lessonResCategory, setLessonResCategory] = useState<MaterialCategory>("Teoría");
  const [lessonResUrl, setLessonResUrl] = useState("");
  const [isSavingLessonResource, setIsSavingLessonResource] = useState(false);

  // Formulario: Agregar Documento (materials)
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState<string>(MATERIAL_TYPES[0]);
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>("Teoría");
  const [driveUrl, setDriveUrl] = useState("");
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);

  // Notificación de estado
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estudiantes de ejemplo
  const [students] = useState([
    { id: "u1", name: "Estudiante Demo", email: "estudiante@noxiuslm.edu", enrolledCourses: 3, progress: "78%" },
    { id: "u2", name: "Laura Gómez", email: "laura@domain.com", enrolledCourses: 2, progress: "94%" },
    { id: "u3", name: "Mateo Vargas", email: "mateo@dev.io", enrolledCourses: 4, progress: "45%" },
    { id: "u4", name: "Sofía Chen", email: "sofia@code.org", enrolledCourses: 1, progress: "100%" },
  ]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      const [lessonsRes, materialsRes, submissionsRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, title, description, video_url, module_name, order_index, created_at")
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("materials")
          .select("id, lesson_id, title, file_type, drive_url, created_at, lessons(title)")
          .order("created_at", { ascending: false }),
        supabase
          .from("submissions")
          .select("id, student_name, lesson_id, title, submission_url, notes, status, feedback, created_at, lessons(title)")
          .order("created_at", { ascending: false }),
      ]);

      if (lessonsRes.error) {
        console.error("Error cargando lessons:", lessonsRes.error.message);
      } else {
        const fetchedLessons = (lessonsRes.data as LessonItem[]) || [];
        setLessons(fetchedLessons);
        if (fetchedLessons.length > 0) {
          setOrderIndex(fetchedLessons.length + 1);
        }
      }

      if (materialsRes.error) {
        console.error("Error cargando materials:", materialsRes.error.message);
      } else {
        setMaterials((materialsRes.data as unknown as MaterialWithLesson[]) || []);
      }

      if (submissionsRes.error) {
        console.error("Error cargando submissions:", submissionsRes.error.message);
      } else {
        const subs = (submissionsRes.data as unknown as SubmissionWithLesson[]) || [];
        setSubmissions(subs);
        const initialDrafts: Record<string, string> = {};
        subs.forEach((s) => {
          initialDrafts[s.id] = s.feedback || "";
        });
        setFeedbackDrafts(initialDrafts);
      }
    } catch (err) {
      console.error("Error inesperado en Admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReviewSubmission = async (submissionId: string) => {
    const supabase = createClient();
    setReviewingId(submissionId);
    setFeedback(null);

    const feedbackText = (feedbackDrafts[submissionId] || "").trim();

    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "Revisado",
          feedback: feedbackText || null,
        })
        .eq("id", submissionId);

      if (error) {
        setFeedback({ type: "error", text: `Error al actualizar entrega: ${error.message}` });
      } else {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? { ...s, status: "Revisado", feedback: feedbackText || null }
              : s
          )
        );
        setFeedback({ type: "success", text: "Entrega marcada como Revisado." });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Error inesperado al revisar la entrega." });
    } finally {
      setReviewingId(null);
    }
  };

  const handleAddPendingResource = () => {
    setFeedback(null);
    if (!pendingResTitle.trim() || !pendingResUrl.trim()) {
      setFeedback({
        type: "error",
        text: "Completa el título y el enlace del recurso antes de adjuntarlo.",
      });
      return;
    }
    if (!isValidHttpUrl(pendingResUrl)) {
      setFeedback({
        type: "error",
        text: "El enlace del recurso debe comenzar con https:// o http://.",
      });
      return;
    }

    setPendingResources((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: pendingResTitle.trim(),
        category: pendingResCategory,
        url: pendingResUrl.trim(),
      },
    ]);
    setPendingResTitle("");
    setPendingResUrl("");
    setPendingResCategory("Teoría");
  };

  const handleCreateLessonResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingLessonId) return;
    setFeedback(null);

    if (!lessonResTitle.trim() || !lessonResUrl.trim()) {
      setFeedback({
        type: "error",
        text: "Ingresa el título y la URL del recurso para esta clase.",
      });
      return;
    }
    if (!isValidHttpUrl(lessonResUrl)) {
      setFeedback({
        type: "error",
        text: "Ingresa una URL válida que comience con https:// o http://.",
      });
      return;
    }

    const supabase = createClient();
    setIsSavingLessonResource(true);
    try {
      const inferredType = inferResourceFileType(lessonResUrl.trim(), lessonResCategory);
      const { data, error } = await supabase
        .from("materials")
        .insert({
          lesson_id: managingLessonId,
          title: lessonResTitle.trim(),
          file_type: encodeMaterialFileType(inferredType, lessonResCategory),
          drive_url: lessonResUrl.trim(),
        })
        .select("id, lesson_id, title, file_type, drive_url, created_at, lessons(title)")
        .single();

      if (error) {
        setFeedback({ type: "error", text: `Error al adjuntar recurso: ${error.message}` });
      } else if (data) {
        const createdMaterial = data as unknown as MaterialWithLesson;
        const parsed = parseMaterialFileType(createdMaterial.file_type);
        setMaterials((prev) => [createdMaterial, ...prev]);
        setLessonResTitle("");
        setLessonResUrl("");
        setFeedback({
          type: "success",
          text: `Recurso "${createdMaterial.title}" (${parsed.category}) vinculado a la clase.`,
        });
        void publishNotification({
          id: `archivo-${createdMaterial.id}`,
          tipo: "archivo",
          titulo: createdMaterial.title,
          modulo: createdMaterial.lessons?.title
            ? `Material (${parsed.category}) en ${createdMaterial.lessons.title}`
            : `${parsed.category} · ${parsed.fileType}`,
          created_at: createdMaterial.created_at || new Date().toISOString(),
          href: `/courses/general/lessons/${managingLessonId}`,
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Error inesperado al guardar el recurso." });
    } finally {
      setIsSavingLessonResource(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!lessonTitle.trim() || !videoUrl.trim()) {
      setFeedback({ type: "error", text: "El título y la URL del video son obligatorios." });
      return;
    }

    const supabase = createClient();
    setIsSavingLesson(true);

    try {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          title: lessonTitle.trim(),
          module_name: moduleName.trim() || "Módulo General",
          description: description.trim() || null,
          video_url: videoUrl.trim(),
          order_index: Number(orderIndex) || 1,
        })
        .select()
        .single();

      if (error) {
        setFeedback({ type: "error", text: `Error al guardar clase: ${error.message}` });
      } else if (data) {
        const created = data as LessonItem;

        // Guardar recursos adjuntos en Supabase vinculados a created.id
        if (pendingResources.length > 0) {
          const rowsToInsert = pendingResources.map((res) => ({
            lesson_id: created.id,
            title: res.title,
            file_type: encodeMaterialFileType(
              inferResourceFileType(res.url, res.category),
              res.category
            ),
            drive_url: res.url,
          }));
          const { data: insertedMats } = await supabase
            .from("materials")
            .insert(rowsToInsert)
            .select("id, lesson_id, title, file_type, drive_url, created_at, lessons(title)");
          if (Array.isArray(insertedMats) && insertedMats.length > 0) {
            setMaterials((prev) => [
              ...(insertedMats as unknown as MaterialWithLesson[]),
              ...prev,
            ]);
          }
          setPendingResources([]);
        }

        setLessons((prev) => [...prev, created]);
        if (!selectedLessonId) setSelectedLessonId(created.id);
        setLessonTitle("");
        setVideoUrl("");
        setDescription("");
        setOrderIndex((prev) => prev + 1);
        setFeedback({ type: "success", text: `Clase "${created.title}" creada correctamente.` });
        void publishNotification({
          id: `clase-${created.id}`,
          tipo: "clase",
          titulo: created.title,
          modulo: created.module_name || "Nueva clase disponible",
          created_at: created.created_at || new Date().toISOString(),
          href: `/courses/general/lessons/${created.id}`,
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Error inesperado al crear la clase." });
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) {
      setFeedback({ type: "error", text: `No se pudo eliminar: ${error.message}` });
    } else {
      setLessons((prev) => prev.filter((l) => l.id !== id));
      setMaterials((prev) => prev.filter((m) => m.lesson_id !== id));
      setFeedback({ type: "success", text: "Clase eliminada." });
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!materialTitle.trim() || !driveUrl.trim()) {
      setFeedback({
        type: "error",
        text: "Ingresa el título del documento y una URL válida.",
      });
      return;
    }

    if (!isValidHttpUrl(driveUrl)) {
      setFeedback({
        type: "error",
        text: "Ingresa una URL válida que comience con https:// o http://.",
      });
      return;
    }

    const supabase = createClient();
    setIsSavingMaterial(true);

    try {
      const { data, error } = await supabase
        .from("materials")
        .insert({
          lesson_id: selectedLessonId || null,
          title: materialTitle.trim(),
          file_type: encodeMaterialFileType(materialType, materialCategory),
          drive_url: driveUrl.trim(),
        })
        .select("id, lesson_id, title, file_type, drive_url, created_at, lessons(title)")
        .single();

      if (error) {
        setFeedback({ type: "error", text: `Error al guardar documento: ${error.message}` });
      } else if (data) {
        const createdMaterial = data as unknown as MaterialWithLesson;
        const parsed = parseMaterialFileType(createdMaterial.file_type);
        setMaterials((prev) => [createdMaterial, ...prev]);
        setMaterialTitle("");
        setDriveUrl("");
        setMaterialCategory("Teoría");
        setFeedback({
          type: "success",
          text: selectedLessonId
            ? "Documento agregado y vinculado a la clase."
            : "Documento general guardado correctamente.",
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
      console.error(err);
      setFeedback({ type: "error", text: "Error inesperado al agregar el documento." });
    } finally {
      setIsSavingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      setFeedback({ type: "error", text: `No se pudo eliminar el documento: ${error.message}` });
    } else {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      setFeedback({ type: "success", text: "Documento eliminado." });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232a35] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Panel de Administración de Clases y Recursos
          </h1>
          <p className="text-xs text-gray-400">
            Gestiona lecciones (YouTube / Google Drive) y documentos descargables conectados a Supabase.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#13161c] p-1 rounded-xl border border-[#232a35] text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("lessons");
              setFeedback(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "lessons"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Clases (Videos)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("materials");
              setFeedback(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "materials"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Documentos (Drive)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("submissions");
              setFeedback(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "submissions"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Entregas de Alumnos ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("students");
              setFeedback(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === "students"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Estudiantes
          </button>
        </div>
      </div>

      {/* Feedback Global */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tab 1: Crear y Gestionar Clases (lessons) */}
      {activeTab === "lessons" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#13161c] border border-[#232a35] space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Crear Nueva Clase</span>
            </h2>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Título de la Clase *
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Ej. Introducción a PostgreSQL y RLS"
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Módulo *
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="Ej. Módulo 1: Base de Datos"
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Orden (#)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  URL del Video (YouTube o Google Drive) *
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... o https://drive.google.com/file/d/.../view"
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                  Descripción de la Clase
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Resume los objetivos y temas tratados en esta lección..."
                  className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Recursos adjuntos antes de publicar la clase */}
              <div className="p-4 rounded-xl bg-[#0d111a] border border-[#232a35] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-200 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recursos de la Clase (Teoría, Práctica o Videos de Complemento)</span>
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {pendingResources.length} adjunto{pendingResources.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Título del recurso
                    </label>
                    <input
                      type="text"
                      value={pendingResTitle}
                      onChange={(e) => setPendingResTitle(e.target.value)}
                      placeholder="Ej. Guía PDF / Video extra"
                      className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Categoría
                    </label>
                    <select
                      value={pendingResCategory}
                      onChange={(e) => setPendingResCategory(e.target.value as MaterialCategory)}
                      className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    >
                      {MATERIAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Enlace / URL
                    </label>
                    <input
                      type="url"
                      value={pendingResUrl}
                      onChange={(e) => setPendingResUrl(e.target.value)}
                      placeholder="https://drive.google.com/... o youtube.com/..."
                      className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddPendingResource}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a1f26] hover:bg-indigo-600/25 border border-indigo-500/35 text-xs font-medium text-indigo-200 transition-colors"
                    >
                      + Adjuntar
                    </button>
                  </div>
                </div>

                {pendingResources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {pendingResources.map((res) => (
                      <div
                        key={res.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#13161c] border border-[#232a35] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0 ${
                              res.category === "Videos de Complemento"
                                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                                : res.category === "Práctica"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                            }`}
                          >
                            {res.category}
                          </span>
                          <span className="font-medium text-gray-200 truncate">{res.title}</span>
                          <span className="text-[11px] text-gray-500 truncate hidden sm:inline">
                            ({res.url})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingResources((prev) => prev.filter((item) => item.id !== res.id))
                          }
                          className="p-1 text-gray-400 hover:text-rose-400 transition-colors shrink-0"
                          title="Quitar recurso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingLesson}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {isSavingLesson ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando clase...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Publicar Clase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Clases Registradas */}
          <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#232a35] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
                Clases Publicadas ({lessons.length})
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Cargando clases desde Supabase...</span>
              </div>
            ) : lessons.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No hay clases creadas en la tabla <code className="text-indigo-400">lessons</code>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171b22] text-gray-400 border-b border-[#232a35]">
                    <tr>
                      <th className="py-3 px-4 font-medium">#</th>
                      <th className="py-3 px-4 font-medium">Título</th>
                      <th className="py-3 px-4 font-medium">Módulo</th>
                      <th className="py-3 px-4 font-medium">URL Video</th>
                      <th className="py-3 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232a35] text-gray-300">
                    {lessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-[#1a1f26]/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-gray-400">{lesson.order_index}</td>
                        <td className="py-3 px-4 font-medium text-white">{lesson.title}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                          {lesson.module_name}
                        </td>
                        <td className="py-3 px-4 text-indigo-400 max-w-xs truncate font-mono text-[11px]">
                          {lesson.video_url}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setManagingLessonId((prev) =>
                                  prev === lesson.id ? null : lesson.id
                                )
                              }
                              className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                                managingLessonId === lesson.id
                                  ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                                  : "bg-[#1a1f26] border-[#232a35] hover:border-indigo-500/40 text-gray-300 hover:text-white"
                              }`}
                            >
                              Recursos ({materials.filter((m) => m.lesson_id === lesson.id).length})
                            </button>
                            <Link
                              href={`/courses/general/lessons/${lesson.id}`}
                              className="px-2.5 py-1 rounded bg-[#1a1f26] hover:bg-indigo-600 text-gray-300 hover:text-white transition-colors"
                            >
                              Ver Clase
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-400 rounded hover:bg-[#232a35] transition-colors"
                              title="Eliminar clase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Gestor de Recursos para la Clase Seleccionada */}
          {managingLessonId && (() => {
            const targetLesson = lessons.find((l) => l.id === managingLessonId);
            const lessonResources = materials.filter((m) => m.lesson_id === managingLessonId);
            if (!targetLesson) return null;

            return (
              <div className="p-6 rounded-xl bg-[#13161c] border border-indigo-500/35 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#232a35] pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Recursos de la Clase: {targetLesson.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Agrega o elimina materiales de Teoría, Práctica y Videos de Complemento vinculados a esta clase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManagingLessonId(null)}
                    className="px-2.5 py-1 rounded-lg bg-[#1a1f26] hover:bg-[#232a35] text-xs text-gray-300"
                  >
                    Cerrar
                  </button>
                </div>

                <form onSubmit={handleCreateLessonResource} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Título del recurso *
                    </label>
                    <input
                      type="text"
                      required
                      value={lessonResTitle}
                      onChange={(e) => setLessonResTitle(e.target.value)}
                      placeholder="Ej. Diapositivas / Ejercicio / Video extra"
                      className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={lessonResCategory}
                      onChange={(e) => setLessonResCategory(e.target.value as MaterialCategory)}
                      className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    >
                      {MATERIAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-gray-400 mb-1">
                      Enlace / URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={lessonResUrl}
                      onChange={(e) => setLessonResUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isSavingLessonResource}
                      className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
                    >
                      {isSavingLessonResource ? "Guardando..." : "+ Agregar"}
                    </button>
                  </div>
                </form>

                {lessonResources.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">
                    Esta clase aún no tiene recursos adjuntos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lessonResources.map((mat) => {
                      const parsed = parseMaterialFileType(mat.file_type);
                      return (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#1a1f26] border border-[#232a35] text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0 ${
                                parsed.category === "Videos de Complemento"
                                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                                  : parsed.category === "Práctica"
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                    : "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                              }`}
                            >
                              {parsed.category}
                            </span>
                            <span className="font-medium text-white truncate">{mat.title}</span>
                            <span className="text-[10px] font-mono text-gray-400 shrink-0">
                              {parsed.fileType}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 rounded hover:bg-[#232a35] transition-colors shrink-0"
                            title="Eliminar recurso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 2: Agregar Documentos de Google Drive (materials) */}
      {activeTab === "materials" && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#13161c] border border-[#232a35] space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Agregar Documento Compartido de Google Drive</span>
            </h2>

            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Título del Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Ej. Guía de Arquitectura Limpia"
                    className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-400 mb-1.5">
                    Tipo *
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingMaterial || !materialTitle.trim() || !driveUrl.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {isSavingMaterial ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando documento...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Guardar Documento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de Materiales */}
          <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#232a35] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
                Documentos y Guías de Estudio ({materials.length})
              </span>
            </div>

            {materials.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No hay documentos registrados en la tabla <code className="text-indigo-400">materials</code>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171b22] text-gray-400 border-b border-[#232a35]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Documento</th>
                      <th className="py-3 px-4 font-medium">Tipo</th>
                      <th className="py-3 px-4 font-medium">Clase / Categoría</th>
                      <th className="py-3 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232a35] text-gray-300">
                    {materials.map((mat) => {
                      const { previewUrl, downloadUrl } = getDriveLinks(mat.drive_url);
                      const parsed = parseMaterialFileType(mat.file_type);
                      const lessonLabel = mat.lesson_id
                        ? mat.lessons?.title || "Clase vinculada"
                        : "Recurso General";
                      return (
                        <tr key={mat.id} className="hover:bg-[#1a1f26]/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{mat.title}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                                  parsed.category === "Práctica"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                                }`}
                              >
                                {parsed.category}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                                {parsed.fileType}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                mat.lesson_id
                                  ? "bg-[#1a1f26] text-gray-300 border-[#232a35]"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              }`}
                            >
                              {lessonLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a1f26] hover:bg-[#232a35] text-gray-300 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-indigo-400" />
                                <span>Abrir / Ver</span>
                              </a>
                              {downloadUrl && (
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Descargar</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteMaterial(mat.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-400 rounded hover:bg-[#232a35] transition-colors"
                                title="Eliminar documento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Entregas de Alumnos */}
      {activeTab === "submissions" && (
        <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#232a35] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Entregas de Alumnos ({submissions.length})
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Cargando entregas...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No hay entregas registradas en la tabla <code className="text-indigo-400">submissions</code>.
            </div>
          ) : (
            <div className="divide-y divide-[#232a35]">
              {submissions.map((sub) => {
                const isReviewed = sub.status.toLowerCase() === "revisado";
                const lessonLabel = sub.lesson_id
                  ? sub.lessons?.title || "Clase asignada"
                  : "Entrega General";

                return (
                  <div key={sub.id} className="p-5 space-y-3 hover:bg-[#1a1f26]/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{sub.title}</h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${
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
                        <p className="text-xs text-gray-400 mt-1">
                          Estudiante:{" "}
                          <span className="text-gray-200 font-medium">{sub.student_name}</span> •{" "}
                          <span className="font-mono text-indigo-300">{lessonLabel}</span> •{" "}
                          <span className="font-mono text-gray-500">
                            {new Date(sub.created_at).toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <a
                        href={sub.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f26] hover:bg-[#232a35] border border-[#232a35] text-xs font-medium text-indigo-300 shrink-0 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Trabajo</span>
                      </a>
                    </div>

                    {sub.notes && (
                      <p className="text-xs text-gray-400 bg-[#1a1f26] p-3 rounded-lg border border-[#232a35]">
                        <span className="font-mono text-[11px] text-gray-500 mr-1.5">Nota del alumno:</span>
                        {sub.notes}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <div className="relative flex-1">
                        <MessageSquareText className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={feedbackDrafts[sub.id] ?? ""}
                          onChange={(e) =>
                            setFeedbackDrafts((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          placeholder="Escribe retroalimentación o calificación para el estudiante..."
                          className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={reviewingId === sub.id}
                        onClick={() => void handleReviewSubmission(sub.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shrink-0"
                      >
                        {reviewingId === sub.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{isReviewed ? "Actualizar Revisión" : "Marcar como Revisado"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Estudiantes */}
      {activeTab === "students" && (
        <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#232a35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Comunidad de Estudiantes ({students.length})
            </span>
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#171b22] text-gray-400 border-b border-[#232a35]">
                <tr>
                  <th className="py-3 px-4 font-medium">Estudiante</th>
                  <th className="py-3 px-4 font-medium">Correo Electrónico</th>
                  <th className="py-3 px-4 font-medium">Cursos Activos</th>
                  <th className="py-3 px-4 font-medium">Progreso General</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232a35] text-gray-300">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-[#1a1f26]/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-white flex items-center gap-2 whitespace-nowrap">
                      <div className="w-7 h-7 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">{s.email}</td>
                    <td className="py-3 px-4 font-mono">{s.enrolledCourses}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{s.progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
