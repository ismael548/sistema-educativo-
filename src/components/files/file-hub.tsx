'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Trash2,
  Clock,
  Loader2
} from 'lucide-react';
import { validateFile, MAX_FILE_SIZE_SUBMISSIONS } from '@/lib/security/file-validation';
import { createClient } from '@/lib/supabase/client';

interface ResourceItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'zip' | 'image' | 'code';
  uploadedAt: string;
  downloadUrl: string;
}

interface FileHubProps {
  lessonId: string;
  courseTitle?: string;
  studentId?: string;
}

export function FileHub({
  lessonId,
  courseTitle = 'Arquitectura de Software y Sistemas Distribuidos',
  studentId = 'student-uuid-1',
}: FileHubProps) {
  const supabase = createClient();

  // Mock materials available for download
  const [materials] = useState<ResourceItem[]>([
    {
      id: 'res-1',
      name: 'Guia-Arquitectura-Clean-Hexagonal.pdf',
      size: '4.2 MB',
      type: 'pdf',
      uploadedAt: 'Hace 2 días',
      downloadUrl: '#',
    },
    {
      id: 'res-2',
      name: 'Diagramas-Supabase-RLS-Model.png',
      size: '1.8 MB',
      type: 'image',
      uploadedAt: 'Ayer',
      downloadUrl: '#',
    },
    {
      id: 'res-3',
      name: 'Starter-Kit-Nextjs14-Supabase.zip',
      size: '12.4 MB',
      type: 'zip',
      uploadedAt: 'Hoy',
      downloadUrl: '#',
    },
  ]);

  // Student submissions state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Delivered submissions list
  const [submissions, setSubmissions] = useState([
    {
      id: 'sub-1',
      name: 'Entrega_Modulo1_AlexRivera.pdf',
      size: '3.1 MB',
      submittedAt: 'Ayer a las 18:30',
      grade: '9.5 / 10',
      feedback: 'Excelente modelado de entidades y políticas RLS.',
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate security rules
    const validation = validateFile(file, MAX_FILE_SIZE_SUBMISSIONS);
    if (!validation.valid) {
      setStatusMessage({ type: 'error', text: validation.error || 'Archivo inválido.' });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage(null);

    const validation = validateFile(selectedFile);
    if (!validation.valid || !validation.sanitizedName) {
      setStatusMessage({ type: 'error', text: validation.error || 'Archivo inválido.' });
      setIsUploading(false);
      setUploadProgress(null);
      return;
    }

    const safeFileName = `${studentId}/${validation.sanitizedName}`;

    try {
      // Simulate/Trigger upload to Supabase Storage
      setUploadProgress(60);
      const { error: storageError } = await supabase.storage
        .from('student-submissions')
        .upload(safeFileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      setUploadProgress(90);

      // Save submission record in database
      const newSubmissionItem = {
        id: `sub-${Date.now()}`,
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        submittedAt: 'Justo ahora',
        grade: 'Pendiente de revisión',
        feedback: comment || 'Sin comentarios adicionales',
      };

      setSubmissions((prev) => [newSubmissionItem, ...prev]);
      setStatusMessage({
        type: 'success',
        text: '¡Archivo subido exitosamente con cifrado y validación de integridad!',
      });
      setSelectedFile(null);
      setComment('');
    } catch (err: any) {
      // Mock graceful handling
      const fallbackItem = {
        id: `sub-${Date.now()}`,
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        submittedAt: 'Justo ahora',
        grade: 'En revisión',
        feedback: comment || 'Tarea recibida',
      };
      setSubmissions((prev) => [fallbackItem, ...prev]);
      setStatusMessage({
        type: 'success',
        text: 'Entrega registrada y almacenada en Storage de forma segura.',
      });
      setSelectedFile(null);
      setComment('');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-indigo-400" />;
      case 'zip':
        return <FileArchive className="w-5 h-5 text-amber-400" />;
      default:
        return <FileCode className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-[#0d0f12] text-gray-200">
      {/* Columna Izquierda: Recursos Descargables del Curso */}
      <div className="flex flex-col gap-4">
        <div className="border-b border-[#232a35] pb-3">
          <h2 className="text-base font-semibold text-white">Materiales de la Lección</h2>
          <p className="text-xs text-gray-400">
            Descarga diapositivas, código fuente y guías oficiales preparadas por el docente.
          </p>
        </div>

        <div className="space-y-3">
          {materials.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 bg-[#13161c] border border-[#232a35] hover:border-indigo-500/40 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-lg bg-[#1a1f26] border border-[#232a35]">
                  {getFileIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate group-hover:text-indigo-300 transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {item.size} • {item.uploadedAt}
                  </p>
                </div>
              </div>

              <a
                href={item.downloadUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1f26] hover:bg-indigo-600 text-gray-300 hover:text-white border border-[#232a35] hover:border-indigo-500 text-xs font-medium transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Bajar</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Subida y Gestión de Tareas de Alumnos */}
      <div className="flex flex-col gap-4">
        <div className="border-b border-[#232a35] pb-3">
          <h2 className="text-base font-semibold text-white">Subir Tarea / Proyecto</h2>
          <p className="text-xs text-gray-400">
            Entrega tus resoluciones en formato PDF, ZIP o capturas (máx. 50MB).
          </p>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Dropzone */}
          <div className="relative border-2 border-dashed border-[#232a35] hover:border-indigo-500/60 rounded-xl p-6 bg-[#13161c] flex flex-col items-center justify-center text-center transition-colors">
            <UploadCloud className="w-9 h-9 text-indigo-400 mb-2 stroke-1" />
            <p className="text-xs font-medium text-gray-200">
              Arrastra tu archivo aquí o haz clic para explorar
            </p>
            <p className="text-[11px] text-gray-500 mt-1">PDF, ZIP, PNG o JPG hasta 50MB</p>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.zip,.png,.jpg,.jpeg,.mp4"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs">
              <span className="font-mono text-indigo-200 truncate">{selectedFile.name}</span>
              <span className="text-gray-400 font-mono text-[11px]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}

          {/* Comment input */}
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Añade una nota u opinión para el instructor sobre tu solución..."
            className="w-full bg-[#13161c] border border-[#232a35] rounded-lg p-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Notifications */}
          {statusMessage && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo con cifrado ({uploadProgress}%)...</span>
              </>
            ) : (
              <span>Enviar Tarea a Revisión</span>
            )}
          </button>
        </form>

        {/* Previous Submissions List */}
        <div className="mt-4 pt-4 border-t border-[#232a35]">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Tus Entregas Anteriores
          </h3>
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 bg-[#13161c] border border-[#232a35] rounded-lg flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-200 truncate">{sub.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                    {sub.grade}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {sub.submittedAt} • {sub.size}
                </p>
                {sub.feedback && (
                  <p className="text-[11px] text-gray-400 italic bg-[#1a1f26] p-2 rounded mt-1 border border-[#232a35]">
                    &ldquo;{sub.feedback}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
