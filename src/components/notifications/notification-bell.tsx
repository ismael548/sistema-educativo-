"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/components/providers/role-provider";
import {
  AppNotification,
  LOCAL_NOTIFICATION_EVENT,
  NOTIFICATIONS_CHANNEL,
  formatRelativeTime,
} from "@/lib/notifications";
import { parseMaterialFileType } from "@/utils/materialCategory";

interface LessonRow {
  id: string;
  title: string;
  module_name: string | null;
  created_at: string;
}

interface MaterialRow {
  id: string;
  title: string;
  file_type: string | null;
  lesson_id: string | null;
  created_at: string;
  lessons?: { title?: string } | { title?: string }[] | null;
}

type NotificationTab = "unread" | "read";

function getReadStorageKey(userName: string): string {
  const normalized = (userName || "estudiante")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
  return `readNotificationIds_${normalized || "estudiante"}`;
}

function getLessonRelationTitle(lessons: MaterialRow["lessons"]): string | null {
  if (!lessons) return null;
  if (Array.isArray(lessons)) {
    return lessons[0]?.title || null;
  }
  return lessons.title || null;
}

export function NotificationBell() {
  const router = useRouter();
  const { userName, isHydrated } = useUserRole();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("unread");
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => getReadStorageKey(userName), [userName]);

  // Cargar readNotificationIds por estudiante desde localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setReadNotificationIds(parsed.filter((item): item is string => typeof item === "string"));
          return;
        }
      }
      setReadNotificationIds([]);
    } catch {
      setReadNotificationIds([]);
    }
  }, [storageKey, isHydrated]);

  const persistReadIds = useCallback(
    (nextIds: string[]) => {
      setReadNotificationIds(nextIds);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextIds));
      } catch {
        // Ignorar errores de almacenamiento
      }
    },
    [storageKey]
  );

  const upsertNotification = useCallback((incoming: AppNotification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item.id === incoming.id)) {
        return prev;
      }
      return [incoming, ...prev].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, []);

  // Cargar clases y materiales recientes de Supabase
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const [lessonsRes, materialsRes] = await Promise.allSettled([
        supabase
          .from("lessons")
          .select("id, title, module_name, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("materials")
          .select("id, title, file_type, lesson_id, created_at, lessons(title)")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const items: AppNotification[] = [];

      if (
        lessonsRes.status === "fulfilled" &&
        !lessonsRes.value.error &&
        Array.isArray(lessonsRes.value.data)
      ) {
        for (const row of lessonsRes.value.data as LessonRow[]) {
          items.push({
            id: `clase-${row.id}`,
            tipo: "clase",
            titulo: row.title,
            modulo: row.module_name || "Nueva clase disponible",
            created_at: row.created_at,
            href: `/courses/general/lessons/${row.id}`,
          });
        }
      }

      if (
        materialsRes.status === "fulfilled" &&
        !materialsRes.value.error &&
        Array.isArray(materialsRes.value.data)
      ) {
        for (const row of materialsRes.value.data as unknown as MaterialRow[]) {
          const relatedLesson = getLessonRelationTitle(row.lessons);
          const parsed = parseMaterialFileType(row.file_type);
          items.push({
            id: `archivo-${row.id}`,
            tipo: "archivo",
            titulo: row.title,
            modulo: relatedLesson
              ? `Material (${parsed.category}) en ${relatedLesson}`
              : `${parsed.category} · ${parsed.fileType} en Hub`,
            created_at: row.created_at,
            href: "/files",
          });
        }
      }

      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Suscripción en tiempo real (Supabase Realtime + evento local inmediato)
  useEffect(() => {
    const handleLocalEvent = (event: Event) => {
      const custom = event as CustomEvent<AppNotification>;
      if (custom.detail?.id) {
        upsertNotification(custom.detail);
      }
    };

    window.addEventListener(LOCAL_NOTIFICATION_EVENT, handleLocalEvent);

    let channelCleanup: (() => void) | undefined;
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(NOTIFICATIONS_CHANNEL)
        .on("broadcast", { event: "new_notification" }, ({ payload }) => {
          const incoming = payload as AppNotification | undefined;
          if (incoming?.id) {
            upsertNotification(incoming);
          }
        })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "lessons" },
          (payload) => {
            const row = payload.new as LessonRow | undefined;
            if (!row?.id) return;
            upsertNotification({
              id: `clase-${row.id}`,
              tipo: "clase",
              titulo: row.title || "Nueva clase",
              modulo: row.module_name || "Nueva clase disponible",
              created_at: row.created_at || new Date().toISOString(),
              href: `/courses/general/lessons/${row.id}`,
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "materials" },
          (payload) => {
            const row = payload.new as MaterialRow | undefined;
            if (!row?.id) return;
            const parsed = parseMaterialFileType(row.file_type);
            upsertNotification({
              id: `archivo-${row.id}`,
              tipo: "archivo",
              titulo: row.title || "Nuevo material",
              modulo: `${parsed.category} · ${parsed.fileType} en Hub`,
              created_at: row.created_at || new Date().toISOString(),
              href: "/files",
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "lessons" },
          (payload) => {
            const oldRow = payload.old as { id?: string } | undefined;
            if (!oldRow?.id) return;
            setNotifications((prev) => prev.filter((n) => n.id !== `clase-${oldRow.id}`));
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "materials" },
          (payload) => {
            const oldRow = payload.old as { id?: string } | undefined;
            if (!oldRow?.id) return;
            setNotifications((prev) => prev.filter((n) => n.id !== `archivo-${oldRow.id}`));
          }
        );

      channel.subscribe();
      channelCleanup = () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Fallback seguro si no hay conexión Realtime
    }

    return () => {
      window.removeEventListener(LOCAL_NOTIFICATION_EVENT, handleLocalEvent);
      channelCleanup?.();
    };
  }, [upsertNotification]);

  // Cerrar popover al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const readSet = useMemo(() => new Set(readNotificationIds), [readNotificationIds]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !readSet.has(item.id)),
    [notifications, readSet]
  );

  const readNotifications = useMemo(
    () => notifications.filter((item) => readSet.has(item.id)),
    [notifications, readSet]
  );

  const unreadCount = unreadNotifications.length;
  const readCount = readNotifications.length;

  const markAsRead = useCallback(
    (id: string) => {
      if (readSet.has(id)) return;
      persistReadIds([...readNotificationIds, id]);
    },
    [persistReadIds, readNotificationIds, readSet]
  );

  const markAllAsRead = useCallback(() => {
    if (notifications.length === 0) return;
    const allIds = Array.from(new Set([...readNotificationIds, ...notifications.map((n) => n.id)]));
    persistReadIds(allIds);
  }, [notifications, persistReadIds, readNotificationIds]);

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    router.push(item.href);
  };

  const visibleList = activeTab === "unread" ? unreadNotifications : readNotifications;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        aria-label={`Notificaciones (${unreadCount} sin leer)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.65)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-[#0a0f1d]/95 backdrop-blur-xl border border-indigo-400/25 shadow-2xl w-80 sm:w-96 rounded-xl z-50 overflow-hidden">
          {/* Encabezado */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como leídas
            </button>
          </div>

          {/* Pestañas: No leídas / Leídas */}
          <div className="grid grid-cols-2 border-b border-white/10 bg-white/[0.02] p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "unread"
                  ? "bg-indigo-500/25 text-white border border-indigo-400/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              No leídas ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("read")}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "read"
                  ? "bg-indigo-500/25 text-white border border-indigo-400/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Leídas ({readCount})
            </button>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-gray-400">
                Cargando notificaciones...
              </div>
            ) : visibleList.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs font-medium text-gray-300">
                  {activeTab === "unread"
                    ? "No tienes notificaciones pendientes"
                    : "Aún no hay notificaciones leídas"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {activeTab === "unread"
                    ? "Cuando el docente publique una clase o archivo aparecerá aquí al instante."
                    : "Las alertas que revises se guardarán en esta sección."}
                </p>
              </div>
            ) : (
              visibleList.map((item) => {
                const isFile = item.tipo === "archivo";
                const isUnread = !readSet.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNotificationClick(item);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      isUnread
                        ? "bg-indigo-500/[0.07] hover:bg-indigo-500/15"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div
                      className={`mt-0.5 p-2 rounded-lg shrink-0 border ${
                        isFile
                          ? "bg-cyan-500/15 border-cyan-400/25 text-cyan-300"
                          : "bg-indigo-500/15 border-indigo-400/25 text-indigo-300"
                      }`}
                    >
                      {isFile ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                          {isFile ? "Nuevo Archivo" : "Nueva Clase"}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        {item.titulo}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {item.modulo}
                      </p>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        title="Marcar como leída"
                        aria-label="Marcar como leída"
                        className="mt-1 p-1.5 rounded-md text-gray-400 hover:text-cyan-300 hover:bg-white/10 transition-colors shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
