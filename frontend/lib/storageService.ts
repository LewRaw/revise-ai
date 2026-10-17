/**
 * Camada de Persistência Multi-Tenant Sincronizada com o ID Real do Supabase Auth (auth.uid())
 * Isola dados locais por userId autenticado e gerencia disciplinas/conteúdos, boletim e FSRS.
 */

import { TermSystem, SubjectPeriodGrade, calculateCurrentAverage, calculateRequiredGradeToPass, getPeriodsCount } from './gradeCalculations';
import { ErrorNotebookCard } from './fsrsEngine';
import { SUBJECT_STUDY_BANK, BankQuestion } from './questionBank';

export type SaasPlanTier = 'free' | 'plus' | 'pro';

export interface TopicGeneratedStudyData {
  summaryDefinition: string;
  formulaOrRule: string;
  enemTip: string;
  descriptivePrompt: string;
  questions: BankQuestion[];
  userNotes?: string;
  source?: 'gemini' | 'deterministic_fallback';
  updatedAt?: string;
}

export interface SubjectTopicItem {
  id: string;
  title: string;
  summaryText?: string;
  formulaOrRule?: string;
  enemTip?: string;
  descriptivePrompt?: string;
  customQuestions?: BankQuestion[];
  generatedStudyData?: TopicGeneratedStudyData;
  difficulty: 'easy' | 'medium' | 'hard';
  masteryScore: number;
}

export interface UserSubjectWithContents {
  id: string;
  name: string;
  area: 'exatas' | 'natureza' | 'humanas' | 'linguagens' | 'outros';
  color: string;
  icon: string;
  isCustom: boolean;
  topics: SubjectTopicItem[];
}

export interface SaasUserProfile {
  id: string;
  fullName: string;
  email: string;
  schoolGrade: '1º Ano EM' | '2º Ano EM' | '3º Ano EM' | 'Cursinho / ENEM';
  targetExam: string;
  termSystem: TermSystem;
  passingGrade: number;
  plan: SaasPlanTier;
  aiCreditsRemaining: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface StoredSubjectEntry {
  id: string;
  name: string;
  color: string;
  grades: SubjectPeriodGrade[];
}

export interface StoredGradebookState {
  termSystem: TermSystem;
  passingGrade: number;
  useWeights: boolean;
  subjects: StoredSubjectEntry[];
}

export interface StoredAgendaEvent {
  id: string;
  day: string;
  subject: string;
  routine: string;
  status: 'pending' | 'completed';
}

const GLOBAL_KEYS = { ACTIVE_USER_ID: 'reviseai_active_supabase_uid_v1' };
const BASE_KEYS = {
  STATS: 'reviseai_stats_v1',
  GRADEBOOK: 'reviseai_gradebook_v1',
  ERRORS: 'reviseai_error_notebook_v1',
  AGENDA: 'reviseai_agenda_v1',
  SUBJECTS: 'reviseai_user_subjects_v1',
};

export const UNAUTHENTICATED_PROFILE: SaasUserProfile = {
  id: '',
  fullName: 'Estudante',
  email: '',
  schoolGrade: '3º Ano EM',
  targetExam: 'ENEM & Vestibulares',
  termSystem: 'bimestral',
  passingGrade: 6.0,
  plan: 'free',
  aiCreditsRemaining: 25,
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
};

function makeDefaultSubject(
  id: string,
  name: string,
  area: UserSubjectWithContents['area'],
  color: string,
  icon: string,
  difficulty: 'easy' | 'medium',
  masteryScore: number
): UserSubjectWithContents {
  return {
    id,
    name,
    area,
    color,
    icon,
    isCustom: false,
    topics: SUBJECT_STUDY_BANK[name].suggestedTopics.map((t, idx) => ({
      id: `top_${id}_${idx}`,
      title: t,
      difficulty,
      masteryScore: idx === 0 && name === 'Física' ? 78 : masteryScore,
    })),
  };
}

export const DEFAULT_USER_SUBJECTS: UserSubjectWithContents[] = [
  makeDefaultSubject('sub_fis', 'Física', 'natureza', '#3B82F6', '⚡', 'medium', 65),
  makeDefaultSubject('sub_mat', 'Matemática', 'exatas', '#11C76F', '📐', 'medium', 80),
  makeDefaultSubject('sub_qui', 'Química', 'natureza', '#EC4899', '🧪', 'medium', 82),
  makeDefaultSubject('sub_bio', 'Biologia', 'natureza', '#10B981', '🧬', 'easy', 75),
  makeDefaultSubject('sub_hist', 'História', 'humanas', '#F59E0B', '🏛️', 'easy', 88),
];

const buildDefaultPeriods = (g1: number, g2: number): SubjectPeriodGrade[] => [
  { periodNumber: 1, grade: g1, weight: 1 },
  { periodNumber: 2, grade: g2, weight: 1 },
  { periodNumber: 3, grade: null, weight: 1 },
  { periodNumber: 4, grade: null, weight: 1 },
];

export const DEFAULT_GRADEBOOK: StoredGradebookState = {
  termSystem: 'bimestral',
  passingGrade: 6.0,
  useWeights: false,
  subjects: [
    { id: 'sub_mat', name: 'Matemática', color: '#11C76F', grades: buildDefaultPeriods(7.5, 6.0) },
    { id: 'sub_fis', name: 'Física', color: '#3B82F6', grades: buildDefaultPeriods(5.0, 5.5) },
    { id: 'sub_qui', name: 'Química', color: '#EC4899', grades: buildDefaultPeriods(8.5, 8.0) },
    { id: 'sub_bio', name: 'Biologia', color: '#10B981', grades: buildDefaultPeriods(7.0, 7.5) },
    { id: 'sub_hist', name: 'História', color: '#F59E0B', grades: buildDefaultPeriods(9.0, 8.5) },
  ],
};

export function getActiveUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(GLOBAL_KEYS.ACTIVE_USER_ID) || '';
  } catch {
    return '';
  }
}

