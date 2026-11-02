-- ========================================================
-- SISTEMAWEB LMS - ESQUEMA DE BASE DE DATOS SUPABASE
-- PostgreSQL + Row Level Security (RLS) + Storage
-- ========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS Y TIPOS
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE lesson_type AS ENUM ('video', 'live', 'document', 'quiz');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');

-- 2. TABLA DE PERFILES (Extiende auth.users de Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Trigger para sincronizar automáticamente el perfil con auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABLA DE CURSOS
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'General',
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. TABLA DE MÓDULOS DE CURSO
CREATE TABLE public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. TABLA DE LECCIONES
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type lesson_type NOT NULL DEFAULT 'video',
    video_url TEXT,
    content_markdown TEXT,
    duration_seconds INTEGER DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_free_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. MATRÍCULAS / ENROLLMENTS
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'active',
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

-- 7. PROGRESO DE LECCIONES POR ALUMNO
CREATE TABLE public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, lesson_id)
);

-- 8. RECURSOS Y ARCHIVOS DEL CURSO
CREATE TABLE public.course_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. ENTREGAS DE TAREAS POR ALUMNOS (Submissions)
CREATE TABLE public.student_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    comment TEXT,
    feedback TEXT,
    grade NUMERIC(4,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. CHAT EN TIEMPO REAL (Lecciones / Foros)
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 1000),
    is_instructor_reply BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Habilitar publicación para Supabase Realtime en chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 11. SALAS DE CLASES EN VIVO (Jitsi / WebRTC)
CREATE TABLE public.live_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    room_name TEXT NOT NULL UNIQUE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT false,
    ended_at TIMESTAMPTZ,
    recording_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) - SEGURIDAD ESTRICTA
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Helper function: verifica rol de administrador
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function: verifica matrícula en un curso
CREATE OR REPLACE FUNCTION public.is_enrolled(course_id_param UUID, user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.enrollments
        WHERE course_id = course_id_param AND user_id = $2 AND status = 'active'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas Profiles
CREATE POLICY "Lectura pública de perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas Cursos
CREATE POLICY "Cursos publicados son visibles por todos" ON public.courses FOR SELECT 
    USING (is_published = true OR auth.uid() = instructor_id OR public.is_admin(auth.uid()));
CREATE POLICY "Instructores y admins pueden crear cursos" ON public.courses FOR INSERT 
    WITH CHECK (auth.uid() = instructor_id OR public.is_admin(auth.uid()));
CREATE POLICY "Creadores o admins pueden editar cursos" ON public.courses FOR UPDATE 
    USING (auth.uid() = instructor_id OR public.is_admin(auth.uid()));

-- Políticas Módulos y Lecciones
CREATE POLICY "Ver módulos de cursos autorizados" ON public.course_modules FOR SELECT USING (true);
CREATE POLICY "Instructores gestionan sus módulos" ON public.course_modules FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (instructor_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE POLICY "Ver lecciones de cursos accesibles" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Instructores gestionan sus lecciones" ON public.lessons FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.course_modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND (c.instructor_id = auth.uid() OR public.is_admin(auth.uid()))
    ));

-- Políticas Enrollments
CREATE POLICY "Usuarios ven sus matrículas" ON public.enrollments FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins e instructores gestionan matrículas" ON public.enrollments FOR ALL 
    USING (public.is_admin(auth.uid()));

-- Políticas Progreso de Lecciones
CREATE POLICY "Usuarios ven su propio progreso" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan su propio progreso" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios modifican su propio progreso" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- Políticas Chat en Tiempo Real
CREATE POLICY "Usuarios pueden ver mensajes de lecciones si están autenticados" ON public.chat_messages 
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden enviar mensajes" ON public.chat_messages 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Políticas Submissions (Entregas de Estudiantes)
CREATE POLICY "Estudiantes ven sus propias entregas" ON public.student_submissions FOR SELECT 
    USING (auth.uid() = student_id OR public.is_admin(auth.uid()));
CREATE POLICY "Estudiantes suben sus entregas" ON public.student_submissions FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

-- Políticas Sesiones en Vivo
CREATE POLICY "Usuarios autenticados ven sesiones en vivo" ON public.live_sessions FOR SELECT 
    TO authenticated USING (true);
CREATE POLICY "Instructores gestionan sesiones" ON public.live_sessions FOR ALL 
    USING (auth.uid() = instructor_id OR public.is_admin(auth.uid()));

-- ========================================================
-- CONFIGURACIÓN DE STORAGE BUCKETS Y SEGURIDAD
-- ========================================================
-- 1. Buckets para archivos del curso y tareas de alumnos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('course-materials', 'course-materials', true, 104857600, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'video/mp4']),
    ('student-submissions', 'student-submissions', false, 52428800, ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed', 'text/plain', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para 'course-materials'
CREATE POLICY "Material público de lectura" ON storage.objects FOR SELECT 
    USING (bucket_id = 'course-materials');
CREATE POLICY "Solo instructores y admins suben material" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'course-materials' AND auth.role() = 'authenticated');

-- Políticas de Storage para 'student-submissions'
CREATE POLICY "Alumnos suben a su propia carpeta de submissions" ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'student-submissions' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Alumnos ven y leen solo sus propios archivos" ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'student-submissions' 
        AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid()))
    );

-- Índices de Rendimiento Críticos
CREATE INDEX idx_enrollments_user_course ON public.enrollments(user_id, course_id);
CREATE INDEX idx_lessons_module_order ON public.lessons(module_id, order_index);
CREATE INDEX idx_chat_messages_lesson ON public.chat_messages(lesson_id, created_at DESC);
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id, lesson_id);
CREATE INDEX idx_submissions_student ON public.student_submissions(student_id, lesson_id);
