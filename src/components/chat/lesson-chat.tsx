'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from '@/lib/supabase/types';

interface LessonChatProps {
  lessonId: string;
  currentUser?: {
    id: string;
    name: string;
    role: 'student' | 'instructor' | 'admin';
    avatarUrl?: string;
  };
}

export function LessonChat({
  lessonId,
  currentUser = { id: 'mock-user-1', name: 'Alex Rivera', role: 'student' },
}: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages and subscribe to Supabase Realtime
  useEffect(() => {
    let isMounted = true;

    // Initial mock / fetch
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, profile:profiles(full_name, avatar_url, role)')
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: true })
          .limit(50);

        if (!error && data && isMounted) {
          setMessages(data as any);
        } else if (isMounted) {
          // Fallback initial sample conversation
          setMessages([
            {
              id: 'init-1',
              lesson_id: lessonId,
              user_id: 'inst-1',
              content: '¡Bienvenidos a la sesión! Dejen aquí sus preguntas sobre la arquitectura.',
              is_instructor_reply: true,
              created_at: new Date(Date.now() - 3600000).toISOString(),
              profile: {
                full_name: 'Dra. Elena Ramos',
                role: 'instructor',
                avatar_url: null,
              },
            },
            {
              id: 'init-2',
              lesson_id: lessonId,
              user_id: 'stud-2',
              content: '¿El esquema soporta índices compuestos para acelerar las consultas de progreso?',
              is_instructor_reply: false,
              created_at: new Date(Date.now() - 1800000).toISOString(),
              profile: {
                full_name: 'Marcos Soto',
                role: 'student',
                avatar_url: null,
              },
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchMessages();

    // Subscribe to Realtime channel
    const channel = supabase
      .channel(`lesson-chat:${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `lesson_id=eq.${lessonId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicate if optimistic message matches
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [lessonId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    const messageContent = inputText.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic Update
    const optimisticMessage: ChatMessage = {
      id: tempId,
      lesson_id: lessonId,
      user_id: currentUser.id,
      content: messageContent,
      is_instructor_reply: currentUser.role === 'instructor' || currentUser.role === 'admin',
      created_at: new Date().toISOString(),
      profile: {
        full_name: currentUser.name,
        role: currentUser.role,
        avatar_url: currentUser.avatarUrl,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          lesson_id: lessonId,
          user_id: currentUser.id,
          content: messageContent,
          is_instructor_reply: optimisticMessage.is_instructor_reply,
        })
        .select()
        .single();

      if (error) {
        // Fallback: If DB table not ready or disconnected, keep optimistic in demo state
        console.warn('Realtime chat fallback (mock mode active):', error.message);
      } else if (data) {
        // Replace temp ID with actual DB record
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? { ...msg, id: data.id } : msg))
        );
      }
    } catch (err) {
      console.error('Error posting message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-[#232a35] px-4 flex items-center justify-between bg-[#171b22]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white tracking-wide">Foro & Chat de Lección</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-gray-400">En Vivo</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 p-4 space-y-3.5 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
            <MessageSquare className="w-8 h-8 stroke-1 mb-2 text-gray-600" />
            <p>No hay preguntas todavía.</p>
            <p className="text-[11px] text-gray-600">Sé el primero en iniciar la conversación.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.user_id === currentUser.id;
            const isInstructor = msg.is_instructor_reply || msg.profile?.role === 'instructor';

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
              >
                {/* Author Info */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 px-1">
                  <span className="font-medium text-gray-300">
                    {msg.profile?.full_name || (isMine ? 'Tú' : 'Estudiante')}
                  </span>
                  {isInstructor && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono">
                      <Shield className="w-2.5 h-2.5" /> Instructor
                    </span>
                  )}
                  <span className="text-gray-600 font-mono text-[10px]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : isInstructor
                      ? 'bg-[#1b212b] border border-indigo-500/40 text-gray-200 rounded-bl-none'
                      : 'bg-[#1a1f26] border border-[#232a35] text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#232a35] bg-[#171b22]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            maxLength={1000}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Haz una pregunta o responde a un compañero..."
            className="w-full bg-[#13161c] border border-[#232a35] rounded-lg pl-3 pr-10 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="absolute right-1.5 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors"
            title="Enviar mensaje"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
