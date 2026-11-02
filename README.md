# Aether LMS - Plataforma Educativa de Alto Rendimiento

Plataforma educativa moderna (LMS) desarrollada con arquitectura limpia, alto rendimiento y una interfaz oscura elegante con color base `#0d0f12`.

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS.
- **Backend & DB:** Supabase (PostgreSQL estructurado con Row Level Security).
- **Tiempo Real:** Supabase Realtime Channels (`postgres_changes` para salas de chat y foros).
- **Almacenamiento:** Supabase Storage con validación de tipo MIME y políticas de carpetas privadas por usuario.
- **Clases en Vivo:** Jitsi Meet External API / WebRTC streaming con pantalla compartida y chat sincronizado.

---

## 📁 Estructura del Proyecto

```text
sistemaweb/
├── supabase/
│   └── schema.sql                  # Esquema relacional SQL completo, RLS y triggers
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Shell del LMS con Sidebar y Topbar
│   │   │   ├── student/page.tsx    # Portal del estudiante (KPIs y accesos)
│   │   │   ├── admin/page.tsx      # Gestión de cursos, estudiantes y storage
│   │   │   ├── live/[roomId]/page.tsx # Aula virtual en vivo con Jitsi
│   │   │   ├── files/page.tsx      # Hub centralizado de tareas y recursos
│   │   │   └── courses/[courseId]/lessons/[lessonId]/page.tsx # Reproductor + Chat
│   │   ├── layout.tsx              # Root Layout oscuro
│   │   ├── globals.css             # Estilos base y scrollbar minimalista
│   │   └── page.tsx                # Landing principal
│   ├── components/
│   │   ├── chat/
│   │   │   └── lesson-chat.tsx     # Chat en tiempo real con Supabase Realtime
│   │   ├── courses/
│   │   │   └── video-player.tsx    # Reproductor sin distracciones y hotkeys
│   │   ├── live/
│   │   │   └── virtual-classroom.tsx # Aula Virtual WebRTC (Jitsi API)
│   │   ├── files/
│   │   │   └── file-hub.tsx        # Descargas y subida segura de entregas
│   │   └── layout/
│   │       ├── sidebar.tsx         # Navegación lateral
│   │       └── topbar.tsx          # Barra superior con buscador y estado en vivo
│   └── lib/
│       ├── security/
│       │   └── file-validation.ts  # Validación estricta de MIME, tamaño y nombres
│       └── supabase/
│           ├── client.ts           # Cliente Supabase Browser
│           ├── server.ts           # Cliente Supabase Server (SSR Cookies)
│           └── types.ts            # Tipos TypeScript de la base de datos
├── tailwind.config.ts              # Configuración de tema oscuro (#0d0f12)
├── tsconfig.json
└── package.json
```

---

## 🚀 Despliegue y Puesta en Marcha

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia `.env.example` a `.env.local` e introduce tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```

3. **Ejecutar el esquema SQL:**
   Copia el contenido de `supabase/schema.sql` y ejecútalo en el SQL Editor de tu proyecto en el panel de Supabase. Esto creará:
   - Tablas (`profiles`, `courses`, `course_modules`, `lessons`, `enrollments`, `lesson_progress`, `chat_messages`, `student_submissions`).
   - Políticas RLS para aislamiento de datos.
   - Buckets de Supabase Storage (`course-materials` y `student-submissions`).
   - Trigger automático que vincula usuarios nuevos registrados con la tabla `profiles`.

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
