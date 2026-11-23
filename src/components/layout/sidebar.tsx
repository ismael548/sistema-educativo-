"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderSync,
  Video,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Pencil,
  Check,
  X,
  Lock,
  LogOut,
} from "lucide-react";
import { useUserRole } from "@/components/providers/role-provider";
import logoImg from "@/assets/noxius-brand.jpg";

interface SidebarProps {
  userRole?: "student" | "instructor" | "admin";
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, userName, setUserName, verifyTeacherPin, switchToStudent, logout } =
    useUserRole();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const navigation = [
    { name: "Dashboard", href: "/student", icon: LayoutDashboard, adminOnly: false },
    { name: "Mis Cursos", href: "/courses/general/lessons/1", icon: BookOpen, adminOnly: false },
    {
      name: "Aula Virtual en Vivo",
      href: "/live/room-matematicas-avanzadas",
      icon: Video,
      adminOnly: false,
    },
    { name: "Hub de Archivos", href: "/files", icon: FolderSync, adminOnly: false },
    { name: "Panel de Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
  ];

  const visibleNavigation = navigation.filter((item) => !item.adminOnly || role === "instructor");

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "ES";

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(nameDraft);
    setIsEditingName(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const ok = verifyTeacherPin(pinInput);
    if (ok) {
      setShowPinModal(false);
      setPinInput("");
    } else {
      setPinError("PIN incorrecto. Verifica e intenta nuevamente.");
    }
  };

  const handleLogout = () => {
    logout();
    onClose?.();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Backdrop oscuro para móvil */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#060913]/80 backdrop-blur-xl border-r border-indigo-400/15 flex flex-col h-screen select-none shrink-0 transform transition-transform duration-200 ease-out md:relative md:z-10 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={logoImg.src}
              alt="Logo Noxius LM"
              className="w-11 h-11 rounded-full object-cover border border-white/15 shrink-0"
            />
            <div>
              <span className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
                Noxius{" "}
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-indigo-500/30 font-mono">
                  LM
                </span>
              </span>
              <p className="text-[10px] text-gray-400 tracking-wide">
                Plataforma Educativa
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#13161c]"
              aria-label="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase font-mono">
            Navegación Principal
          </div>
          {visibleNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/student" && pathname.startsWith(item.href.split("/lessons")[0]));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-r-lg text-sm font-medium transition-all ${
                  isActive
                    ? "border-l-2 border-cyan-400 bg-gradient-to-r from-cyan-500/15 to-transparent text-white"
                    : "border-l-2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Bottom Profile & Role Switcher */}
        <div className="p-4 border-t border-[#232a35] bg-[#13161c]/70 space-y-3">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={40}
                placeholder="Tu nombre..."
                autoFocus
                className="flex-1 min-w-0 bg-[#1a1f26] border border-indigo-500/50 rounded-md px-2 py-1 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                title="Guardar nombre"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(userName);
                  setIsEditingName(false);
                }}
                className="p-1 rounded bg-[#1a1f26] text-gray-400 hover:text-white"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">{userName}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {role === "instructor" ? "Docente / Admin" : "Estudiante"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(userName);
                  setIsEditingName(true);
                }}
                title="Editar tu nombre"
                className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1a1f26] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {role === "student" ? (
            <button
              type="button"
              onClick={() => {
                setPinError(null);
                setPinInput("");
                setShowPinModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#1a1f26] hover:bg-[#232a35] border border-[#232a35] text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Acceso Docente</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={switchToStudent}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Cambiar a Modo Estudiante</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-[#1a1f26]/60 border border-[#232a35] text-xs font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Modal de PIN para Acceso Docente */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#13161c] border border-[#232a35] rounded-2xl p-6 space-y-4 shadow-surface">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Acceso Docente</h3>
                  <p className="text-[11px] text-gray-400">Ingresa el PIN de profesor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN docente (ej. 2026)"
                autoFocus
                className="w-full bg-[#1a1f26] border border-[#232a35] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono tracking-widest"
              />

              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3 py-2 rounded-lg bg-[#1a1f26] hover:bg-[#232a35] text-xs text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                >
                  Activar Modo Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
