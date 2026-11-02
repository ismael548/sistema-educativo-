'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  Clock,
  Award,
  Video,
  FileCheck,
  Calendar,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function StudentDashboardPage() {
  const stats = [
    { title: 'Cursos Activos', value: '3', icon: PlayCircle, change: '+1 este mes' },
    { title: 'Progreso Promedio', value: '78%', icon: TrendingUp, change: '+12% esta semana' },
    { title: 'Horas Completadas', value: '42.5h', icon: Clock, change: 'Meta mensual 85%' },
    { title: 'Certificados Listos', value: '2', icon: Award, change: '1 en evaluación' },
  ];

  const activeCourses = [
    {
      id: 'demo-course',
      title: 'Arquitectura de Software y Sistemas Distribuidos',
      instructor: 'Dra. Elena Ramos',
      progress: 68,
      currentLesson: 'Módulo 3: Event-Driven Architecture y RabbitMQ',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      lessonId: '1',
    },
    {
      id: 'course-react-adv',
      title: 'Next.js 14 Deep Dive con Supabase y TypeScript',
      instructor: 'Ing. Carlos Mendoza',
      progress: 92,
      currentLesson: 'Módulo 5: Server Actions y Optimistic Updates',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      lessonId: '1',
    },
  ];

  const upcomingLive = {
    title: 'Masterclass: Optimización de Consultas PostgreSQL en Supabase',
    instructor: 'Dra. Elena Ramos',
    date: 'Hoy, 21:00 UTC',
    room: 'room-matematicas-avanzadas',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900/40 via-[#13161c] to-[#13161c] border border-indigo-500/20 p-6 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Portal del Estudiante
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido de nuevo, Alex
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Tienes 1 clase en vivo programada para hoy y una tarea con fecha límite próxima.
            </p>
          </div>

          <Link
            href="/courses/demo-course/lessons/1"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors self-start md:self-auto shadow-glow"
          >
            <span>Continuar Última Lección</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">{stat.title}</span>
              <div className="p-2 rounded-lg bg-[#1a1f26] border border-[#232a35] text-indigo-400">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white font-mono">{stat.value}</span>
              <p className="text-[11px] text-gray-500 mt-0.5">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Courses Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Continuar Aprendiendo</h3>
            <span className="text-xs text-indigo-400 hover:underline cursor-pointer">Ver todos</span>
          </div>

          <div className="space-y-4">
            {activeCourses.map((course) => (
              <div
                key={course.id}
                className="bg-[#13161c] border border-[#232a35] rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden bg-black/40 shrink-0 relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-white/90 drop-shadow" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">
                      {course.instructor}
                    </span>
                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 truncate">{course.currentLesson}</p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Progreso</span>
                      <span className="text-indigo-400 font-medium">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-[#1a1f26] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Classroom & Actions Sidebar */}
        <div className="space-y-6">
          {/* Live Session Card */}
          <div className="bg-[#13161c] border border-red-500/30 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                Próxima Clase en Vivo
              </span>
            </div>

            <h4 className="text-sm font-semibold text-white leading-snug">{upcomingLive.title}</h4>
            <p className="text-xs text-gray-400 mt-1">{upcomingLive.instructor}</p>

            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-3">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{upcomingLive.date}</span>
            </div>

            <Link
              href={`/live/${upcomingLive.room}`}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Entrar al Aula Virtual</span>
            </Link>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#13161c] border border-[#232a35] rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider font-mono">
              Accesos Rápidos
            </h4>
            <div className="space-y-2">
              <Link
                href="/files"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1f26] hover:bg-[#202732] text-xs text-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Subir Entrega de Proyecto</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </Link>

              <Link
                href="/courses/demo-course/lessons/1"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1f26] hover:bg-[#202732] text-xs text-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PlayCircle className="w-4 h-4 text-indigo-400" />
                  <span>Reproductor de Videos</span>
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
