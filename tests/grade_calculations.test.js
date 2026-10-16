/**
 * Testes Unitários de Cálculo do Boletim Escolar Universal
 * Executar com: node tests/grade_calculations.test.js
 */

const assert = require('assert');

// 1. Simulação das funções puras de gradeCalculations
function getTotalPeriods(system) {
  switch (system) {
    case 'semestral': return 2;
    case 'trimestral': return 3;
    case 'bimestral':
    default: return 4;
  }
}

function calculateCurrentAverage(grades, useWeights = false) {
  const valid = grades.filter((g) => g.grade !== null && !isNaN(g.grade));
  if (valid.length === 0) return null;

  if (!useWeights) {
    const sum = valid.reduce((acc, curr) => acc + curr.grade, 0);
    return Number((sum / valid.length).toFixed(2));
  }

  let totalWeightedSum = 0;
  let totalWeights = 0;
  for (const g of valid) {
    const w = g.weight && g.weight > 0 ? g.weight : 1;
    totalWeightedSum += g.grade * w;
    totalWeights += w;
  }
  return totalWeights === 0 ? 0 : Number((totalWeightedSum / totalWeights).toFixed(2));
}

function calculateRequiredGradeToPass(termSystem, grades, passingGrade = 6.0, useWeights = false, maxGrade = 10.0) {
  const totalPeriods = getTotalPeriods(termSystem);
  const filledGrades = grades.filter((g) => g.grade !== null && !isNaN(g.grade));
  const remainingPeriods = totalPeriods - filledGrades.length;

  if (remainingPeriods <= 0) {
    const finalAvg = calculateCurrentAverage(grades, useWeights) || 0;
    const passed = finalAvg >= passingGrade;
    return { isGuaranteedPass: passed, isImpossible: !passed, requiredPerRemaining: null };
  }

  if (!useWeights) {
    const currentSum = filledGrades.reduce((acc, curr) => acc + curr.grade, 0);
    const targetTotalSum = passingGrade * totalPeriods;
    const neededSum = targetTotalSum - currentSum;

    if (neededSum <= 0) {
      return { isGuaranteedPass: true, isImpossible: false, requiredPerRemaining: 0 };
    }

    const requiredPerRemaining = Number((neededSum / remainingPeriods).toFixed(2));
    if (requiredPerRemaining > maxGrade) {
      return { isGuaranteedPass: false, isImpossible: true, requiredPerRemaining };
    }

    return { isGuaranteedPass: false, isImpossible: false, requiredPerRemaining };
  }

  // Com Pesos
  let currentWeightedSum = 0;
  let filledWeights = 0;
  for (const g of filledGrades) {
    const w = g.weight && g.weight > 0 ? g.weight : 1;
    currentWeightedSum += g.grade * w;
    filledWeights += w;
  }

  let remainingWeights = 0;
  for (let i = filledGrades.length + 1; i <= totalPeriods; i++) {
    const targetPeriod = grades.find((g) => g.periodNumber === i);
    remainingWeights += targetPeriod?.weight && targetPeriod.weight > 0 ? targetPeriod.weight : 1;
  }

  const totalWeights = filledWeights + remainingWeights;
  const targetWeightedSum = passingGrade * totalWeights;
  const neededWeightedSum = targetWeightedSum - currentWeightedSum;

  if (neededWeightedSum <= 0) {
    return { isGuaranteedPass: true, isImpossible: false, requiredPerRemaining: 0 };
  }

  const requiredPerRemaining = Number((neededWeightedSum / remainingWeights).toFixed(2));
  if (requiredPerRemaining > maxGrade) {
    return { isGuaranteedPass: false, isImpossible: true, requiredPerRemaining };
  }

  return { isGuaranteedPass: false, isImpossible: false, requiredPerRemaining };
}

console.log('🧪 Executando Testes do Boletim Escolar Universal...');

// Teste 1: Total de períodos
assert.strictEqual(getTotalPeriods('bimestral'), 4);
assert.strictEqual(getTotalPeriods('trimestral'), 3);
assert.strictEqual(getTotalPeriods('semestral'), 2);
console.log('  ✅ PASS: 1. Mapeamento de períodos (bimestral, trimestral, semestral)');

// Teste 2: Média simples bimestral (7.0 e 5.0 -> 6.0)
const bimGrades = [{ periodNumber: 1, grade: 7.0 }, { periodNumber: 2, grade: 5.0 }];
assert.strictEqual(calculateCurrentAverage(bimGrades, false), 6.0);
console.log('  ✅ PASS: 2. Média simples bimestral');

// Teste 3: Média ponderada com pesos (peso 1 com nota 6.0, peso 2 com nota 9.0 -> (6 + 18)/3 = 8.0)
const weightedGrades = [
  { periodNumber: 1, grade: 6.0, weight: 1 },
  { periodNumber: 2, grade: 9.0, weight: 2 }
];
assert.strictEqual(calculateCurrentAverage(weightedGrades, true), 8.0);
console.log('  ✅ PASS: 3. Média ponderada com pesos customizados');

// Teste 4: Projeção de nota para passar (Bimestral, meta 6.0, tirou 7.0 e 5.0 nos bimestres 1 e 2)
// Total necessário para passar com média 6.0 em 4 bimestres = 24.0. Já tem 12.0. Faltam 12.0 em 2 bimestres -> 6.0 em cada.
const proj = calculateRequiredGradeToPass('bimestral', bimGrades, 6.0, false);
assert.strictEqual(proj.requiredPerRemaining, 6.0);
assert.strictEqual(proj.isGuaranteedPass, false);
assert.strictEqual(proj.isImpossible, false);
console.log('  ✅ PASS: 4. Projeção de nota necessária no próximo período');

// Teste 5: Aprovação antecipada garantida (Já tirou 10.0, 10.0 e 10.0 com meta 6.0 em 4 bimestres -> 30 pontos acumulados > 24)
const highGrades = [{ periodNumber: 1, grade: 10.0 }, { periodNumber: 2, grade: 10.0 }, { periodNumber: 3, grade: 10.0 }];
const projHigh = calculateRequiredGradeToPass('bimestral', highGrades, 6.0, false);
assert.strictEqual(projHigh.isGuaranteedPass, true);
assert.strictEqual(projHigh.requiredPerRemaining, 0);
console.log('  ✅ PASS: 5. Reconhecimento de aprovação antecipada (isGuaranteedPass)');

// Teste 6: Caso de recuperação matemática (> 10.0 necessário)
const failGrades = [{ periodNumber: 1, grade: 1.0 }, { periodNumber: 2, grade: 1.0 }, { periodNumber: 3, grade: 1.0 }];
// Precisa de 24. Tem 3. Falta 21 em 1 bimestre -> 21.0 > 10.0
const projFail = calculateRequiredGradeToPass('bimestral', failGrades, 6.0, false);
assert.strictEqual(projFail.isImpossible, true);
console.log('  ✅ PASS: 6. Detecção precisa de risco de recuperação impossível de reverter');

console.log('\n🎉 TODOS OS TESTES DO BOLETIM PASSARAM COM SUCESSO!\n');
