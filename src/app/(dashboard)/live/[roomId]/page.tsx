"use client";

import React from "react";
import { VirtualClassroom } from "@/components/live/virtual-classroom";
import { useUserRole } from "@/components/providers/role-provider";

interface LiveRoomPageProps {
  params: {
    roomId: string;
  };
}

export default function LiveRoomPage({ params }: LiveRoomPageProps) {
  const { userName, role } = useUserRole();

  return (
    <div className="-m-4 md:-m-6">
      <VirtualClassroom
        roomName={params.roomId === "room-matematicas-avanzadas" ? "Noxius LM — En Vivo" : params.roomId}
        courseTitle="Aula Virtual en Vivo — Noxius LM"
        user={{
          name: userName,
          email: role === "instructor" ? "docente@noxiuslm.edu" : "estudiante@noxiuslm.edu",
          role,
        }}
      />
    </div>
  );
}
