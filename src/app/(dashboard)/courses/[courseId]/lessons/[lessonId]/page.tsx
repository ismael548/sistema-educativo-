'use client';

import React, { useState } from 'react';
import { VideoPlayer } from '@/components/courses/video-player';
import { LessonChat } from '@/components/chat/lesson-chat';
import { FileHub } from '@/components/files/file-hub';
import {
  CheckCircle,
  PlayCircle,
  MessageSquare,
  FileText,
  List,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Share2
} from 'lucide-react';
import Link from 'next/link';

interface LessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

export default function LessonViewPage({ params }: LessonPageProps) {
  const [activeTab, setActiveTab] = useState<'modules' | 'chat' | 'files'>('modules');

  const courseData = {
    title: 'Arquitectura de Software Moderna & Microservicios',
    moduleTitle: 'Módulo 2: Comunicación Asíncrona y Event-Driven Design',
    lessonTitle: '03. Implementación de Supabase Realtime y WebSockets en Alta Concurrencia',
    instructor: 'Dra. Elena Ramos',
    description:
      'En esta sesión exploramos la arquitectura de publicación/suscripción en PostgreSQL, cómo se mapea a través de los canales Realtime de Supabase y cómo desacoplar la carga mediante streaming.',
  };

  const modules = [
    {
      id: 'm1',
      title: 'Módulo 1: Fundamentos de Arquitectura Hexagonal',
      lessons: [
        { id: '1', title: 'Introducción al Dominio y Entidades', duration: '14:20', completed: true },
        { id: '2', title: 'Puertos y Adaptadores en TypeScript', duration: '22:15', completed: true },
      ],
    },
    {
      id: 'm2',
      title: 'Módulo 2: Comunicación Asíncrona',
      lessons: [
        { id: '3', title: 'Implementación de Supabase Realtime', duration: '18:45', completed: false, current: true },
        { id: '4', title: 'Manejo de Backpressure y Pools', duration: '25:10', completed: false },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] bg-[#0d0f12]">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#232a35] text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <Link href="/student" className="hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-300 truncate max-w-xs">{courseData.title}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-indigo-400 font-medium truncate max-w-sm">{courseData.lessonTitle}</span>
        </div>

        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1a1f26] border border-[#232a35] text-gray-400 hover:text-white transition-colors">
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 pt-4 overflow-hidden">
        {/* Left: Video Player & Description */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-1">
          {/* Distraction-free Video Player */}
          <VideoPlayer
            lessonId={params.lessonId}
            title={courseData.lessonTitle}
            initialWatchedSeconds={120}
            onProgressUpdate={(secs, done) => {
              // Supabase update handler
            }}
          />

          {/* Lesson Metadata */}
          <div className="mt-4 p-5 rounded-xl bg-[#13161c] border border-[#232a35] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-400 font-mono uppercase tracking-wider">
                {courseData.moduleTitle}
              </span>
              <span className="text-xs text-gray-400 font-mono">Instructor: {courseData.instructor}</span>
            </div>

            <h1 className="text-lg font-bold text-white tracking-tight">{courseData.lessonTitle}</h1>
            <p className="text-xs text-gray-400 leading-relaxed">{courseData.description}</p>
          </div>
        </div>

        {/* Right Tabbed Panel (Modules, Chat, Files) */}
        <div className="w-full lg:w-96 flex flex-col h-full bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden shrink-0">
          {/* Tabs Navigation */}
          <div className="flex border-b border-[#232a35] bg-[#171b22] text-xs font-medium">
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'modules'
                  ? 'border-indigo-500 text-indigo-300 bg-[#13161c]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Temario</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-indigo-500 text-indigo-300 bg-[#13161c]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Foro & Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'files'
                  ? 'border-indigo-500 text-indigo-300 bg-[#13161c]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Archivos</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'modules' && (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                {modules.map((mod) => (
                  <div key={mod.id} className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-300 tracking-wide">{mod.title}</h4>
                    <div className="space-y-1">
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            lesson.current
                              ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300'
                              : 'bg-[#1a1f26] border border-transparent text-gray-400 hover:text-gray-200 hover:border-[#232a35]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {lesson.completed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <PlayCircle
                                className={`w-4 h-4 shrink-0 ${
                                  lesson.current ? 'text-indigo-400' : 'text-gray-500'
                                }`}
                              />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 ml-2 shrink-0">
                            {lesson.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-full">
                <LessonChat
                  lessonId={params.lessonId}
                  currentUser={{ id: 'current-user-1', name: 'Alex Rivera', role: 'student' }}
                />
              </div>
            )}

            {activeTab === 'files' && (
              <div className="h-full overflow-y-auto">
                <FileHub lessonId={params.lessonId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
