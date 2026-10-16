-- =====================================================================
-- 🐘 SUPABASE POSTGRESQL SCHEMA: PLATAFORMA DE ESTUDOS INTELIGENTES (EM)
-- =====================================================================
-- Baseado no padrão Antigravity Blueprint com extensões para:
-- - Revisão Ativa (Técnica de Feynman / Reconhecimento de Voz)
-- - OCR Multimodal de Caderno / Fotos
-- - Simulados Diagnósticos com Explicações Imediatas
-- - Row Level Security (RLS) estrito em todas as tabelas
-- =====================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Alunos (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    grade_level TEXT DEFAULT '3º ano EM / Pré-Vestibular', -- '1º ano EM', '2º ano EM', '3º ano EM', 'Pré-Vestibular'
    target_exam TEXT DEFAULT 'ENEM', -- 'ENEM', 'Fuvest', 'Unicamp', 'Escolar'
    mastery_score INTEGER NOT NULL DEFAULT 500, -- Score estilo TRI/Crédito (0 a 1000)
    study_streak_days INTEGER NOT NULL DEFAULT 0,
    total_reviews_completed INTEGER NOT NULL DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos podem ver próprio perfil" ON public.profiles;
CREATE POLICY "Alunos podem ver próprio perfil"
ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Alunos podem atualizar próprio perfil" ON public.profiles;
CREATE POLICY "Alunos podem atualizar próprio perfil"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Alunos podem criar próprio perfil" ON public.profiles;
CREATE POLICY "Alunos podem criar próprio perfil"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Tabela de Disciplinas / Áreas do Conhecimento
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    area TEXT NOT NULL, -- 'Ciências da Natureza', 'Ciências Humanas', 'Matemática', 'Linguagens'
    icon TEXT NOT NULL DEFAULT 'BookOpen',
    color_accent TEXT NOT NULL DEFAULT '#11C76F',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ver disciplinas" ON public.subjects;
CREATE POLICY "Qualquer usuário autenticado pode ver disciplinas"
ON public.subjects FOR SELECT USING (true);

-- Inserir disciplinas base do Ensino Médio / ENEM
INSERT INTO public.subjects (name, area, icon, color_accent) VALUES
('Matemática', 'Matemática', 'Calculator', '#11C76F'),
('Física', 'Ciências da Natureza', 'Zap', '#3B82F6'),
('Química', 'Ciências da Natureza', 'FlaskConical', '#EC4899'),
('Biologia', 'Ciências da Natureza', 'Dna', '#10B981'),
('História', 'Ciências Humanas', 'Landmark', '#F59E0B'),
('Geografia', 'Ciências Humanas', 'Globe', '#8B5CF6'),
('Filosofia & Sociologia', 'Ciências Humanas', 'Compass', '#6366F1'),
('Linguagens & Literatura', 'Linguagens', 'BookA', '#06B6D4'),
('Redação', 'Linguagens', 'PenTool', '#F43F5E')
ON CONFLICT (name) DO NOTHING;

-- 4. Tabela de Sessões de Estudo (Gravação de Voz ou Foto do Caderno)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_title TEXT NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('voice_explanation', 'notebook_scan', 'hybrid')),
    
    -- Conteúdo bruto ou extraído
    input_transcription TEXT, -- Transcrição da fala do aluno ou texto OCR extraído
    media_url TEXT,           -- URL do arquivo no Supabase Storage
    
    -- Diagnóstico cognitivo gerado pelo Gemini
    ai_feedback JSONB DEFAULT '{}'::jsonb, -- { concepts_grasped: [], gaps_detected: [], clarity_score: 85, suggestions: [] }
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas suas sessões de estudo" ON public.study_sessions;
CREATE POLICY "Alunos gerenciam apenas suas sessões de estudo"
ON public.study_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Tabela de Simulados / Provas de Avaliação de Conteúdo (Quizzes)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 3,
    score_percentage NUMERIC(5, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quizzes_user ON public.quizzes(user_id);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas seus simulados" ON public.quizzes;
CREATE POLICY "Alunos gerenciam apenas seus simulados"
ON public.quizzes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Tabela de Questões do Simulado
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    source_context TEXT, -- Contexto específico extraído do caderno ou explicação
    options JSONB NOT NULL, -- Array de alternativas: [{ "letter": "A", "text": "...", "is_correct": true, "explanation": "..." }]
    student_selected_letter TEXT, -- 'A', 'B', 'C', 'D'
    is_correct BOOLEAN,
    explanation TEXT NOT NULL, -- Explicação detalhada da alternativa correta
    difficulty TEXT DEFAULT 'médio' CHECK (difficulty IN ('fácil', 'médio', 'difícil')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos visualizam questoes de seus simulados" ON public.quiz_questions;
CREATE POLICY "Alunos visualizam questoes de seus simulados"
ON public.quiz_questions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_questions.quiz_id
        AND q.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quizzes q
        WHERE q.id = quiz_questions.quiz_id
        AND q.user_id = auth.uid()
    )
);

-- 7. Trigger para criação automática de perfil de aluno
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, mastery_score, study_streak_days)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        500,
        1
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Trigger para auto-atualização do updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- =====================================================================
-- 9. Tabela de Templates de Rotinas de Estudo
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.study_routine_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL se for template padrão do sistema
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT DEFAULT 'geral', -- 'normal', 'pre_prova', 'revisao_rapida', 'custom'
    is_default BOOLEAN DEFAULT false,
    estimated_minutes INTEGER DEFAULT 45,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.study_routine_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos podem ver templates públicos ou próprios" ON public.study_routine_templates;
