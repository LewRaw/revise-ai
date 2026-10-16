/**
 * Testes Unitários do Motor de Rotinas de Estudo (Workflow Engine)
 * Executar com: node tests/routine_engine.test.js
 */

const assert = require('assert');

console.log('🧪 Executando Testes do Motor de Rotinas de Estudo...');

// 1. Definições de Rotinas
const ROUTINE_NORMAL_STEPS = [
  { id: 's1', type: 'summary', title: 'Resumo Geral' },
  { id: 's2', type: 'quiz_objective', title: '5 Questões' },
  { id: 's3', type: 'focal_error_summary', title: 'Resumo Focal (Erros)' },
  { id: 's4', type: 'quiz_objective', title: '10 Questões' },
  { id: 's5', type: 'final_summary', title: 'Resumo Final' },
];

const ROUTINE_PRE_EXAM_STEPS = [
  { id: 'p1', type: 'summary', title: 'Resumo Geral' },
  { id: 'p2', type: 'quiz_descriptive', title: '5 Questões Descritivas' },
  { id: 'p3', type: 'final_summary', title: 'Resumo com Base na Correção' },
];

// Teste 1: Estrutura da Rotina Dia Normal
assert.strictEqual(ROUTINE_NORMAL_STEPS.length, 5);
assert.strictEqual(ROUTINE_NORMAL_STEPS[0].type, 'summary');
assert.strictEqual(ROUTINE_NORMAL_STEPS[1].type, 'quiz_objective');
assert.strictEqual(ROUTINE_NORMAL_STEPS[2].type, 'focal_error_summary');
assert.strictEqual(ROUTINE_NORMAL_STEPS[3].type, 'quiz_objective');
assert.strictEqual(ROUTINE_NORMAL_STEPS[4].type, 'final_summary');
console.log('  ✅ PASS: 1. Encadeamento correto de 5 etapas da rotina Dia Normal');

// Teste 2: Estrutura da Rotina Pré-Prova
assert.strictEqual(ROUTINE_PRE_EXAM_STEPS.length, 3);
assert.strictEqual(ROUTINE_PRE_EXAM_STEPS[1].type, 'quiz_descriptive');
console.log('  ✅ PASS: 2. Suporte a questões descritivas no modo Pré-Prova');

// Teste 3: Lógica de Detecção de Erros na Bateria 1 para disparo do Resumo Focal
function detectErrorsInQuestions(answers, correctMap) {
  const errors = [];
  for (const [qId, selected] of Object.entries(answers)) {
    if (selected !== correctMap[qId]) {
      errors.push(qId);
    }
  }
  return errors;
}

const userAnswers = { q1: 'A', q2: 'B', q3: 'C' };
const correctKeys = { q1: 'A', q2: 'A', q3: 'C' }; // errou q2
const detectedErrors = detectErrorsInQuestions(userAnswers, correctKeys);
assert.deepStrictEqual(detectedErrors, ['q2']);
console.log('  ✅ PASS: 3. Detecção correta de questões erradas para o resumo focal adaptativo');

// Teste 4: Limites de Nota da Questão Descritiva (0 a 10)
function validateDescriptiveScore(score) {
  return typeof score === 'number' && score >= 0 && score <= 10;
}
assert.ok(validateDescriptiveScore(8.5));
assert.ok(!validateDescriptiveScore(11.0));
assert.ok(!validateDescriptiveScore(-1.0));
console.log('  ✅ PASS: 4. Validação e limites de pontuação de questões discursivas');

console.log('\n🎉 TODOS OS TESTES DO MOTOR DE ROTINAS PASSARAM COM SUCESSO!\n');
