"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MonitorUp,
  MonitorOff,
  Mic,
  MicOff,
  Radio,
  Users,
  MessageSquare,
  AlertCircle,
  Tv,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  X,
  Shuffle,
  Code2,
  Copy,
  Check,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LessonChat } from "@/components/chat/lesson-chat";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface VirtualClassroomProps {
  roomName: string;
  courseTitle: string;
  user: {
    name: string;
    email: string;
    role: "student" | "instructor" | "admin";
  };
}

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function VirtualClassroom({
  roomName,
  courseTitle,
  user,
}: VirtualClassroomProps) {
  const [showSideChat, setShowSideChat] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState(1);
  const [connectedUsers, setConnectedUsers] = useState<
    { peerId: string; userName: string; role: string }[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Herramientas pedagógicas anti-ilusión (Ruleta + Código Auditable)
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [codeChallenge, setCodeChallenge] = useState<{
    title: string;
    code: string;
    updatedAt: string;
  } | null>(null);
  const [challengeTitleDraft, setChallengeTitleDraft] = useState("Auditoría de Código en Vivo");
  const [challengeCodeDraft, setChallengeCodeDraft] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // Estado de Zoom, Pan y Pantalla Completa
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const peerIdRef = useRef<string>("");
  const localStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const isBroadcastingRef = useRef(false);
  const hasRemoteStreamRef = useRef(false);

  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);

  useEffect(() => {
    hasRemoteStreamRef.current = hasRemoteStream;
  }, [hasRemoteStream]);

  // Sincronizar estado de Fullscreen nativo (PC / Android)
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsNativeFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const clampZoom = (val: number) =>
    Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(val * 100) / 100));

  const updateZoom = useCallback((nextZoom: number) => {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
    if (clamped <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Pantalla Completa Universal (PC, Android e iOS con fallback CSS)
  const toggleFullscreen = useCallback(async () => {
    if (isCssFullscreen) {
      setIsCssFullscreen(false);
      return;
    }

    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };

    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } catch {
        setIsCssFullscreen(false);
      }
      return;
    }

    const container = videoContainerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;

    if (!container) return;

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        await container.webkitRequestFullscreen();
      } else {
        setIsCssFullscreen(true);
      }
    } catch {
      // Fallback automático para iOS Safari u otros navegadores móviles restrictivos
      setIsCssFullscreen(true);
    }
  }, [isCssFullscreen]);

  // Handlers de Zoom & Pan en PC
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isBroadcasting && !hasRemoteStream) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    updateZoom(zoom + delta);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Handlers táctiles para móvil (pinch-to-zoom y pan con 1 dedo)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isBroadcasting && !hasRemoteStream) return;

    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistanceRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoom;
      setIsDragging(false);
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isBroadcasting && !hasRemoteStream) return;

    if (e.touches.length === 2 && pinchDistanceRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const scaleFactor = currentDist / pinchDistanceRef.current;
      updateZoom(pinchStartZoomRef.current * scaleFactor);
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    pinchDistanceRef.current = null;
    setIsDragging(false);
  };

  // Cierra todas las conexiones WebRTC activas
  const closeAllPeerConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {
        // Ignorar errores al cerrar
      }
    });
    peerConnectionsRef.current.clear();
  }, []);

  // Crea una conexión RTCPeerConnection desde el profesor hacia un alumno específico
  const createBroadcasterPeerConnection = useCallback(async (studentId: string) => {
    const stream = localStreamRef.current;
    const channel = channelRef.current;
    if (!stream || !channel) return;

    const existing = peerConnectionsRef.current.get(studentId);
    if (existing) {
      existing.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    peerConnectionsRef.current.set(studentId, pc);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "webrtc-ice",
          payload: {
            targetId: studentId,
            senderId: peerIdRef.current,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        peerConnectionsRef.current.delete(studentId);
      }
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await channel.send({
        type: "broadcast",
        event: "webrtc-offer",
        payload: {
          targetId: studentId,
          broadcasterId: peerIdRef.current,
          sdp: pc.localDescription,
        },
      });
    } catch (err) {
      console.error("Error creando oferta WebRTC:", err);
    }
  }, []);

  // Detiene la transmisión del profesor
  const stopBroadcast = useCallback(async () => {
    isBroadcastingRef.current = false;
    setIsBroadcasting(false);
    setIsMicMuted(false);
    resetZoom();

    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    displayStreamRef.current = null;
    micStreamRef.current = null;
    localStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    closeAllPeerConnections();

    if (channelRef.current) {
      await channelRef.current.track({
        peerId: peerIdRef.current,
        userName: user.name,
        role: user.role,
        isPresenting: false,
      });

      await channelRef.current.send({
        type: "broadcast",
        event: "broadcaster-stopped",
        payload: { broadcasterId: peerIdRef.current },
      });
    }
  }, [closeAllPeerConnections, resetZoom, user.name, user.role]);

  // Inicia la captura de pantalla + audio y comienza a transmitir
  const startBroadcast = async () => {
    setErrorMsg(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setErrorMsg("Tu navegador no soporta captura de pantalla WebRTC.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      displayStreamRef.current = displayStream;

      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = micStream;
      } catch (micErr) {
        console.warn("No se pudo acceder al micrófono, transmitiendo solo pantalla:", micErr);
      }

      const combinedStream = new MediaStream();
      displayStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      displayStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      if (micStream) {
        micStream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      }

      const mainVideoTrack = displayStream.getVideoTracks()[0];
      if (mainVideoTrack) {
        mainVideoTrack.onended = () => {
          void stopBroadcast();
        };
      }

      localStreamRef.current = combinedStream;
      isBroadcastingRef.current = true;
      setIsBroadcasting(true);
      setHasRemoteStream(false);
      resetZoom();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = combinedStream;
        localVideoRef.current.play().catch(() => {});
      }

      const channel = channelRef.current;
      if (channel) {
        // Marcar isPresenting: true en Presence
        await channel.track({
          peerId: peerIdRef.current,
          userName: user.name,
          role: user.role,
          isPresenting: true,
        });

        // Emitir evento inmediato teacher-started
        await channel.send({
          type: "broadcast",
          event: "teacher-started",
          payload: { broadcasterId: peerIdRef.current },
        });

        const presenceState = channel.presenceState<{ peerId?: string }>();
        const viewerIds = new Set<string>();

        Object.values(presenceState).forEach((entries) => {
          entries.forEach((entry) => {
            if (entry.peerId && entry.peerId !== peerIdRef.current) {
              viewerIds.add(entry.peerId);
            }
          });
        });

        for (const viewerId of Array.from(viewerIds)) {
          await createBroadcasterPeerConnection(viewerId);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Permiso denegado para compartir pantalla.";
      setErrorMsg(`No se pudo iniciar la transmisión: ${message}`);
    }
  };

  // Silenciar / activar únicamente el micrófono del docente
  const toggleMic = () => {
    if (!micStreamRef.current) return;
    const nextMuted = !isMicMuted;
    micStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMicMuted(nextMuted);
  };

  useEffect(() => {
    if (isBroadcasting && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isBroadcasting]);

  // Reintento automático cada 3 segundos mientras el estudiante espera el stream
  useEffect(() => {
    if (isBroadcasting || hasRemoteStream) return;

    const interval = setInterval(() => {
      const channel = channelRef.current;
      if (channel && peerIdRef.current) {
        void channel.send({
          type: "broadcast",
          event: "student-ready",
          payload: { studentId: peerIdRef.current },
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isBroadcasting, hasRemoteStream]);

  // Configurar canal Realtime 'noxius-live-room' y señalización WebRTC
  useEffect(() => {
    const supabase = createClient();
    const myPeerId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `peer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    peerIdRef.current = myPeerId;

    const channel = supabase.channel("noxius-live-room", {
      config: {
        presence: { key: myPeerId },
      },
    });
    channelRef.current = channel;

    const requestOfferFromTeacher = async () => {
      if (isBroadcastingRef.current) return;

      const existing = peerConnectionsRef.current.get("broadcaster");
      if (existing) {
        try {
          existing.close();
        } catch {
          // Ignorar
        }
        peerConnectionsRef.current.delete("broadcaster");
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      hasRemoteStreamRef.current = false;
      setHasRemoteStream(false);

      await channel.send({
        type: "broadcast",
        event: "student-ready",
        payload: { studentId: peerIdRef.current },
      });
    };

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{
        peerId?: string;
        userName?: string;
        role?: string;
        isPresenting?: boolean;
      }>();
      const count = Object.keys(state).length;
      setConnectedPeers(Math.max(1, count));

      const usersList: { peerId: string; userName: string; role: string }[] = [];
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.peerId) {
            usersList.push({
              peerId: entry.peerId,
              userName: entry.userName || "Estudiante",
              role: entry.role || "student",
            });
          }
        });
      });
      setConnectedUsers(usersList);

      // Si algún otro usuario tiene isPresenting === true y el estudiante aún no recibe stream, solicitar oferta
      if (!isBroadcastingRef.current && !hasRemoteStreamRef.current) {
        const someonePresenting = Object.values(state).some((entries) =>
          entries.some(
            (entry) => entry.isPresenting === true && entry.peerId !== peerIdRef.current
          )
        );
        if (someonePresenting) {
          void requestOfferFromTeacher();
        }
      }
    });

    channel.on("broadcast", { event: "oral-defense-pick" }, ({ payload }) => {
      if (payload?.studentName) {
        setSelectedStudent(payload.studentName as string);
      }
    });

    channel.on("broadcast", { event: "code-challenge" }, ({ payload }) => {
      if (payload && typeof payload.code === "string") {
        setCodeChallenge({
          title: (payload.title as string) || "Auditoría de Código en Vivo",
          code: payload.code as string,
          updatedAt: (payload.updatedAt as string) || new Date().toISOString(),
        });
      }
    });

    channel.on("broadcast", { event: "student-ready" }, async ({ payload }) => {
      const studentId = payload?.studentId as string | undefined;
      if (!studentId || studentId === peerIdRef.current) return;
      if (isBroadcastingRef.current && localStreamRef.current) {
        await createBroadcasterPeerConnection(studentId);
      }
    });

    channel.on("broadcast", { event: "teacher-started" }, async ({ payload }) => {
      const broadcasterId = payload?.broadcasterId as string | undefined;
      if (!broadcasterId || broadcasterId === peerIdRef.current || isBroadcastingRef.current) {
        return;
      }
      await requestOfferFromTeacher();
    });

    channel.on("broadcast", { event: "broadcaster-stopped" }, ({ payload }) => {
      const broadcasterId = payload?.broadcasterId as string | undefined;
      if (!broadcasterId || broadcasterId === peerIdRef.current) return;

      const pc = peerConnectionsRef.current.get("broadcaster");
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete("broadcaster");
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      hasRemoteStreamRef.current = false;
      setHasRemoteStream(false);
      resetZoom();
    });

    channel.on("broadcast", { event: "webrtc-offer" }, async ({ payload }) => {
      if (payload?.targetId !== peerIdRef.current || isBroadcastingRef.current) return;

      const broadcasterId = payload.broadcasterId as string;
      const existing = peerConnectionsRef.current.get("broadcaster");
      if (existing) {
        existing.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIGURATION);
      peerConnectionsRef.current.set("broadcaster", pc);

      const remoteStream = new MediaStream();

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          if (event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          } else {
            remoteStream.addTrack(event.track);
            remoteVideoRef.current.srcObject = remoteStream;
          }
          remoteVideoRef.current.play().catch(() => {});
        }
        hasRemoteStreamRef.current = true;
        setHasRemoteStream(true);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "webrtc-ice",
            payload: {
              targetId: broadcasterId,
              senderId: peerIdRef.current,
              candidate: event.candidate.toJSON(),
            },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          hasRemoteStreamRef.current = false;
          setHasRemoteStream(false);
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await channel.send({
          type: "broadcast",
          event: "webrtc-answer",
          payload: {
            targetId: broadcasterId,
            studentId: peerIdRef.current,
            sdp: pc.localDescription,
          },
        });
      } catch (err) {
        console.error("Error procesando oferta WebRTC:", err);
      }
    });

    channel.on("broadcast", { event: "webrtc-answer" }, async ({ payload }) => {
      if (payload?.targetId !== peerIdRef.current || !isBroadcastingRef.current) return;
      const pc = peerConnectionsRef.current.get(payload.studentId as string);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } catch (err) {
        console.error("Error aplicando respuesta WebRTC:", err);
      }
    });

    channel.on("broadcast", { event: "webrtc-ice" }, async ({ payload }) => {
      if (payload?.targetId !== peerIdRef.current || !payload?.candidate) return;

      const pcKey = isBroadcastingRef.current ? (payload.senderId as string) : "broadcaster";
      const pc = peerConnectionsRef.current.get(pcKey);
      if (!pc) return;

      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error("Error agregando candidato ICE:", err);
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          peerId: myPeerId,
          userName: user.name,
          role: user.role,
          isPresenting: isBroadcastingRef.current,
        });

        await channel.send({
          type: "broadcast",
          event: "student-ready",
          payload: { studentId: myPeerId },
        });
      }
    });

    return () => {
      displayStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      closeAllPeerConnections();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [closeAllPeerConnections, createBroadcasterPeerConnection, resetZoom, user.name, user.role]);

  const hasActiveStream = isBroadcasting || hasRemoteStream;
  const isFullscreenActive = isNativeFullscreen || isCssFullscreen;
  const isTeacher = user.role === "instructor" || isBroadcasting;

  // Ruleta / Selector aleatorio de defensa oral
  const handlePickRandomStudent = () => {
    const candidates = connectedUsers.filter((u) => u.peerId !== peerIdRef.current);
    const pool = candidates.length > 0 ? candidates : connectedUsers;
    if (pool.length === 0 || isSpinning) return;

    setIsSpinning(true);
    let ticks = 0;
    const spinInterval = window.setInterval(() => {
      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setSelectedStudent(randomCandidate.userName);
      ticks += 1;
      if (ticks >= 10) {
        window.clearInterval(spinInterval);
        const finalPick = pool[Math.floor(Math.random() * pool.length)].userName;
        setSelectedStudent(finalPick);
        setIsSpinning(false);
        if (channelRef.current) {
          void channelRef.current.send({
            type: "broadcast",
            event: "oral-defense-pick",
            payload: { studentName: finalPick },
          });
        }
      }
    }, 80);
  };

  // Publicar bloque de reto / código auditable en tiempo real
  const handlePublishChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeCodeDraft.trim()) return;

    const payload = {
      title: challengeTitleDraft.trim() || "Auditoría de Código en Vivo",
      code: challengeCodeDraft,
      updatedAt: new Date().toISOString(),
    };
    setCodeChallenge(payload);
    setShowCodeEditor(false);

    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "code-challenge",
        payload,
      });
    }
  };

  const handleCopyChallenge = async () => {
    if (!codeChallenge?.code) return;
    try {
      await navigator.clipboard.writeText(codeChallenge.code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignorar si clipboard no está disponible
    }
  };

  return (
    <div
      className={
        isExpanded
          ? "fixed inset-0 z-40 flex flex-col bg-[#05070d] overflow-hidden"
          : "flex flex-col min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-[#05070d]"
      }
    >
      {/* Class Header */}
      <div className="min-h-14 py-2.5 px-3 sm:px-6 border-b border-white/10 bg-[#0d111a]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {hasActiveStream ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[10px] font-mono font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>En vivo ahora</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span>Sala en espera</span>
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
              {courseTitle}
            </h2>
            <p className="text-[11px] text-gray-400 truncate hidden sm:block">
              Sala: {roomName} • Transmisión nativa WebRTC sin límite de tiempo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1f26] border border-white/10 rounded-lg text-xs text-gray-300 font-mono">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{connectedPeers} en sala</span>
          </div>

          {isTeacher && (
            <button
              type="button"
              onClick={handlePickRandomStudent}
              disabled={isSpinning || connectedUsers.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-amber-300 text-xs font-medium transition-colors disabled:opacity-50"
              title="Seleccionar un estudiante al azar para defensa oral"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
              <span>{isSpinning ? "Eligiendo..." : "Elegir alumno al azar"}</span>
            </button>
          )}

          {isTeacher && (
            <button
              type="button"
              onClick={() => setShowCodeEditor((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showCodeEditor
                  ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                  : "bg-[#1a1f26] border-white/10 text-gray-300 hover:text-white"
              }`}
              title="Publicar reto o fragmento de código auditable"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Publicar Código</span>
            </button>
          )}

          {isBroadcasting ? (
            <>
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isMicMuted
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                }`}
                title={isMicMuted ? "Activar micrófono" : "Silenciar micrófono"}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMicMuted ? "Mic Off" : "Mic On"}</span>
              </button>

              <button
                type="button"
                onClick={() => void stopBroadcast()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
              >
                <MonitorOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detener Transmisión</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void startBroadcast()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <MonitorUp className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Compartir Pantalla y Audio (Iniciar Clase)</span>
              <span className="xl:hidden">Iniciar Clase</span>
            </button>
          )}

          {/* Expandir Video (oculta chat y barra lateral para usar 100% del ancho) */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isExpanded
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : "bg-[#1a1f26] border-[#232a35] text-gray-300 hover:text-white"
            }`}
            title={isExpanded ? "Restaurar vista normal" : "Expandir video al 100% de la pantalla"}
          >
            {isExpanded ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            <span>{isExpanded ? "Contraer" : "Expandir Video"}</span>
          </button>

          {!isExpanded && (
            <button
              type="button"
              onClick={() => setShowSideChat((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showSideChat
                  ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                  : "bg-[#1a1f26] border-[#232a35] text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showSideChat ? "Ocultar Chat" : "Mostrar Chat"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error banner si falla captura de pantalla */}
      {errorMsg && (
        <div className="mx-3 mt-3 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Video Stage + Pedagogical Tools & Side Chat Panel */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden p-3 gap-3">
        {/* Columna principal: Defensa Oral + Video WebRTC + Reto de Código */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 lg:overflow-y-auto">
          {/* Banner de Defensa Oral / Ruleta */}
          {selectedStudent && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/35 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-amber-200 min-w-0">
                <Shuffle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  Defensa Oral / Auditoría seleccionada:{" "}
                  <strong className="text-white">{selectedStudent}</strong>
                </span>
              </div>
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-amber-300 hover:text-white p-1 rounded"
                  aria-label="Cerrar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Escenario principal de Video WebRTC con Pan & Zoom + Fullscreen */}
          <div
            ref={videoContainerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`${
              isCssFullscreen
                ? "fixed inset-0 z-50 bg-black"
                : "flex-1 min-h-[240px] sm:min-h-[340px] bg-[#0d111a]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-surface"
            } overflow-hidden relative flex items-center justify-center select-none touch-none ${
              zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
            }`}
          >
            {/* Botón flotante para salir de Pantalla Completa CSS (ideal para iOS/iPhone) */}
            {isCssFullscreen && (
              <button
                type="button"
                onClick={() => setIsCssFullscreen(false)}
                className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/75 hover:bg-black/90 border border-white/20 text-white text-xs font-medium backdrop-blur-md shadow-lg transition-colors"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Salir de Pantalla Completa</span>
              </button>
            )}

            {/* Contenedor transformable para Zoom y Desplazamiento */}
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 120ms ease-out",
              }}
              className={`w-full h-full flex items-center justify-center ${
                hasActiveStream ? "block" : "hidden"
              }`}
            >
              {/* Vista previa local del profesor */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full aspect-video max-h-[75vh] object-contain bg-black ${
                  isBroadcasting ? "block" : "hidden"
                }`}
              />

              {/* Stream remoto recibido por el alumno */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                controls
                className={`w-full aspect-video max-h-[75vh] object-contain bg-black ${
                  !isBroadcasting && hasRemoteStream ? "block" : "hidden"
                }`}
              />
            </div>

            {/* Barra flotante de controles de Zoom y Pantalla Completa */}
            {hasActiveStream && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="absolute bottom-4 right-4 z-20 flex items-center gap-1 p-1.5 rounded-xl bg-black/70 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => updateZoom(zoom - ZOOM_STEP)}
                  disabled={zoom <= MIN_ZOOM}
                  className="p-2 rounded-lg text-gray-200 hover:bg-white/10 disabled:opacity-35 transition-colors"
                  title="Alejar (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={resetZoom}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-gray-200 hover:bg-white/10 transition-colors min-w-[52px]"
                  title="Restablecer zoom al 100%"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => updateZoom(zoom + ZOOM_STEP)}
                  disabled={zoom >= MAX_ZOOM}
                  className="p-2 rounded-lg text-gray-200 hover:bg-white/10 disabled:opacity-35 transition-colors"
                  title="Acercar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-white/15 mx-0.5" />

                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors"
                  title={isFullscreenActive ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                >
                  {isFullscreenActive ? (
                    <Minimize className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Maximize className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="hidden sm:inline">
                    {isFullscreenActive ? "Salir" : "Pantalla Completa"}
                  </span>
                </button>
              </div>
            )}

            {/* Pantalla de espera cuando no hay transmisión activa */}
            {!isBroadcasting && !hasRemoteStream && (
              <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 max-w-md space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Tv className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1a1f26] border border-white/10 text-[11px] font-mono text-gray-400">
                    <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                    <span>Canal WebRTC Activo</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    Esperando que el docente inicie la transmisión...
                  </h3>
                  <p className="text-xs text-gray-400">
                    En cuanto el profesor comparta su pantalla y audio, la clase aparecerá aquí automáticamente en tiempo real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void startBroadcast()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-glow"
                >
                  <MonitorUp className="w-4 h-4" />
                  <span>Compartir Pantalla y Audio (Iniciar Clase)</span>
                </button>
              </div>
            )}
          </div>

          {/* Editor docente de Reto / Código Auditable en Tiempo Real */}
          {isTeacher && showCodeEditor && !isExpanded && (
            <form
              onSubmit={(e) => void handlePublishChallenge(e)}
              className="p-4 rounded-xl bg-[#0d111a]/80 backdrop-blur-md border border-cyan-500/30 space-y-3 shrink-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4" />
                  <span>Publicar Fragmento / Reto Auditable en Vivo</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCodeEditor(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={challengeTitleDraft}
                onChange={(e) => setChallengeTitleDraft(e.target.value)}
                placeholder="Título del reto (ej. Encuentra el bug de concurrencia)"
                className="w-full bg-[#05070d] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />

              <textarea
                rows={4}
                required
                value={challengeCodeDraft}
                onChange={(e) => setChallengeCodeDraft(e.target.value)}
                placeholder="Pega aquí el fragmento de código para que los alumnos lo auditen en vivo..."
                className="w-full bg-[#05070d] border border-white/10 rounded-lg p-3 text-xs font-mono text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar a toda la sala</span>
                </button>
              </div>
            </form>
          )}

          {/* Bloque visible de Código Auditable en Tiempo Real */}
          {codeChallenge && !isExpanded && (
            <div className="rounded-xl bg-[#0d111a]/80 backdrop-blur-md border border-white/10 overflow-hidden shrink-0">
              <div className="px-4 py-2.5 border-b border-white/10 bg-[#121722] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-semibold text-white truncate">
                    {codeChallenge.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopyChallenge()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-gray-200 transition-colors shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copiar código</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 text-xs font-mono text-cyan-100 bg-[#05070d]/90 overflow-x-auto leading-relaxed">
                <code>{codeChallenge.code}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Panel derecho del Chat en Vivo intacto (lesson_id: null) */}
        {showSideChat && !isExpanded && (
          <div className="w-full lg:w-80 xl:w-96 flex flex-col h-[400px] lg:h-full shrink-0">
            <LessonChat
              lessonId={null}
              currentUser={{
                name: user.name,
                email: user.email,
                role: user.role,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
