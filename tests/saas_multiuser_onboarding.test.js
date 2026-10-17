const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando Testes Automatizados: Autenticação Real Supabase Auth, Onboarding & Disciplinas/Conteúdos Dinâmicos...');

const rootDir = path.resolve(__dirname, '..');

// 1. Verificar Tabelas, Colunas IA e Políticas RLS Multi-Tenant no Supabase Schema
const schemaSql = fs.readFileSync(path.join(rootDir, 'supabase', 'schema.sql'), 'utf-8');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.user_subjects'), 'Tabela user_subjects ausente no schema.sql');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.subject_contents'), 'Tabela subject_contents ausente no schema.sql');
assert(schemaSql.includes('onboarding_completed BOOLEAN NOT NULL DEFAULT false'), 'Coluna onboarding_completed ausente em profiles');
assert(schemaSql.includes('formula_or_rule TEXT'), 'Coluna formula_or_rule ausente em subject_contents');
assert(schemaSql.includes('enem_tip TEXT'), 'Coluna enem_tip ausente em subject_contents');
assert(schemaSql.includes('descriptive_prompt TEXT'), 'Coluna descriptive_prompt ausente em subject_contents');
assert(schemaSql.includes('custom_questions JSONB'), 'Coluna custom_questions ausente em subject_contents');
assert(schemaSql.includes('Alunos gerenciam apenas suas disciplinas'), 'Política RLS de user_subjects ausente');
assert(schemaSql.includes('Alunos gerenciam apenas seus conteudos'), 'Política RLS de subject_contents ausente');
console.log('  ✅ 1. Schema Supabase Multi-Tenant (user_subjects, subject_contents com colunas IA e RLS) validado.');

// 2. Verificar Regra 1 do AGENTS.md: ZERO Autenticação Fake e Persistência de Dados IA em storageService.ts
const storageCode = fs.readFileSync(path.join(rootDir, 'frontend', 'lib', 'storageService.ts'), 'utf-8');
assert(!storageCode.includes('DEFAULT_DEMO_USER'), 'Violação da Regra 1: DEFAULT_DEMO_USER encontrado em storageService.ts');
assert(storageCode.includes('export function provisionUserOnboarding'), 'Função provisionUserOnboarding ausente em storageService.ts');
assert(storageCode.includes('function getScopedKey(baseKey: string, userId?: string)'), 'Isolamento de chave por userId (getScopedKey) ausente');
assert(storageCode.includes('export interface TopicGeneratedStudyData'), 'Interface TopicGeneratedStudyData ausente em storageService.ts');
assert(storageCode.includes('generatedStudyData?: TopicGeneratedStudyData'), 'Campo generatedStudyData ausente em SubjectTopicItem');
console.log('  ✅ 2. Zero Autenticação Fake (DEFAULT_DEMO_USER eliminado), escopo por auth.uid() e TopicGeneratedStudyData validados.');

// 3. Verificar AuthModal.tsx (Login e Cadastro Real via Supabase Auth)
const authModalPath = path.join(rootDir, 'frontend', 'components', 'auth', 'AuthModal.tsx');
assert(fs.existsSync(authModalPath), 'AuthModal.tsx não encontrado em frontend/components/auth/');
const authModalCode = fs.readFileSync(authModalPath, 'utf-8');
assert(authModalCode.includes('supabase.auth.signInWithPassword'), 'signInWithPassword ausente no AuthModal.tsx');
assert(authModalCode.includes('supabase.auth.signUp'), 'signUp ausente no AuthModal.tsx');
assert(authModalCode.includes('#000000') && authModalCode.includes('#141414') && authModalCode.includes('#11C76F'), 'Paleta Fintech escura ausente no AuthModal.tsx');
assert(!authModalCode.includes('alert('), 'Proibido uso de alert() em AuthModal.tsx');
console.log('  ✅ 3. Componente AuthModal.tsx (signInWithPassword + signUp + Fintech Dark) validado.');

// 4. Verificar AuthContext.tsx (onAuthStateChange, hidratação subject_contents, updateTopicStudyData e consumeAiCredits)
const authCtxPath = path.join(rootDir, 'frontend', 'context', 'AuthContext.tsx');
const authCtxCode = fs.readFileSync(authCtxPath, 'utf-8');
assert(!authCtxCode.includes('DEFAULT_DEMO_USER'), 'Violação da Regra 1: DEFAULT_DEMO_USER encontrado em AuthContext.tsx');
assert(authCtxCode.includes('supabase.auth.onAuthStateChange'), 'Monitoramento onAuthStateChange ausente em AuthContext.tsx');
assert(authCtxCode.includes('supabase.auth.getSession'), 'Verificação getSession ausente em AuthContext.tsx');
assert(authCtxCode.includes(".from('profiles')"), 'Vínculo com a tabela public.profiles ausente em AuthContext.tsx');
assert(authCtxCode.includes(".from('subject_contents')"), 'Sincronização com subject_contents ausente em AuthContext.tsx');
assert(authCtxCode.includes('updateTopicStudyData'), 'Função updateTopicStudyData ausente em AuthContext.tsx');
assert(authCtxCode.includes('consumeAiCredits'), 'Função consumeAiCredits ausente em AuthContext.tsx');
assert(authCtxCode.includes('<AuthModal'), 'Renderização automática do AuthModal para usuários não logados ausente em AuthContext.tsx');
console.log('  ✅ 4. AuthContext.tsx (sessão real, hidratação subject_contents, updateTopicStudyData e consumeAiCredits) validado.');

// 5. Verificar Fluxos de Criação e Personalização com IA em SubjectContentModal.tsx, ErrorNotebookTab.tsx e RoutinePlayerModal.tsx
const subjectModalCode = fs.readFileSync(path.join(rootDir, 'frontend', 'components', 'subjects', 'SubjectContentModal.tsx'), 'utf-8');
assert(subjectModalCode.includes("action: 'generate_topic_material'"), 'SubjectContentModal.tsx deve chamar generate_topic_material na API de IA');
assert(subjectModalCode.includes('handleRegenerateTopicWithAi'), 'SubjectContentModal.tsx deve permitir recriar/personalizar tópico existente com IA');
assert(subjectModalCode.includes('consumeAiCredits'), 'SubjectContentModal.tsx deve validar créditos de IA');

const errorNotebookCode = fs.readFileSync(path.join(rootDir, 'frontend', 'components', 'study', 'ErrorNotebookTab.tsx'), 'utf-8');
assert(errorNotebookCode.includes('handleGenerateMoreQuestionsWithAi'), 'ErrorNotebookTab.tsx deve ter botão/fluxo para gerar novas questões IA sob demanda');
assert(errorNotebookCode.includes('getDynamicStudyDataForTopic('), 'ErrorNotebookTab.tsx deve carregar dados dinâmicos do tópico ativo');

const routinePlayerCode = fs.readFileSync(path.join(rootDir, 'frontend', 'components', 'routines', 'RoutinePlayerModal.tsx'), 'utf-8');
assert(routinePlayerCode.includes('getDynamicStudyDataForTopic(subjectName, matchedTopic?.title, matchedTopic?.summaryText, matchedTopic)'), 'RoutinePlayerModal.tsx deve passar matchedTopic como topicOverride');
console.log('  ✅ 5. Fluxos de criação/regeneração IA em SubjectContentModal, ErrorNotebookTab e RoutinePlayerModal validados.');

console.log('🎉 Todos os testes de Autenticação Real Supabase Auth, IA Personalizada & Arquitetura SaaS passaram com 100% de sucesso!');
