/**
 * Motor de Cálculo Universal de Boletim Escolar (Ensino Médio)
 * Suporta: Bimestral (4), Trimestral (3), Semestral (2),
 * Médias Aritméticas e Ponderadas com Pesos Customizados e Projeção de Recuperação.
 */

export type TermSystem = 'bimestral' | 'trimestral' | 'semestral';

export interface SubjectPeriodGrade {
  periodNumber: number;
  grade: number | null; // null se ainda não foi lançado
  weight?: number; // padrão 1
}

export interface SubjectGradesSummary {
  subjectId: string;
  subjectName: string;
  termSystem: TermSystem;
  passingGrade: number; // ex: 6.0 ou 7.0
  periodGrades: SubjectPeriodGrade[];
  currentAverage: number | null;
  status: 'approved' | 'at_risk' | 'in_progress' | 'failed';
  requiredNextGrade: number | null; // Quanto precisa tirar no próximo período para passar
}

export function getTotalPeriods(system: TermSystem): number {
  switch (system) {
    case 'semestral':
      return 2;
    case 'trimestral':
      return 3;
    case 'bimestral':
    default:
      return 4;
  }
}

/**
 * Calcula a média atual com base nas notas lançadas
 */
export function calculateCurrentAverage(
  grades: SubjectPeriodGrade[],
  useWeights: boolean = false
): number | null {
  const validGrades = grades.filter((g) => g.grade !== null && !isNaN(g.grade));
  if (validGrades.length === 0) return null;

  if (!useWeights) {
    const sum = validGrades.reduce((acc, curr) => acc + (curr.grade || 0), 0);
    return Number((sum / validGrades.length).toFixed(2));
  }

  let totalWeightedSum = 0;
  let totalWeights = 0;

  for (const g of validGrades) {
    const weight = g.weight && g.weight > 0 ? g.weight : 1;
    totalWeightedSum += (g.grade || 0) * weight;
    totalWeights += weight;
  }

  if (totalWeights === 0) return 0;
  return Number((totalWeightedSum / totalWeights).toFixed(2));
}

/**
 * Projeta a nota necessária no próximo período ou nos períodos restantes para atingir a meta
 */
export function calculateRequiredGradeToPass(
  termSystem: TermSystem,
  grades: SubjectPeriodGrade[],
  passingGrade: number = 6.0,
  useWeights: boolean = false,
  maxGrade: number = 10.0
): {
  requiredPerRemainingPeriod: number | null;
  isGuaranteedPass: boolean;
  isImpossible: boolean;
  message: string;
} {
  const totalPeriods = getTotalPeriods(termSystem);
  const filledGrades = grades.filter((g) => g.grade !== null && !isNaN(g.grade));
  const remainingPeriods = totalPeriods - filledGrades.length;

  if (remainingPeriods <= 0) {
    const finalAvg = calculateCurrentAverage(grades, useWeights) || 0;
    const passed = finalAvg >= passingGrade;
    return {
      requiredPerRemainingPeriod: null,
      isGuaranteedPass: passed,
      isImpossible: !passed,
      message: passed ? 'Aprovado! Ano concluído com sucesso.' : 'Abaixo da média no fechamento do ano.'
    };
  }

  if (!useWeights) {
    // Na média aritmética: (SomaDasNotasAtuais + (remainingPeriods * NotaNecessaria)) / totalPeriods = passingGrade
    const currentSum = filledGrades.reduce((acc, curr) => acc + (curr.grade || 0), 0);
    const targetTotalSum = passingGrade * totalPeriods;
    const neededSum = targetTotalSum - currentSum;

    if (neededSum <= 0) {
      return {
        requiredPerRemainingPeriod: 0,
        isGuaranteedPass: true,
        isImpossible: false,
        message: 'Aprovado antecipadamente! A soma acumulada já garante aprovação.'
      };
    }

    const requiredPerRemaining = Number((neededSum / remainingPeriods).toFixed(2));

    if (requiredPerRemaining > maxGrade) {
      return {
        requiredPerRemainingPeriod: requiredPerRemaining,
        isGuaranteedPass: false,
        isImpossible: true,
        message: `Atenção: Necessário média ${requiredPerRemaining} nos períodos restantes (excede a nota máxima de ${maxGrade}). Recuperação provável.`
      };
    }

    return {
      requiredPerRemainingPeriod: requiredPerRemaining,
      isGuaranteedPass: false,
      isImpossible: false,
      message: `Você precisa de média ${requiredPerRemaining} nos próximos ${remainingPeriods} período(s) para atingir ${passingGrade.toFixed(1)}.`
    };
  }

  // Com Pesos Ponderados
  let currentWeightedSum = 0;
  let filledWeights = 0;
  for (const g of filledGrades) {
    const w = g.weight && g.weight > 0 ? g.weight : 1;
    currentWeightedSum += (g.grade || 0) * w;
    filledWeights += w;
  }

  // Supondo pesos restantes definidos ou peso 1 por período
  let remainingWeights = 0;
  for (let i = filledGrades.length + 1; i <= totalPeriods; i++) {
    const targetPeriod = grades.find((g) => g.periodNumber === i);
    remainingWeights += targetPeriod?.weight && targetPeriod.weight > 0 ? targetPeriod.weight : 1;
  }

  const totalWeights = filledWeights + remainingWeights;
  const targetWeightedSum = passingGrade * totalWeights;
  const neededWeightedSum = targetWeightedSum - currentWeightedSum;

  if (neededWeightedSum <= 0) {
    return {
      requiredPerRemainingPeriod: 0,
      isGuaranteedPass: true,
      isImpossible: false,
      message: 'Aprovado antecipadamente pela média ponderada!'
    };
  }

  const requiredPerRemaining = Number((neededWeightedSum / remainingWeights).toFixed(2));

  if (requiredPerRemaining > maxGrade) {
    return {
      requiredPerRemainingPeriod: requiredPerRemaining,
      isGuaranteedPass: false,
      isImpossible: true,
      message: `Necessário média ponderada de ${requiredPerRemaining} (excede o limite de ${maxGrade}).`
    };
  }

  return {
    requiredPerRemainingPeriod: requiredPerRemaining,
    isGuaranteedPass: false,
    isImpossible: false,
    message: `Você precisa de ${requiredPerRemaining} nos períodos restantes para atingir média ${passingGrade.toFixed(1)}.`
  };
}
