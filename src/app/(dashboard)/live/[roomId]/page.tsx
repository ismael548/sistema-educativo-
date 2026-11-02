'use client';

import React from 'react';
import { VirtualClassroom } from '@/components/live/virtual-classroom';

interface LiveRoomPageProps {
  params: {
    roomId: string;
  };
}

export default function LiveRoomPage({ params }: LiveRoomPageProps) {
  return (
    <div className="-m-6">
      <VirtualClassroom
        roomName={params.roomId}
        courseTitle="Masterclass en Vivo: Optimización PostgreSQL & Supabase"
        user={{
          name: 'Alex Rivera',
          email: 'alex@aetherlms.io',
          role: 'student',
        }}
      />
    </div>
  );
}
