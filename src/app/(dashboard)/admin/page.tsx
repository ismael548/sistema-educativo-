'use client';

import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  PlusCircle,
  UploadCloud,
  FileText,
  Video,
  BarChart3,
  Search,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit3
} from 'lucide-react';
import { validateFile, MAX_FILE_SIZE_RESOURCES } from '@/lib/security/file-validation';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'upload'>('courses');

  // Sample course state
  const [courses, setCourses] = useState([
    {
      id: 'c1',
      title: 'Arquitectura de Software y Sistemas Distribuidos',
      studentsCount: 142,
      modulesCount: 6,
      status: 'Publicado',
      category: 'Backend / DevOps',
    },
    {
      id: 'c2',
      title: 'Next.js 14 Deep Dive con Supabase y TypeScript',
      studentsCount: 230,
      modulesCount: 8,
      status: 'Publicado',
      category: 'Frontend Moderno',
    },
    {
      id: 'c3',
      title: 'Microfrontends con Module Federation',
      studentsCount: 45,
      modulesCount: 4,
      status: 'Borrador',
      category: 'Arquitectura',
    },
  ]);

  // Sample students state
  const [students] = useState([
    { id: 'u1', name: 'Alex Rivera', email: 'alex@aetherlms.io', enrolledCourses: 3, progress: '78%' },
    { id: 'u2', name: 'Laura Gómez', email: 'laura@domain.com', enrolledCourses: 2, progress: '94%' },
    { id: 'u3', name: 'Mateo Vargas', email: 'mateo@dev.io', enrolledCourses: 4, progress: '45%' },
    { id: 'u4', name: 'Sofía Chen', email: 'sofia@code.org', enrolledCourses: 1, progress: '100%' },
  ]);

  // Form states for creating course
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Backend');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Upload state
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    const newCourse = {
      id: `c-${Date.now()}`,
      title: newCourseTitle,
      studentsCount: 0,
      modulesCount: 1,
      status: 'Borrador',
      category: newCourseCategory,
    };

    setCourses([newCourse, ...courses]);
    setNewCourseTitle('');
    setNewCourseDesc('');
    setActiveTab('courses');
  };

  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, MAX_FILE_SIZE_RESOURCES);
    if (!validation.valid) {
      setUploadMessage(`Error: ${validation.error}`);
      setSelectedUploadFile(null);
      return;
    }

    setSelectedUploadFile(file);
    setUploadMessage(`Archivo verificado y listo para Storage: ${validation.sanitizedName}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232a35] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Panel de Control del Instructor / Admin</h1>
          <p className="text-xs text-gray-400">
            Administra planes de estudio, estudiantes matriculados y almacenamiento seguro de recursos.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-[#13161c] p-1 rounded-xl border border-[#232a35] text-xs">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'courses' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Gestión de Cursos
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Estudiantes
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Subir Recursos (Storage)
          </button>
        </div>
      </div>

      {/* Tab 1: Cursos */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Quick Creator */}
          <div className="p-5 rounded-xl bg-[#13161c] border border-[#232a35]">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Crear Nuevo Curso o Módulo
            </h3>
            <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Título del Curso..."
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newCourseCategory}
                onChange={(e) => setNewCourseCategory(e.target.value)}
                className="bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Backend">Backend & Microservicios</option>
                <option value="Frontend">Frontend & Web Frameworks</option>
                <option value="DevOps">DevOps & Cloud</option>
                <option value="Database">Bases de Datos & SQL</option>
              </select>
              <button
                type="submit"
                className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Añadir al Catálogo
              </button>
            </form>
          </div>

          {/* Courses Table */}
          <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#232a35] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
                Cursos Registrados ({courses.length})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171b22] text-gray-400 border-b border-[#232a35]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Nombre del Curso</th>
                    <th className="py-3 px-4 font-medium">Categoría</th>
                    <th className="py-3 px-4 font-medium">Módulos</th>
                    <th className="py-3 px-4 font-medium">Estudiantes</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232a35] text-gray-300">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-[#1a1f26]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{c.title}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{c.category}</td>
                      <td className="py-3 px-4 font-mono">{c.modulesCount}</td>
                      <td className="py-3 px-4 font-mono">{c.studentsCount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            c.status === 'Publicado'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 hover:text-white rounded hover:bg-[#232a35]">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Estudiantes */}
      {activeTab === 'students' && (
        <div className="bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#232a35] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Comunidad de Estudiantes ({students.length})
            </span>
            <div className="relative w-52">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>
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
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-950 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{s.name}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{s.email}</td>
                  <td className="py-3 px-4 font-mono">{s.enrolledCourses}</td>
                  <td className="py-3 px-4 font-mono text-indigo-400">{s.progress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Subida Segura de Recursos */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl bg-[#13161c] border border-[#232a35] rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Subir Material al Bucket de Supabase Storage</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Bucket destino: <code className="text-indigo-300 font-mono">course-materials</code> (con verificación de tipo MIME y tamaño máx 100MB).
            </p>
          </div>

          <div className="relative border-2 border-dashed border-[#232a35] hover:border-indigo-500/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
            <UploadCloud className="w-10 h-10 text-indigo-400 mb-2 stroke-1" />
            <p className="text-xs font-medium text-gray-200">
              Arrastra aquí PDF, diapositivas, ZIPs o videos MP4
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Límite por recurso: 100 Megabytes</p>
            <input
              type="file"
              onChange={handleAdminFileUpload}
              accept=".pdf,.zip,.png,.jpg,.jpeg,.mp4"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {uploadMessage && (
            <p className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs font-mono text-indigo-300">
              {uploadMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
