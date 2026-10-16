/**
 * Motor FSRS (Free Spaced Repetition Scheduler) Simplificado para Caderno de Erros
 * Baseado nos benchmarks de mercado (Anki FSRS / MintDeck / Azri).
 * Calcula Estabilidade (S), Dificuldade (D) e Intervalo Ótimo de Revisão.
 */

export type FsrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface ErrorNotebookCard {
  id: string;
  questionId: string;
  subject: string;
  topic: string;
  questionText: string;
  wrongSelectedLetter: string;
  correctLetter: string;
  correctOptionText: string;
  explanation: string;
  // Parâmetros FSRS
  stability: number;   // Estabilidade da memória em dias (S)
  difficulty: number;  // Dificuldade do item de 1 a 10 (D)
  intervalDays: number;
  reps: number;
  lapses: number;
  lastReviewedAt: string;
  nextReviewAt: string;
  resolved: boolean;
}

/**
 * Cria um novo card no Caderno de Erros quando o aluno erra uma questão
 */
export function createErrorCard(params: {
  questionId: string;
  subject: string;
  topic: string;
  questionText: string;
  wrongSelectedLetter: string;
  correctLetter: string;
  correctOptionText: string;
  explanation: string;
}): ErrorNotebookCard {
  const now = new Date();
  // Primeira revisão agendada para hoje/amanhã (1 dia de estabilidade inicial)
  const nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    id: `err_${params.questionId}_${Date.now()}`,
    questionId: params.questionId,
    subject: params.subject,
    topic: params.topic,
    questionText: params.questionText,
    wrongSelectedLetter: params.wrongSelectedLetter,
    correctLetter: params.correctLetter,
    correctOptionText: params.correctOptionText,
    explanation: params.explanation,
    stability: 1.0,
    difficulty: 6.5, // Dificuldade inicial moderada-alta por ter errado
    intervalDays: 1,
    reps: 0,
    lapses: 1,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextDate.toISOString(),
    resolved: false,
  };
}

/**
 * Atualiza os parâmetros FSRS após o aluno revisar o card no Caderno de Erros
 */
export function scheduleNextFsrsReview(
  card: ErrorNotebookCard,
  rating: FsrsRating
): ErrorNotebookCard {
  const now = new Date();
  let newStability = card.stability;
  let newDifficulty = card.difficulty;
  let newReps = card.reps + 1;
  let newLapses = card.lapses;
  let resolved = false;

  switch (rating) {
    case 'again':
      // Esqueceu novamente: reduz estabilidade drasticamente e aumenta dificuldade
      newStability = Math.max(0.5, Number((card.stability * 0.5).toFixed(2)));
      newDifficulty = Math.min(10, Number((card.difficulty + 1.2).toFixed(2)));
      newLapses += 1;
      break;
    case 'hard':
      // Lembrou com esforço: crescimento conservador (1.4x)
      newStability = Number((card.stability * 1.4).toFixed(2));
      newDifficulty = Math.min(10, Number((card.difficulty + 0.4).toFixed(2)));
      break;
    case 'good':
      // Lembrou bem: crescimento padrão FSRS (~2.5x modulado pela dificuldade)
      const factorGood = Math.max(1.8, 3.2 - card.difficulty * 0.15);
      newStability = Number((card.stability * factorGood).toFixed(2));
      newDifficulty = Math.max(1, Number((card.difficulty - 0.3).toFixed(2)));
      if (newReps >= 2 && newStability >= 5) {
        resolved = true;
      }
      break;
    case 'easy':
      // Domínio completo: salto de estabilidade (~3.8x) e marca como dominado
      newStability = Number((card.stability * 3.8).toFixed(2));
      newDifficulty = Math.max(1, Number((card.difficulty - 0.8).toFixed(2)));
      resolved = true;
      break;
  }

  const intervalDays = Math.max(1, Math.round(newStability));
  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    ...card,
    stability: newStability,
    difficulty: newDifficulty,
    intervalDays,
    reps: newReps,
    lapses: newLapses,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: nextDate.toISOString(),
    resolved,
  };
}

/**
 * Filtra os cards pendentes de revisão ativa
 */
export function getActiveErrorCards(cards: ErrorNotebookCard[]): ErrorNotebookCard[] {
  return cards.filter((c) => !c.resolved);
}