export function setActiveUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!userId) localStorage.removeItem(GLOBAL_KEYS.ACTIVE_USER_ID);
    else localStorage.setItem(GLOBAL_KEYS.ACTIVE_USER_ID, userId);
  } catch (e) {
    console.error('Erro ao sincronizar ID do usuário autenticado:', e);
  }
}

function getScopedKey(baseKey: string, userId?: string): string {
  const uid = userId !== undefined ? userId : getActiveUserId();
  return uid ? `${baseKey}__${uid}` : baseKey;
}

export function loadUserSubjects(userId?: string): UserSubjectWithContents[] {
  if (typeof window === 'undefined') return DEFAULT_USER_SUBJECTS;
  try {
    const raw = localStorage.getItem(getScopedKey(BASE_KEYS.SUBJECTS, userId));
    if (!raw) return DEFAULT_USER_SUBJECTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USER_SUBJECTS;
  } catch {
    return DEFAULT_USER_SUBJECTS;
  }
}

export function saveUserSubjects(subjects: UserSubjectWithContents[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getScopedKey(BASE_KEYS.SUBJECTS, userId), JSON.stringify(subjects));
  } catch (e) {
    console.error('Erro ao salvar disciplinas do usuário:', e);
  }
}

export function provisionUserOnboarding(params: {
  userId?: string;
  fullName: string;
  email: string;
  schoolGrade: SaasUserProfile['schoolGrade'];
  targetExam: string;
  termSystem: TermSystem;
  passingGrade: number;
  plan?: SaasPlanTier;
  subjects: UserSubjectWithContents[];
}): SaasUserProfile {
  const targetUserId = params.userId || getActiveUserId() || `usr_${Date.now()}`;
  const planTier = params.plan || 'free';
  const creditsMap: Record<SaasPlanTier, number> = { free: 25, plus: 150, pro: 999 };

  const provisionedProfile: SaasUserProfile = {
    id: targetUserId,
    fullName: params.fullName.trim() || 'Estudante',
    email: params.email.trim(),
    schoolGrade: params.schoolGrade,
    targetExam: params.targetExam.trim() || 'ENEM & Vestibulares',
    termSystem: params.termSystem,
    passingGrade: params.passingGrade,
    plan: planTier,
    aiCreditsRemaining: creditsMap[planTier],
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
  };

  setActiveUserId(targetUserId);
  const finalSubjects = params.subjects.length > 0 ? params.subjects : DEFAULT_USER_SUBJECTS;
  saveUserSubjects(finalSubjects, targetUserId);

  const periodsCount = getPeriodsCount(params.termSystem);
  const gradebookSubjects: StoredSubjectEntry[] = finalSubjects.map((sub, idx) => ({
    id: sub.id || `sub_${idx}`,
    name: sub.name,
    color: sub.color || '#11C76F',
    grades: Array.from({ length: periodsCount }, (_, i) => ({ periodNumber: i + 1, grade: null, weight: 1 })),
  }));

  saveGradebookState({ termSystem: params.termSystem, passingGrade: params.passingGrade, useWeights: false, subjects: gradebookSubjects }, targetUserId);

  const days = ['Hoje', 'Amanhã', 'Quinta', 'Sexta'];
  const initialAgenda: StoredAgendaEvent[] = days.map((day, idx) => ({
    id: `ag_${targetUserId}_${idx}`,
    day,
    subject: finalSubjects[idx % finalSubjects.length].name,
    routine: idx % 2 === 0 ? 'Dia Normal' : 'Revisão Relâmpago',
    status: 'pending',
  }));
  saveAgendaEvents(initialAgenda, targetUserId);
  saveUserStats({ masteryScore: 650, streakDays: 1, completedReviews: 0 }, targetUserId);

  return provisionedProfile;
}

