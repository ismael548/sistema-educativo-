'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Users,
  Settings,
  MessageSquare,
  Maximize2
} from 'lucide-react';
import { LessonChat } from '@/components/chat/lesson-chat';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface VirtualClassroomProps {
  roomName: string;
  courseTitle: string;
  user: {
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
  };
}

export function VirtualClassroom({
  roomName,
  courseTitle,
  user,
}: VirtualClassroomProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [showSideChat, setShowSideChat] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);

  // Initialize Jitsi when script is ready
  const initJitsi = () => {
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;

    // Clear previous instances
    if (jitsiApi) {
      jitsiApi.dispose();
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: `aether-lms-${roomName}`,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: user.name,
        email: user.email,
      },
      configOverwrite: {
        startWithAudioMuted: user.role === 'student',
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        toolbarButtons: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'recording',
          'raisehand',
          'videoquality',
          'tileview',
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#0d0f12',
        DARK_THEME: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    setJitsiApi(api);

    api.addEventListener('participantJoined', () => {
      setParticipantCount((prev) => prev + 1);
    });

    api.addEventListener('participantLeft', () => {
      setParticipantCount((prev) => Math.max(1, prev - 1));
    });
  };

  useEffect(() => {
    if (isJitsiLoaded) {
      initJitsi();
    }
    return () => {
      if (jitsiApi) {
        jitsiApi.dispose();
      }
    };
  }, [isJitsiLoaded, roomName]);

  return (
    <>
      <Script
        src="https://meet.jit.si/external_api.js"
        onLoad={() => setIsJitsiLoaded(true)}
      />

      <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0d0f12]">
        {/* Class Header */}
        <div className="h-14 px-6 border-b border-[#232a35] bg-[#13161c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-wide">{courseTitle}</h2>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold uppercase">
                  En Vivo
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Sala: {roomName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1a1f26] border border-[#232a35] rounded-lg text-xs text-gray-300 font-mono">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{participantCount} Conectados</span>
            </div>

            <button
              onClick={() => setShowSideChat((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showSideChat
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-[#1a1f26] border-[#232a35] text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showSideChat ? 'Ocultar Chat' : 'Mostrar Chat'}</span>
            </button>
          </div>
        </div>

        {/* Video Stage & Side Panel */}
        <div className="flex-1 flex overflow-hidden p-3 gap-3">
          {/* Main Jitsi Container */}
          <div className="flex-1 bg-[#13161c] border border-[#232a35] rounded-xl overflow-hidden relative shadow-surface">
            {!isJitsiLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0f12] text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-medium text-gray-300">Conectando al servidor de videoconferencia WebRTC...</p>
                <p className="text-xs text-gray-500">Cifrado de extremo a extremo activo</p>
              </div>
            )}
            <div ref={jitsiContainerRef} className="w-full h-full" />
          </div>

          {/* Collapsible Side Chat Panel */}
          {showSideChat && (
            <div className="w-80 lg:w-96 flex flex-col h-full shrink-0">
              <LessonChat
                lessonId={`live-${roomName}`}
                currentUser={{
                  id: 'curr-user-live',
                  name: user.name,
                  role: user.role,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
