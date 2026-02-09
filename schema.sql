
-- ==========================================
-- SPEAKSYNC: ESQUEMA MAESTRO (SUPABASE)
-- ==========================================

-- 1. TABLA: PROFILES (Estado Global del Usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 50,
    streak INTEGER DEFAULT 0,
    level TEXT DEFAULT 'A1',
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: HISTORY (Historial de Lecciones)
CREATE TABLE IF NOT EXISTS public.history (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    level TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: USER_PROGRESS (Rutas del Roadmap)
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, chapter_id)
);

-- 4. TABLA: USER_VOCABULARY (Bóveda Léxica)
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    dutch TEXT NOT NULL,
    spanish TEXT NOT NULL,
    type TEXT,
    pronunciation TEXT,
    mastery TEXT DEFAULT 'new',
    sync_count INTEGER DEFAULT 1,
    category TEXT DEFAULT 'General',
    last_practiced TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: CONTENT_CACHE (Caché de IA Compartida)
CREATE TABLE IF NOT EXISTS public.content_cache (
    chapter_id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    vocabulary JSONB,
    quiz JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: ATELIER_LOGS (Refinamiento de Textos)
CREATE TABLE IF NOT EXISTS public.atelier_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    improved_text TEXT NOT NULL,
    feedback TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: NEWS_CACHE (Optimización #4: Caché Global de Noticias)
CREATE TABLE IF NOT EXISTS public.news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    level TEXT NOT NULL,
    items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEGURIDAD: POLÍTICAS RLS (ACCESO PÚBLICO ANON)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- Políticas universales para desarrollo (Permiten todo a anon)
CREATE POLICY "Acceso total a profiles" ON public.profiles FOR ALL TO anon USING (true);
CREATE POLICY "Acceso total a history" ON public.history FOR ALL TO anon USING (true);
CREATE POLICY "Acceso total a progress" ON public.user_progress FOR ALL TO anon USING (true);
CREATE POLICY "Acceso total a vocabulary" ON public.user_vocabulary FOR ALL TO anon USING (true);
CREATE POLICY "Acceso total a cache" ON public.content_cache FOR ALL TO anon USING (true);
CREATE POLICY "Acceso total a atelier" ON public.atelier_logs FOR ALL TO anon USING (true);
CREATE POLICY "Acceso total a news_cache" ON public.news_cache FOR ALL TO anon USING (true);

-- ==========================================
-- ÍNDICES DE VELOCIDAD
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_vocab_user ON public.user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_history_time ON public.history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_news_cache_lookup ON public.news_cache(category, level);
