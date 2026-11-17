"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LessonMessage } from "@/lib/supabase/types";
import { useUserRole } from "@/components/providers/role-provider";

interface LessonChatProps {
  lessonId?: string | null;
  currentUser?: {
    id?: string;
    name: string;
    email?: string;
    role?: "student" | "instructor" | "admin";
    avatarUrl?: string;
  };
}

export function LessonChat({
  lessonId = null,
  currentUser,
}: LessonChatProps) {
  const { userName: contextUserName } = useUserRole();
  const [messages, setMessages] = useState<LessonMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userName, setUserName] = useState(currentUser?.name || contextUserName);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?.name) {
      setUserName(contextUserName);
    }
  }, [contextUserName, currentUser?.name]);

  const userEmail = currentUser?.email || "estudiante@noxiuslm.edu";
  const normalizedLessonId = lessonId && lessonId.trim() ? lessonId.trim() : null;

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    const fetchMessages = async () => {
      try {
        let query = supabase
          .from("lesson_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(100);

        if (normalizedLessonId) {
          query = query.eq("lesson_id", normalizedLessonId);
        } else {
          query = query.is("lesson_id", null);
        }

        const { data, error } = await query;

        if (!isMounted) return;

        if (error) {
          console.error("Error cargando mensajes:", error.message);
          setErrorMsg("No se pudo cargar el historial del chat.");
          setMessages([]);
        } else {
          setMessages((data as LessonMessage[]) || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error inesperado en chat:", err);
          setErrorMsg("Error de conexión con Supabase.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMessages();

    const channelName = normalizedLessonId
      ? `lesson-messages:${normalizedLessonId}`
      : "lesson-messages:live-general";

    const pgFilterConfig = normalizedLessonId
      ? {
          event: "INSERT" as const,
          schema: "public",
          table: "lesson_messages",
          filter: `lesson_id=eq.${normalizedLessonId}`,
        }
      : {
          event: "INSERT" as const,
          schema: "public",
          table: "lesson_messages",
        };

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", pgFilterConfig, (payload) => {
        const incoming = payload.new as LessonMessage;
        if (!normalizedLessonId && incoming.lesson_id !== null) {
          return;
        }
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [normalizedLessonId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = inputText.trim();
    if (!trimmedContent || isSubmitting) return;

    const supabase = createClient();
    const displayName = userName.trim() || "Estudiante";
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from("lesson_messages")
        .insert({
          lesson_id: normalizedLessonId,
          user_email: userEmail,
          user_name: displayName,
          content: trimmedContent,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Error enviando mensaje:", error.message);
        setErrorMsg("No se pudo enviar el mensaje. Verifica tu conexión o permisos.");
      } else if (data) {
        const inserted = data as LessonMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) return prev;
          return [...prev, inserted];
        });
        setInputText("");
      }
    } catch (err) {
      console.error("Error inesperado al enviar mensaje:", err);
      setErrorMsg("Error al enviar el mensaje.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-[#232a35] px-4 flex items-center justify-between bg-[#171b22] shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white tracking-wide">Chat de la Clase</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-gray-400">En Vivo</span>
        </div>
      </div>

      {/* Nombre rápido del participante */}
      <div className="px-3 py-2 border-b border-[#232a35] bg-[#13161c] flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-gray-500 font-mono shrink-0">Tu nombre:</span>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          maxLength={60}
          placeholder="Tu nombre"
          className="flex-1 bg-[#1a1f26] border border-[#232a35] rounded px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 p-4 space-y-3.5 overflow-y-auto min-h-[240px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Cargando mensajes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center">
            <MessageSquare className="w-8 h-8 stroke-1 mb-2 text-gray-600" />
            <p>Aún no hay mensajes en esta clase.</p>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Escribe tu duda o comentario para iniciar la conversación.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine =
              msg.user_email === userEmail && msg.user_name === (userName.trim() || "Estudiante");

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 px-1">
                  <span className="font-medium text-gray-300">{msg.user_name}</span>
                  <span className="text-gray-600 font-mono text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed break-words ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                      : "bg-[#1a1f26] border border-[#232a35] text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="px-3 py-1.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#232a35] bg-[#171b22] shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            maxLength={1000}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje para la clase..."
            className="w-full bg-[#13161c] border border-[#232a35] rounded-lg pl-3 pr-10 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="absolute right-1.5 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors"
            title="Enviar mensaje"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
