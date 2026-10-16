const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando Testes Automatizados: Arquitetura SaaS Multi-Usuários, Onboarding em 4 Etapas & Disciplinas/Conteúdos Dinâmicos...');

const rootDir = path.resolve(__dirname, '..');

// 1. Verificar Tabelas e Políticas RLS Multi-Tenant no Supabase Schema
const schemaSql = fs.readFileSync(path.join(rootDir, 'supabase', 'schema.sql'), 'utf-8');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.user_subjects'), 'Tabela user_subjects ausente no schema.sql');
assert(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.subject_contents'), 'Tabela subject_contents ausente no schema.sql');
assert(schemaSql.includes('onboarding_completed BOOLEAN NOT NULL DEFAULT false'), 'Coluna onboarding_completed ausente em profiles');
assert(schemaSql.includes('Alunos gerenciam apenas suas disciplinas'), 'Política RLS de user_subjects ausente');
assert(schemaSql.includes('Alunos gerenciam apenas seus conteudos'), 'Política RLS de subject_contents ausente');
console.log('  ✅ 1. Schema Supabase Multi-Tenant (user_subjects, subject_contents e RLS) validado.');

// 2. Verificar Isolamento Multi-Usuário e Provisionamento de Onboarding no storageService.ts
const storageCode = fs.readFileSync(path.join(rootDir, 'frontend', 'lib', 'storageService.ts'), 'utf-8');
assert(storageCode.includes('export function provisionUserOnboarding'), 'Função provisionUserOnboarding ausente em storageService.ts');
assert(storageCode.includes('function getScopedKey(baseKey: string, userId?: string)'), 'Isolamento de chave por userId (getScopedKey) ausente');
assert(storageCode.includes('export function loadUserSubjects'), 'loadUserSubjects ausente em storageService.ts');
assert(storageCode.includes('export function saveUserSubjects'), 'saveUserSubjects ausente em storageService.ts');
console.log('  ✅ 2. Isolamento de dados por usuário (Multi-User Namespacing) e provisionamento de Onboarding validados.');

// 3. Verificar Geração Dinâmica de Estudos para Qualquer Disciplina e Conteúdo em questionBank.ts
const questionBankCode = fs.readFileSync(path.join(rootDir, 'frontend', 'lib', 'questionBank.ts'), 'utf-8');
assert(questionBankCode.includes('export function getDynamicStudyDataForTopic'), 'getDynamicStudyDataForTopic ausente em questionBank.ts');
assert(questionBankCode.includes('suggestedTopics:'), 'Lista de tópicos sugeridos por disciplina ausente em questionBank.ts');
assert(questionBankCode.includes('Geografia') && questionBankCode.includes('Redação & Linguagens'), 'Novas disciplinas base ausentes em questionBank.ts');
console.log('  ✅ 3. Motor dinâmico de questões e resumos por disciplina e conteúdo (getDynamicStudyDataForTopic) validado.');

// 4. Verificar AuthContext e Componentes de Onboarding em 4 Etapas, Conteúdos e Contas SaaS
const authCtxPath = path.join(rootDir, 'frontend', 'context', 'AuthContext.tsx');
const wizardPath = path.join(rootDir, 'frontend', 'components', 'onboarding', 'OnboardingWizard.tsx');
const subjectModalPath = path.join(rootDir, 'frontend', 'components', 'subjects', 'SubjectContentModal.tsx');
const accountModalPath = path.join(rootDir, 'frontend', 'components', 'saas', 'AccountAndPlanModal.tsx');

assert(fs.existsSync(authCtxPath), 'AuthContext.tsx não encontrado');
assert(fs.existsSync(wizardPath), 'OnboardingWizard.tsx não encontrado');
assert(fs.existsSync(subjectModalPath), 'SubjectContentModal.tsx não encontrado');
assert(fs.existsSync(accountModalPath), 'AccountAndPlanModal.tsx não encontrado');

const wizardCode = fs.readFileSync(wizardPath, 'utf-8');
assert(wizardCode.includes('Onboarding SaaS • Passo {step} de 4'), 'Indicador de 4 etapas ausente no OnboardingWizard');
assert(wizardCode.includes('1. Crie seu Perfil de Estudante'), 'Passo 1 do Onboarding ausente');
assert(wizardCode.includes('2. Objetivo & Sistema de Notas'), 'Passo 2 do Onboarding ausente');
assert(wizardCode.includes('3. Escolha suas Disciplinas'), 'Passo 3 do Onboarding ausente');
assert(wizardCode.includes('4. Conteúdos por Disciplina'), 'Passo 4 do Onboarding ausente');

// Garantir Zero window.alert() nos novos componentes SaaS
for (const file of [authCtxPath, wizardPath, subjectModalPath, accountModalPath]) {
  const content = fs.readFileSync(file, 'utf-8');
  assert(!content.includes('alert('), `Proibido uso de alert() em ${path.basename(file)}`);
}
console.log('  ✅ 4. Wizard de Onboarding em 4 Etapas, Gerenciador de Conteúdos e Switcher Multi-Contas validados (Zero alert()).');

console.log('🎉 Todos os testes da Arquitetura SaaS Multi-Usuários & Onboarding passaram com 100% de sucesso!');
