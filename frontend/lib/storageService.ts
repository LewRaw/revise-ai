/**
 * Camada de Persistência Offline-First (LocalStorage + Sincronização)
 * Garante que notas do boletim, rotinas criadas, Score TRI e Caderno de Erros FSRS
 * sejam preservados entre sessões no navegador/PWA.
 */

import { TermSystem, SubjectPeriodGrade, calculateCurrentAverage, calculateRequiredGradeToPass } from './gradeCalculations';
import { ErrorNotebookCard } from './fsrsEngine';

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

const KEYS = {
  STATS: 'reviseai_stats_v1',
  GRADEBOOK: 'reviseai_gradebook_v1',
  ERRORS: 'reviseai_error_notebook_v1',
  AGENDA: 'reviseai_agenda_v1',
  CUSTOM_ROUTINES: 'reviseai_custom_routines_v1',
};

export const DEFAULT_GRADEBOOK: StoredGradebookState = {
  termSystem: 'bimestral',
  passingGrade: 6.0,
  useWeights: false,
  subjects: [
    {
      id: 'sub_mat',
      name: 'Matemática',
      color: '#11C76F',
      grades: [
        { periodNumber: 1, grade: 7.5, weight: 1 },
        { periodNumber: 2, grade: 6.0, weight: 1 },
        { periodNumber: 3, grade: null, weight: 1 },
        { periodNumber: 4, grade: null, weight: 1 },
      ]
    },
    {
      id: 'sub_fis',
      name: 'Física',
      color: '#3B82F6',
      grades: [
        { periodNumber: 1, grade: 5.0, weight: 1 },
        { periodNumber: 2, grade: 5.5, weight: 1 },
        { periodNumber: 3, grade: null, weight: 1 },
        { periodNumber: 4, grade: null, weight: 1 },
      ]
    },
    {
      id: 'sub_qui',
      name: 'Química',
      color: '#EC4899',
      grades: [
        { periodNumber: 1, grade: 8.5, weight: 1 },
        { periodNumber: 2, grade: 8.0, weight: 1 },
        { periodNumber: 3, grade: null, weight: 1 },
        { periodNumber: 4, grade: null, weight: 1 },
      ]
    },
    {
      id: 'sub_bio',
      name: 'Biologia',
      color: '#10B981',
      grades: [
        { periodNumber: 1, grade: 7.0, weight: 1 },
        { periodNumber: 2, grade: 7.5, weight: 1 },
        { periodNumber: 3, grade: null, weight: 1 },
        { periodNumber: 4, grade: null, weight: 1 },
      ]
    },
    {
      id: 'sub_hist',
      name: 'História',
      color: '#F59E0B',
      grades: [
        { periodNumber: 1, grade: 9.0, weight: 1 },
        { periodNumber: 2, grade: 8.5, weight: 1 },
        { periodNumber: 3, grade: null, weight: 1 },
        { periodNumber: 4, grade: null, weight: 1 },
      ]
    }
  ]
};

export function loadUserStats(): { masteryScore: number; streakDays: number; completedReviews: number } {
  if (typeof window === 'undefined') {
    return { masteryScore: 780, streakDays: 5, completedReviews: 8 };
  }
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    if (!raw) return { masteryScore: 780, streakDays: 5, completedReviews: 8 };
    return JSON.parse(raw);
  } catch {
    return { masteryScore: 780, streakDays: 5, completedReviews: 8 };
  }
}

export function saveUserStats(stats: { masteryScore: number; streakDays: number; completedReviews: number }): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar stats no localStorage:', e);
  }
}

export function loadGradebookState(): StoredGradebookState {
  if (typeof window === 'undefined') return DEFAULT_GRADEBOOK;
  try {
    const raw = localStorage.getItem(KEYS.GRADEBOOK);
    if (!raw) return DEFAULT_GRADEBOOK;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_GRADEBOOK;
  }
}

export function saveGradebookState(state: StoredGradebookState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.GRADEBOOK, JSON.stringify(state));
  } catch (e) {
    console.error('Erro ao salvar boletim:', e);
  }
}

/**
 * Identifica matérias do boletim que estão abaixo da média de corte para priorizar no estudo
 */
export function getAtRiskSubjectsFromGradebook(): {
  name: string;
  currentAverage: number;
  requiredNext: number | null;
}[] {
  const gb = loadGradebookState();
  const atRisk: { name: string; currentAverage: number; requiredNext: number | null }[] = [];

  for (const sub of gb.subjects) {
    const avg = calculateCurrentAverage(sub.grades, gb.useWeights);
    if (avg !== null && avg < gb.passingGrade) {
      const proj = calculateRequiredGradeToPass(
        gb.termSystem,
        sub.grades,
        gb.passingGrade,
        gb.useWeights
      );
      atRisk.push({
        name: sub.name,
        currentAverage: avg,
        requiredNext: proj.requiredPerRemainingPeriod,
      });
    }
  }
  return atRisk;
}

export function loadErrorNotebook(): ErrorNotebookCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.ERRORS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveErrorNotebook(cards: ErrorNotebookCard[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.ERRORS, JSON.stringify(cards));
  } catch (e) {
    console.error('Erro ao salvar caderno de erros:', e);
  }
}

export function loadAgendaEvents(): StoredAgendaEvent[] {
  const defaults: StoredAgendaEvent[] = [
    { id: 'ag_1', day: 'Hoje (Terça)', subject: 'Física', routine: 'Dia Normal', status: 'pending' },
    { id: 'ag_2', day: 'Quarta', subject: 'Matemática', routine: 'Dia Normal', status: 'pending' },
    { id: 'ag_3', day: 'Quinta', subject: 'Química', routine: 'Pré-Prova Intensivo', status: 'pending' },
    { id: 'ag_4', day: 'Sexta', subject: 'Biologia', routine: 'Revisão Relâmpago', status: 'pending' },
  ];
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(KEYS.AGENDA);
    if (!raw) return defaults;
    return JSON.parse(raw);
  } catch {
    return defaults;
  }
}

export function saveAgendaEvents(events: StoredAgendaEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.AGENDA, JSON.stringify(events));
  } catch (e) {
    console.error('Erro ao salvar agenda:', e);
  }
}