export function loadUserStats(userId?: string): { masteryScore: number; streakDays: number; completedReviews: number } {
  if (typeof window === 'undefined') return { masteryScore: 780, streakDays: 5, completedReviews: 8 };
  try {
    const raw = localStorage.getItem(getScopedKey(BASE_KEYS.STATS, userId));
    return raw ? JSON.parse(raw) : { masteryScore: 780, streakDays: 5, completedReviews: 8 };
  } catch {
    return { masteryScore: 780, streakDays: 5, completedReviews: 8 };
  }
}

export function saveUserStats(stats: { masteryScore: number; streakDays: number; completedReviews: number }, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getScopedKey(BASE_KEYS.STATS, userId), JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar stats no localStorage:', e);
  }
}

export function loadGradebookState(userId?: string): StoredGradebookState {
  if (typeof window === 'undefined') return DEFAULT_GRADEBOOK;
  try {
    const raw = localStorage.getItem(getScopedKey(BASE_KEYS.GRADEBOOK, userId));
    return raw ? JSON.parse(raw) : DEFAULT_GRADEBOOK;
  } catch {
    return DEFAULT_GRADEBOOK;
  }
}

export function saveGradebookState(state: StoredGradebookState, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getScopedKey(BASE_KEYS.GRADEBOOK, userId), JSON.stringify(state));
  } catch (e) {
    console.error('Erro ao salvar boletim:', e);
  }
}

export function getAtRiskSubjectsFromGradebook(userId?: string): {
  name: string;
  currentAverage: number;
  requiredNext: number | null;
}[] {
  const gb = loadGradebookState(userId);
  const atRisk: { name: string; currentAverage: number; requiredNext: number | null }[] = [];
  for (const sub of gb.subjects) {
    const avg = calculateCurrentAverage(sub.grades, gb.useWeights);
    if (avg !== null && avg < gb.passingGrade) {
      const proj = calculateRequiredGradeToPass(gb.termSystem, sub.grades, gb.passingGrade, gb.useWeights);
      atRisk.push({ name: sub.name, currentAverage: avg, requiredNext: proj.requiredPerRemainingPeriod });
    }
  }
  return atRisk;
}

export function loadErrorNotebook(userId?: string): ErrorNotebookCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getScopedKey(BASE_KEYS.ERRORS, userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveErrorNotebook(cards: ErrorNotebookCard[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getScopedKey(BASE_KEYS.ERRORS, userId), JSON.stringify(cards));
  } catch (e) {
    console.error('Erro ao salvar caderno de erros:', e);
  }
}

export function loadAgendaEvents(userId?: string): StoredAgendaEvent[] {
  const defaults: StoredAgendaEvent[] = [
    { id: 'ag_1', day: 'Hoje (Terça)', subject: 'Física', routine: 'Dia Normal', status: 'pending' },
    { id: 'ag_2', day: 'Quarta', subject: 'Matemática', routine: 'Dia Normal', status: 'pending' },
    { id: 'ag_3', day: 'Quinta', subject: 'Química', routine: 'Pré-Prova Intensivo', status: 'pending' },
    { id: 'ag_4', day: 'Sexta', subject: 'Biologia', routine: 'Revisão Relâmpago', status: 'pending' },
  ];
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(getScopedKey(BASE_KEYS.AGENDA, userId));
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

export function saveAgendaEvents(events: StoredAgendaEvent[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getScopedKey(BASE_KEYS.AGENDA, userId), JSON.stringify(events));
  } catch (e) {
    console.error('Erro ao salvar agenda:', e);
  }
}
