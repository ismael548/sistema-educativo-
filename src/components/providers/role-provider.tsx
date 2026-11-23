"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AppRole = "student" | "instructor";

export interface LastWatchedLesson {
  id: string;
  title: string;
}

export const DISCORD_INVITE_URL = "https://discord.gg/noxius-lm";

interface RoleContextValue {
  role: AppRole;
  userName: string;
  discordUrl: string;
  isHydrated: boolean;
  hasActiveSession: boolean;
  lastWatchedLesson: LastWatchedLesson | null;
  visitedLessonIds: string[];
  completedLessonIds: string[];
  setUserName: (name: string) => void;
  setDiscordUrl: (url: string) => void;
  verifyTeacherPin: (pin: string) => boolean;
  switchToStudent: () => void;
  logout: () => void;
  markLessonVisited: (lesson: LastWatchedLesson) => void;
  toggleLessonCompleted: (lessonId: string) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const STORAGE_ROLE_KEY = "aether_user_role";
const STORAGE_NAME_KEY = "noxius_student_name";
const STORAGE_NAME_ALIAS_KEY = "student_name";
const STORAGE_LEGACY_NAME_KEY = "aether_user_name";
const STORAGE_LAST_LESSON_KEY = "aether_last_lesson";
const STORAGE_VISITED_KEY = "aether_visited_lessons";
const STORAGE_COMPLETED_KEY = "aether_completed_lessons";
const STORAGE_DISCORD_KEY = "noxius_discord_url";

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AppRole>("student");
  const [userName, setUserNameState] = useState<string>("Estudiante");
  const [discordUrl, setDiscordUrlState] = useState<string>(DISCORD_INVITE_URL);
  const [hasStoredName, setHasStoredName] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [lastWatchedLesson, setLastWatchedLesson] = useState<LastWatchedLesson | null>(null);
  const [visitedLessonIds, setVisitedLessonIds] = useState<string[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedRole = localStorage.getItem(STORAGE_ROLE_KEY);
        if (savedRole === "instructor" || savedRole === "student") {
          setRole(savedRole);
        }

        const savedName =
          localStorage.getItem(STORAGE_NAME_KEY) ||
          localStorage.getItem(STORAGE_NAME_ALIAS_KEY) ||
          sessionStorage.getItem(STORAGE_NAME_KEY) ||
          sessionStorage.getItem(STORAGE_NAME_ALIAS_KEY) ||
          localStorage.getItem(STORAGE_LEGACY_NAME_KEY);

        if (savedName && savedName.trim()) {
          const clean = savedName.trim();
          setUserNameState(clean);
          setHasStoredName(true);
          // Sincronizar claves unificadas en localStorage y sessionStorage
          localStorage.setItem(STORAGE_NAME_KEY, clean);
          localStorage.setItem(STORAGE_NAME_ALIAS_KEY, clean);
          sessionStorage.setItem(STORAGE_NAME_KEY, clean);
          sessionStorage.setItem(STORAGE_NAME_ALIAS_KEY, clean);
        } else {
          setHasStoredName(false);
        }

        const savedLast = localStorage.getItem(STORAGE_LAST_LESSON_KEY);
        if (savedLast) {
          const parsed = JSON.parse(savedLast) as LastWatchedLesson;
          if (parsed?.id && parsed?.title) {
            setLastWatchedLesson(parsed);
          }
        }

        const savedVisited = localStorage.getItem(STORAGE_VISITED_KEY);
        if (savedVisited) {
          const parsedVisited = JSON.parse(savedVisited) as string[];
          if (Array.isArray(parsedVisited)) {
            setVisitedLessonIds(parsedVisited);
          }
        }

        const savedCompleted = localStorage.getItem(STORAGE_COMPLETED_KEY);
        if (savedCompleted) {
          const parsedCompleted = JSON.parse(savedCompleted) as string[];
          if (Array.isArray(parsedCompleted)) {
            setCompletedLessonIds(parsedCompleted);
          }
        }

        const savedDiscord = localStorage.getItem(STORAGE_DISCORD_KEY);
        if (savedDiscord && savedDiscord.trim()) {
          setDiscordUrlState(savedDiscord.trim());
        }
      } catch {
        // Ignorar errores de almacenamiento en navegación privada
      } finally {
        setIsHydrated(true);
      }
    };

    loadFromStorage();

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STORAGE_COMPLETED_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as string[];
          if (Array.isArray(parsed)) setCompletedLessonIds(parsed);
        } catch {
          // Ignorar
        }
      }
      if ((e.key === STORAGE_NAME_KEY || e.key === STORAGE_NAME_ALIAS_KEY) && e.newValue) {
        setUserNameState(e.newValue.trim() || "Estudiante");
        setHasStoredName(Boolean(e.newValue.trim()));
      }
    };

    window.addEventListener("storage", handleStorageSync);
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  const setUserName = useCallback((name: string) => {
    const clean = name.trim() || "Estudiante";
    setUserNameState(clean);
    setHasStoredName(Boolean(name.trim()));
    try {
      if (name.trim()) {
        localStorage.setItem(STORAGE_NAME_KEY, clean);
        localStorage.setItem(STORAGE_NAME_ALIAS_KEY, clean);
        sessionStorage.setItem(STORAGE_NAME_KEY, clean);
        sessionStorage.setItem(STORAGE_NAME_ALIAS_KEY, clean);
      }
    } catch {
      // Ignorar
    }
  }, []);

  const setDiscordUrl = useCallback((url: string) => {
    const clean = url.trim() || DISCORD_INVITE_URL;
    setDiscordUrlState(clean);
    try {
      localStorage.setItem(STORAGE_DISCORD_KEY, clean);
    } catch {
      // Ignorar
    }
  }, []);

  const verifyTeacherPin = useCallback((pin: string): boolean => {
    const expectedPin = process.env.NEXT_PUBLIC_TEACHER_PIN || "2026";
    if (pin.trim() === expectedPin) {
      setRole("instructor");
      try {
        localStorage.setItem(STORAGE_ROLE_KEY, "instructor");
      } catch {
        // Ignorar
      }
      return true;
    }
    return false;
  }, []);

  const switchToStudent = useCallback(() => {
    setRole("student");
    try {
      localStorage.setItem(STORAGE_ROLE_KEY, "student");
    } catch {
      // Ignorar
    }
  }, []);

  const logout = useCallback(() => {
    setRole("student");
    setUserNameState("Estudiante");
    setHasStoredName(false);
    try {
      localStorage.removeItem(STORAGE_NAME_KEY);
      localStorage.removeItem(STORAGE_NAME_ALIAS_KEY);
      localStorage.removeItem(STORAGE_LEGACY_NAME_KEY);
      localStorage.removeItem(STORAGE_ROLE_KEY);
      sessionStorage.removeItem(STORAGE_NAME_KEY);
      sessionStorage.removeItem(STORAGE_NAME_ALIAS_KEY);
    } catch {
      // Ignorar
    }
  }, []);

  const markLessonVisited = useCallback((lesson: LastWatchedLesson) => {
    setLastWatchedLesson(lesson);
    setVisitedLessonIds((prev) => {
      const updated = prev.includes(lesson.id) ? prev : [...prev, lesson.id];
      try {
        localStorage.setItem(STORAGE_LAST_LESSON_KEY, JSON.stringify(lesson));
        localStorage.setItem(STORAGE_VISITED_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
  }, []);

  const toggleLessonCompleted = useCallback((lessonId: string) => {
    setCompletedLessonIds((prev) => {
      const exists = prev.includes(lessonId);
      const updated = exists ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      try {
        localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("aether-progress-updated", { detail: updated }));
      } catch {
        // Ignorar
      }
      return updated;
    });
  }, []);

  const hasActiveSession = role === "instructor" || hasStoredName;

  return (
    <RoleContext.Provider
      value={{
        role,
        userName,
        discordUrl,
        isHydrated,
        hasActiveSession,
        lastWatchedLesson,
        visitedLessonIds,
        completedLessonIds,
        setUserName,
        setDiscordUrl,
        verifyTeacherPin,
        switchToStudent,
        logout,
        markLessonVisited,
        toggleLessonCompleted,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useUserRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useUserRole debe usarse dentro de RoleProvider");
  }
  return ctx;
}
