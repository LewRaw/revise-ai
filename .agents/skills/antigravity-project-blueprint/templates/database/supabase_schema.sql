-- =====================================================================
-- 🐘 SUPABASE POSTGRESQL STARTER SCHEMA (ANTIGRAVITY BLUEPRINT)
-- =====================================================================
-- Executar no SQL Editor do painel Supabase
-- Inclui: Tabela profiles, RLS estrito, Trigger de cadastro automático

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'plus', 'pro'
    credits INTEGER NOT NULL DEFAULT 15,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'inactive',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices para performance de busca
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
-- Cada usuário só pode visualizar o seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem ler o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ler o próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Cada usuário só pode atualizar o seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar o próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Inserção pelo próprio usuário ou pelo trigger
DROP POLICY IF EXISTS "Usuários podem inserir o próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir o próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Função e Trigger para criação automática de perfil no SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, plan, credits)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        'free',
        15
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador após cadastro no Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Trigger para atualização automática da coluna updated_at
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