CREATE POLICY "Alunos podem ver templates públicos ou próprios"
ON public.study_routine_templates FOR SELECT
USING (is_default = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Alunos gerenciam seus templates customizados" ON public.study_routine_templates;
CREATE POLICY "Alunos gerenciam seus templates customizados"
ON public.study_routine_templates FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Inserir templates padrão (Dia Normal e Pré-Prova)
INSERT INTO public.study_routine_templates (title, description, tag, is_default, estimated_minutes) VALUES
('Dia Normal', 'Fluxo padrão com resumo geral, 5 questões, resumo focal em erros, 10 questões e resumo final.', 'normal', true, 45),
('Pré-Prova Intensivo', 'Revisão aprofundada com resumo geral, 5 questões descritivas e resumo com base na correção da IA.', 'pre_prova', true, 60),
('Revisão Relâmpago 15 min', 'Fluxo rápido para fixação diária de tópicos recentes.', 'revisao_rapida', true, 15)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 10. Tabela de Etapas da Rotina de Estudo (Steps)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.study_routine_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES public.study_routine_templates(id) ON DELETE CASCADE NOT NULL,
    step_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN ('summary', 'quiz_objective', 'quiz_descriptive', 'focal_error_summary', 'final_summary')),
    questions_count INTEGER DEFAULT 0,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.study_routine_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos podem ver etapas dos templates acessíveis" ON public.study_routine_steps;
CREATE POLICY "Alunos podem ver etapas dos templates acessíveis"
ON public.study_routine_steps FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.study_routine_templates t
        WHERE t.id = study_routine_steps.routine_id
        AND (t.is_default = true OR t.user_id = auth.uid())
    )
);

-- =====================================================================
-- 11. Tabela de Eventos da Agenda de Estudos
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.study_agenda_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    routine_id UUID REFERENCES public.study_routine_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME,
    duration_minutes INTEGER DEFAULT 45,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agenda_user_date ON public.study_agenda_events(user_id, scheduled_date);
ALTER TABLE public.study_agenda_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas seus eventos de agenda" ON public.study_agenda_events;
CREATE POLICY "Alunos gerenciam apenas seus eventos de agenda"
ON public.study_agenda_events FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 12. Tabela de Configurações do Boletim Acadêmico
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.academic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    term_system TEXT NOT NULL DEFAULT 'bimestral' CHECK (term_system IN ('bimestral', 'trimestral', 'semestral')),
    passing_grade NUMERIC(4, 2) NOT NULL DEFAULT 6.00, -- Média para passar direto (ex: 6.0 ou 7.0)
    grade_scale TEXT NOT NULL DEFAULT '0_10' CHECK (grade_scale IN ('0_10', '0_100')),
    use_weights BOOLEAN NOT NULL DEFAULT false, -- Se usa pesos por período ou avaliação
    period_weights JSONB DEFAULT '{"1": 1, "2": 1, "3": 1, "4": 1}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.academic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas suas configuracoes academicas" ON public.academic_settings;
CREATE POLICY "Alunos gerenciam apenas suas configuracoes academicas"
ON public.academic_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 13. Tabela de Notas e Boletim Escolar (student_grades)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    period_number INTEGER NOT NULL, -- 1, 2, 3 ou 4
    evaluation_name TEXT NOT NULL DEFAULT 'Média do Período', -- ex: 'Prova 1', 'Trabalho', 'Simulado', 'Média Geral'
    grade_value NUMERIC(4, 2), -- ex: 7.50
    weight NUMERIC(4, 2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_grades_user ON public.student_grades(user_id, subject_id, period_number);
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas suas notas" ON public.student_grades;
CREATE POLICY "Alunos gerenciam apenas suas notas"
ON public.student_grades FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 14. Evolução SaaS Multi-Usuário, Onboarding & Conteúdos Customizados
-- =====================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_credits INTEGER NOT NULL DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Tabela de Disciplinas Personalizadas por Usuário (user_subjects)
CREATE TABLE IF NOT EXISTS public.user_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Personalizada',
    color_accent TEXT NOT NULL DEFAULT '#11C76F',
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_subjects_user ON public.user_subjects(user_id);
ALTER TABLE public.user_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas suas disciplinas" ON public.user_subjects;
CREATE POLICY "Alunos gerenciam apenas suas disciplinas"
ON public.user_subjects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tabela de Conteúdos / Tópicos por Disciplina do Usuário (subject_contents)
CREATE TABLE IF NOT EXISTS public.subject_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    summary_definition TEXT,
    formula_or_rule TEXT,
    enem_tip TEXT,
    descriptive_prompt TEXT,
    custom_questions JSONB DEFAULT '[]'::jsonb,
    mastery_level INTEGER NOT NULL DEFAULT 0, -- 0 a 100%
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subject_contents_user_subj ON public.subject_contents(user_id, subject_name);
ALTER TABLE public.subject_contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alunos gerenciam apenas seus conteudos" ON public.subject_contents;
CREATE POLICY "Alunos gerenciam apenas seus conteudos"
ON public.subject_contents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


