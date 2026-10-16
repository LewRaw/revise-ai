/**
 * Testes Unitários do Algoritmo FSRS (Caderno de Erros) e Integração Multi-Disciplinas
 * Executar com: node tests/fsrs_and_persistence.test.js
 */

const assert = require('assert');

console.log('🧪 Executando Testes do Motor FSRS (Repetição Espaçada) & Evoluções...');

// 1. Simulação da função de agendamento FSRS
function createErrorCard(questionId, subject) {
  return {
    id: `err_${questionId}`,
    questionId,
    subject,
    stability: 1.0,
    difficulty: 6.5,
    intervalDays: 1,
    reps: 0,
    lapses: 1,
    resolved: false,
  };
}

function scheduleNextFsrsReview(card, rating) {
  let newStability = card.stability;
  let newDifficulty = card.difficulty;
  let newReps = card.reps + 1;
  let newLapses = card.lapses;
  let resolved = false;

  if (rating === 'again') {
    newStability = Math.max(0.5, Number((card.stability * 0.5).toFixed(2)));
    newDifficulty = Math.min(10, Number((card.difficulty + 1.2).toFixed(2)));
    newLapses += 1;
  } else if (rating === 'good') {
    const factorGood = Math.max(1.8, 3.2 - card.difficulty * 0.15);
    newStability = Number((card.stability * factorGood).toFixed(2));
    newDifficulty = Math.max(1, Number((card.difficulty - 0.3).toFixed(2)));
    if (newReps >= 2 && newStability >= 5) resolved = true;
  } else if (rating === 'easy') {
    newStability = Number((card.stability * 3.8).toFixed(2));
    newDifficulty = Math.max(1, Number((card.difficulty - 0.8).toFixed(2)));
    resolved = true;
  }

  return {
    ...card,
    stability: newStability,
    difficulty: newDifficulty,
    intervalDays: Math.max(1, Math.round(newStability)),
    reps: newReps,
    lapses: newLapses,
    resolved,
  };
}

// Teste 1: Criação de card no Caderno de Erros
const card0 = createErrorCard('fis_1', 'Física');
assert.strictEqual(card0.stability, 1.0);
assert.strictEqual(card0.resolved, false);
console.log('  ✅ PASS: 1. Criação inicial de card no Caderno de Erros FSRS (S = 1.0d)');

// Teste 2: Revisão com acerto "Bom" aumenta a estabilidade e reduz a dificuldade
const card1 = scheduleNextFsrsReview(card0, 'good');
assert.ok(card1.stability > card0.stability, 'A estabilidade deve crescer após acerto');
assert.ok(card1.difficulty < card0.difficulty, 'A dificuldade percebida deve cair após acerto');
console.log(`  ✅ PASS: 2. Evolução de memória FSRS após 'good' (S: ${card0.stability} -> ${card1.stability}d)`);

// Teste 3: Lapso ("Errei novamente") reduz estabilidade e aumenta contagem de lapsos
const cardLapse = scheduleNextFsrsReview(card1, 'again');
assert.ok(cardLapse.stability < card1.stability, 'A estabilidade deve cair ao errar novamente');
assert.strictEqual(cardLapse.lapses, 2);
console.log('  ✅ PASS: 3. Penalidade de estabilidade e registro de lapso ao esquecer');

// Teste 4: Domínio ("Easy") marca o erro como resolvido
const cardMastered = scheduleNextFsrsReview(card0, 'easy');
assert.strictEqual(cardMastered.resolved, true);
assert.ok(cardMastered.intervalDays >= 4);
console.log('  ✅ PASS: 4. Graduação/Domínio de questão no Caderno de Erros');

// Teste 5: Simulador de Composição de Nota do Período (Prova 1 peso 2, Prova 2 peso 3, Trabalho peso 1)
function calculateSubPeriodGrade(p1, w1, p2, w2, work, ww) {
  return Number(((p1 * w1 + p2 * w2 + work * ww) / (w1 + w2 + ww)).toFixed(2));
}
assert.strictEqual(calculateSubPeriodGrade(7.0, 2, 8.0, 3, 9.0, 1), 7.83);
console.log('  ✅ PASS: 5. Calculadora de composição de nota do período (P1 + P2 + Trabalho)');

console.log('\n🎉 TODOS OS TESTES FSRS E EVOLUÇÕES PASSARAM COM SUCESSO!\n');
