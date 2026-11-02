'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FolderSync,
  Video,
  ShieldCheck,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  userRole?: 'student' | 'instructor' | 'admin';
}

export function Sidebar({ userRole = 'student' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard, role: 'student' },
    { name: 'Mis Cursos', href: '/courses/demo-course/lessons/1', icon: BookOpen, role: 'student' },
    { name: 'Aula Virtual en Vivo', href: '/live/room-matematicas-avanzadas', icon: Video, role: 'student' },
    { name: 'Hub de Archivos', href: '/files', icon: FolderSync, role: 'student' },
    { name: 'Panel de Admin', href: '/admin', icon: ShieldCheck, role: 'admin' },
  ];

  return (
    <aside className="w-64 bg-[#0d0f12] border-r border-[#232a35] flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-[#232a35]">
        <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
            AETHER <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">LMS</span>
          </span>
          <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Enterprise Edu</p>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase font-mono">
          Navegación Principal
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/student' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#13161c]'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Bottom Profile / Quick Info */}
      <div className="p-4 border-t border-[#232a35] bg-[#13161c]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
            AR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">Alex Rivera</p>
            <p className="text-xs text-gray-400 truncate capitalize">{userRole}</p>
          </div>
          <button
            title="Configuración"
            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1a1f26] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
