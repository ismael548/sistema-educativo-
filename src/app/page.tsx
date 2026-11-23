"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  KeyRound,
  Lock,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useUserRole } from "@/components/providers/role-provider";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import logoImg from "@/assets/noxius-brand.jpg";

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
    try {
      localStorage.setItem("noxius_student_name", trimmed);
      localStorage.setItem("student_name", trimmed);
      sessionStorage.setItem("noxius_student_name", trimmed);
      sessionStorage.setItem("student_name", trimmed);
    } catch {
      // Ignorar errores de almacenamiento
    }
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
    <div className="min-h-screen bg-[#05070d] text-gray-100 relative overflow-x-hidden flex flex-col">
      {/* Galaxia Espiral Interactiva en Canvas */}
      <AnimatedBackground />

      {/* 1. Navbar Superior Minimalista (Solo Logo + Acceso Docente) */}
      <header className="relative z-10 border-b border-white/10 bg-[#0d111a]/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src={logoImg.src}
              alt="Logo Noxius LM"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-white/15 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-white tracking-tight text-sm sm:text-base whitespace-nowrap">
                <span>Noxius</span>
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-gradient-to-r from-[#4f46e5]/25 to-[#06b6d4]/25 text-cyan-300 border border-indigo-500/30 font-mono">
                  LM
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block truncate">
                Plataforma de Aprendizaje Práctico
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleOpenTeacherModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#0d111a]/80 hover:bg-[#1a1f26] border border-white/10 text-[11px] sm:text-xs font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Acceso Docente</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col justify-center space-y-16">
        {/* 2. Sección Hero Moderna con Entrada Directa Obligatoria por Nombre */}
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#13161c] border border-indigo-500/30 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Acceso Directo • Sin Registros ni Contraseñas</span>
          </div>

          <h1 className="font-sans text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Domina lo que realmente necesitas y descubre lo inimaginable con{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Noxius LM
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Te presentamos a Noxius con un método indistinguible que rompe todo lo que sabes y quieres aprender.
          </p>

          {/* Tarjeta de Ingreso Rápido */}
          <div className="relative z-20 max-w-xl mx-auto space-y-2">
            <form
              onSubmit={handleStudentEnter}
              noValidate
              className="relative z-20 w-full p-2 rounded-2xl bg-[#0d111a]/70 backdrop-blur-md border border-white/10 shadow-surface flex flex-col sm:flex-row gap-2"
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
                className="w-full flex-1 bg-[#0d111a]/80 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] hover:brightness-110 text-white font-semibold text-sm transition-all shrink-0 shadow-glow"
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

        {/* 3. Narrativa Visual de 3 Etapas Evolutivas */}
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
          {/* Tarjeta 1: ANTES */}
          <article className="bg-[#0d111a]/70 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden group hover:border-sky-500/40 transition-all duration-300 flex flex-col">
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src="/era-antes.jpg"
                alt="La Era de la Revolución Industrial"
                className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d111a] via-transparent to-transparent" />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                ANTES
              </span>
            </div>
            <div className="p-6 pt-3 space-y-2 flex-1">
              <h3 className="text-base font-semibold text-white">
                La Era de la Revolución Industrial
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                El conocimiento se transmitía de forma rígida, estandarizada y mecánica para preparar operarios de procesos repetitivos.
              </p>
            </div>
          </article>

          {/* Tarjeta 2: AHORA */}
          <article className="bg-[#0d111a]/70 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden group hover:border-sky-500/40 transition-all duration-300 flex flex-col">
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src="/era-ahora.jpg"
                alt="La Era de la Inteligencia Artificial"
                className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d111a] via-transparent to-transparent" />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 backdrop-blur-md">
                AHORA
              </span>
            </div>
            <div className="p-6 pt-3 space-y-2 flex-1">
              <h3 className="text-base font-semibold text-white">
                La Era de la Inteligencia Artificial
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Hoy tienes acceso inmediato a asistentes y chatbots de IA capaces de responder al instante, pero saber dirigirlos marca la diferencia.
              </p>
            </div>
          </article>

          {/* Tarjeta 3: LUEGO Y PARA SIEMPRE */}
          <article className="bg-[#0d111a]/70 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden group hover:border-sky-500/40 transition-all duration-300 flex flex-col">
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src="/era-siempre.jpg"
                alt="Un Ser en Evolución Continua"
                className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d111a] via-transparent to-transparent" />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-gradient-to-r from-emerald-500/25 to-violet-500/25 text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                LUEGO Y PARA SIEMPRE
              </span>
            </div>
            <div className="p-6 pt-3 space-y-2 flex-1">
              <h3 className="text-base font-semibold text-white">
                Un Ser en Evolución Continua
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Con Noxius LM desarrollas criterio arquitectónico, pensamiento crítico y dominio tecnológico para evolucionar sin límites.
              </p>
            </div>
          </article>
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
  );
}
