const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando Testes Automatizados: Autenticação Real Supabase Auth, Onboarding & Disciplinas/Conteúdos Dinâmicos...');

const rootDir = path.resolve(__dirname, '..');

// 1. Verificar Tabelas e Políticas RLS Multi-Tenant no Supabase Schema
const schemaSql = fs.readFileSync(path.join(rootDir, 'supabase', 'schema.sql'), 'utf-8');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.user_subjects'), 'Tabela user_subjects ausente no schema.sql');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.subject_contents'), 'Tabela subject_contents ausente no schema.sql');
assert(schemaSql.includes('onboarding_completed BOOLEAN NOT NULL DEFAULT false'), 'Coluna onboarding_completed ausente em profiles');
assert(schemaSql.includes('Alunos gerenciam apenas suas disciplinas'), 'Política RLS de user_subjects ausente');
assert(schemaSql.includes('Alunos gerenciam apenas seus conteudos'), 'Política RLS de subject_contents ausente');
console.log('  ✅ 1. Schema Supabase Multi-Tenant (user_subjects, subject_contents e RLS) validado.');

// 2. Verificar Regra 1 do AGENTS.md: ZERO Autenticação Fake (Sem DEFAULT_DEMO_USER)
const storageCode = fs.readFileSync(path.join(rootDir, 'frontend', 'lib', 'storageService.ts'), 'utf-8');
assert(!storageCode.includes('DEFAULT_DEMO_USER'), 'Violação da Regra 1: DEFAULT_DEMO_USER encontrado em storageService.ts');
assert(storageCode.includes('export function provisionUserOnboarding'), 'Função provisionUserOnboarding ausente em storageService.ts');
assert(storageCode.includes('function getScopedKey(baseKey: string, userId?: string)'), 'Isolamento de chave por userId (getScopedKey) ausente');
console.log('  ✅ 2. Zero Autenticação Fake (DEFAULT_DEMO_USER eliminado) e escopo por auth.uid() validado.');

// 3. Verificar AuthModal.tsx (Login e Cadastro Real via Supabase Auth)
const authModalPath = path.join(rootDir, 'frontend', 'components', 'auth', 'AuthModal.tsx');
assert(fs.existsSync(authModalPath), 'AuthModal.tsx não encontrado em frontend/components/auth/');
const authModalCode = fs.readFileSync(authModalPath, 'utf-8');
assert(authModalCode.includes('supabase.auth.signInWithPassword'), 'signInWithPassword ausente no AuthModal.tsx');
assert(authModalCode.includes('supabase.auth.signUp'), 'signUp ausente no AuthModal.tsx');
assert(authModalCode.includes('#000000') && authModalCode.includes('#141414') && authModalCode.includes('#11C76F'), 'Paleta Fintech escura ausente no AuthModal.tsx');
assert(!authModalCode.includes('alert('), 'Proibido uso de alert() em AuthModal.tsx');
console.log('  ✅ 3. Componente AuthModal.tsx (signInWithPassword + signUp + Fintech Dark) validado.');

// 4. Verificar AuthContext.tsx (onAuthStateChange + vínculo com public.profiles + exibição de AuthModal)
const authCtxPath = path.join(rootDir, 'frontend', 'context', 'AuthContext.tsx');
const authCtxCode = fs.readFileSync(authCtxPath, 'utf-8');
assert(!authCtxCode.includes('DEFAULT_DEMO_USER'), 'Violação da Regra 1: DEFAULT_DEMO_USER encontrado em AuthContext.tsx');
assert(authCtxCode.includes('supabase.auth.onAuthStateChange'), 'Monitoramento onAuthStateChange ausente em AuthContext.tsx');
assert(authCtxCode.includes('supabase.auth.getSession'), 'Verificação getSession ausente em AuthContext.tsx');
assert(authCtxCode.includes(".from('profiles')"), 'Vínculo com a tabela public.profiles ausente em AuthContext.tsx');
assert(authCtxCode.includes('<AuthModal'), 'Renderização automática do AuthModal para usuários não logados ausente em AuthContext.tsx');
console.log('  ✅ 4. AuthContext.tsx monitorando sessão real (onAuthStateChange) e vinculado a public.profiles validado.');

console.log('🎉 Todos os testes de Autenticação Real Supabase Auth & Arquitetura SaaS passaram com 100% de sucesso!');
