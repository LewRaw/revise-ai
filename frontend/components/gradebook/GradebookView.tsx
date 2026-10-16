'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  TrendingUp, 
  Sliders,
  Scale,
  Calculator
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { 
  TermSystem, 
  SubjectPeriodGrade, 
  calculateCurrentAverage, 
  calculateRequiredGradeToPass, 
  getTotalPeriods 
} from '@/lib/gradeCalculations';
import {
  loadGradebookState,
  saveGradebookState,
  StoredSubjectEntry,
} from '@/lib/storageService';

export const GradebookView: React.FC = () => {
  const { showToast } = useToast();

  const [termSystem, setTermSystem] = useState<TermSystem>('bimestral');
  const [passingGrade, setPassingGrade] = useState<number>(6.0);
  const [useWeights, setUseWeights] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<StoredSubjectEntry[]>([]);

  // Calculadora rápida de composição de nota do período (Prova 1 + Prova 2 + Trabalho)
  const [showSubCalc, setShowSubCalc] = useState<boolean>(false);
  const [p1Grade, setP1Grade] = useState<string>('7.0');
  const [p1Weight, setP1Weight] = useState<string>('2');
  const [p2Grade, setP2Grade] = useState<string>('8.0');
  const [p2Weight, setP2Weight] = useState<string>('3');
  const [workGrade, setWorkGrade] = useState<string>('9.0');
  const [workWeight, setWorkWeight] = useState<string>('1');

  useEffect(() => {
    const saved = loadGradebookState();
    setTermSystem(saved.termSystem);
    setPassingGrade(saved.passingGrade);
    setUseWeights(saved.useWeights);
    setSubjects(saved.subjects);
  }, []);

  const persistState = (
    nextSystem: TermSystem,
    nextPassing: number,
    nextWeights: boolean,
    nextSubjects: StoredSubjectEntry[]
  ) => {
    saveGradebookState({
      termSystem: nextSystem,
      passingGrade: nextPassing,
      useWeights: nextWeights,
      subjects: nextSubjects,
    });
  };

  const totalPeriods = getTotalPeriods(termSystem);

  const handleGradeChange = (
    subjectId: string, 
    periodNum: number, 
    valueStr: string
  ) => {
    const parsedVal = valueStr === '' ? null : parseFloat(valueStr);
    if (parsedVal !== null && (isNaN(parsedVal) || parsedVal < 0 || parsedVal > 10)) {
      showToast('Digite uma nota válida entre 0 e 10.', 'error');
      return;
    }

    const updated = subjects.map((subj) => {
      if (subj.id !== subjectId) return subj;
      const updatedGrades = subj.grades.map((g) =>
        g.periodNumber === periodNum ? { ...g, grade: parsedVal } : g
      );
      return { ...subj, grades: updatedGrades };
    });

    setSubjects(updated);
    persistState(termSystem, passingGrade, useWeights, updated);
  };

  const handleWeightChange = (
    subjectId: string,
    periodNum: number,
    weightStr: string
  ) => {
    const parsedWeight = parseFloat(weightStr) || 1;
    const updated = subjects.map((subj) => {
      if (subj.id !== subjectId) return subj;
      const updatedGrades = subj.grades.map((g) =>
        g.periodNumber === periodNum ? { ...g, weight: parsedWeight } : g
      );
      return { ...subj, grades: updatedGrades };
    });

    setSubjects(updated);
    persistState(termSystem, passingGrade, useWeights, updated);
  };

  const handleSystemChange = (newSys: TermSystem) => {
    setTermSystem(newSys);
    const newTotal = getTotalPeriods(newSys);

    const updated = subjects.map((subj) => {
      const adjustedGrades: SubjectPeriodGrade[] = [];
      for (let i = 1; i <= newTotal; i++) {
        const existing = subj.grades.find((g) => g.periodNumber === i);
        adjustedGrades.push(existing || { periodNumber: i, grade: null, weight: 1 });
      }
      return { ...subj, grades: adjustedGrades };
    });

    setSubjects(updated);
    persistState(newSys, passingGrade, useWeights, updated);
    showToast(`Boletim ajustado para regime ${newSys} e salvo.`, 'info');
  };

  const handlePassingGradeChange = (val: number) => {
    setPassingGrade(val);
    persistState(termSystem, val, useWeights, subjects);
    showToast(`Média de corte atualizada para ${val.toFixed(1)}.`, 'info');
  };

  const handleToggleWeights = () => {
    const nextW = !useWeights;
    setUseWeights(nextW);
    persistState(termSystem, passingGrade, nextW, subjects);
    showToast(
      nextW ? 'Modo: Média Ponderada com pesos ativada' : 'Modo: Média Aritmética simples',
      'info'
    );
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      showToast('Informe o nome da disciplina.', 'error');
      return;
    }
    const id = `sub_${Date.now()}`;
    const initialGrades: SubjectPeriodGrade[] = [];
    for (let i = 1; i <= totalPeriods; i++) {
      initialGrades.push({ periodNumber: i, grade: null, weight: 1 });
    }

    const updated = [
      ...subjects,
      {
        id,
        name: newSubjectName.trim(),
        color: '#11C76F',
        grades: initialGrades,
      },
    ];

    setSubjects(updated);
    persistState(termSystem, passingGrade, useWeights, updated);
    setNewSubjectName('');
    setShowAddSubjectModal(false);
    showToast(`Disciplina "${newSubjectName}" adicionada ao boletim!`, 'success');
  };

  // Cálculo da Calculadora de Provas + Trabalhos do Bimestre
  const subCalcResult = (() => {
    const n1 = parseFloat(p1Grade) || 0;
    const w1 = parseFloat(p1Weight) || 1;
    const n2 = parseFloat(p2Grade) || 0;
    const w2 = parseFloat(p2Weight) || 1;
    const nw = parseFloat(workGrade) || 0;
    const ww = parseFloat(workWeight) || 1;
    const totalW = w1 + w2 + ww;
    return totalW > 0 ? ((n1 * w1 + n2 * w2 + nw * ww) / totalW).toFixed(2) : '0.00';
  })();

  const onTrackCount = subjects.filter((s) => {
    const avg = calculateCurrentAverage(s.grades, useWeights);
    return avg === null || avg >= passingGrade;
  }).length;
  const atRiskCount = subjects.length - onTrackCount;

  return (
    <section className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header do Boletim */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141414] border border-[#262626]">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#11C76F]" />
            <h2 className="text-base font-bold text-white">Boletim Escolar Universal</h2>
          </div>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            {onTrackCount} na meta • {atRiskCount > 0 ? `${atRiskCount} precisando de reforço` : '0 em risco'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSubCalc(!showSubCalc)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-white hover:text-[#11C76F] active:scale-95 transition-all min-h-[40px]"
            aria-label="Calculadora de Provas e Trabalhos"
          >
            <Calculator className="w-3.5 h-3.5 text-[#11C76F]" />
            <span className="hidden xs:inline">Compor Nota</span>
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-white hover:text-[#11C76F] active:scale-95 transition-all min-h-[40px]"
            aria-label="Configurar regras do boletim"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Regras</span>
          </button>
        </div>
      </div>

      {/* Calculadora de Sub-notas do Período (Prova 1, Prova 2, Trabalho) */}
      {showSubCalc && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#11C76F]/30 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#11C76F] uppercase">
              🧮 Simulador de Nota do Período (Provas + Trabalhos)
            </span>
            <span className="text-xs font-extrabold text-white bg-[#11C76F]/10 border border-[#11C76F]/30 px-2.5 py-1 rounded-lg">
              Média Final: {subCalcResult}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] space-y-1">
              <span className="text-[11px] text-[#8E8E93] block">Prova 1 (Nota / Peso)</span>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={p1Grade}
                  onChange={(e) => setP1Grade(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] text-white text-center rounded-lg py-1.5 min-h-[36px]"
                />
                <input
                  type="number"
                  value={p1Weight}
                  onChange={(e) => setP1Weight(e.target.value)}
                  className="w-12 bg-[#141414] border border-[#262626] text-[#8E8E93] text-center rounded-lg py-1.5 min-h-[36px]"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] space-y-1">
              <span className="text-[11px] text-[#8E8E93] block">Prova 2 (Nota / Peso)</span>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={p2Grade}
                  onChange={(e) => setP2Grade(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] text-white text-center rounded-lg py-1.5 min-h-[36px]"
                />
                <input
                  type="number"
                  value={p2Weight}
                  onChange={(e) => setP2Weight(e.target.value)}
                  className="w-12 bg-[#141414] border border-[#262626] text-[#8E8E93] text-center rounded-lg py-1.5 min-h-[36px]"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] space-y-1">
              <span className="text-[11px] text-[#8E8E93] block">Trabalho (Nota / Peso)</span>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={workGrade}
                  onChange={(e) => setWorkGrade(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] text-white text-center rounded-lg py-1.5 min-h-[36px]"
                />
                <input
                  type="number"
                  value={workWeight}
                  onChange={(e) => setWorkWeight(e.target.value)}
                  className="w-12 bg-[#141414] border border-[#262626] text-[#8E8E93] text-center rounded-lg py-1.5 min-h-[36px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Painel de Configurações das Regras Escolares */}
      {showConfig && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-4 animate-in slide-in-from-top-2">
          <div className="text-xs font-semibold text-white uppercase tracking-wider">
            ⚙️ Personalize o Sistema da sua Escola
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Regime do Ano */}
            <div>
              <label className="text-xs text-[#8E8E93] block mb-1">Divisão do Ano</label>
              <select
                value={termSystem}
                onChange={(e) => handleSystemChange(e.target.value as TermSystem)}
                className="w-full bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-3 py-2.5 text-xs min-h-[44px] focus:outline-none focus:border-[#11C76F]"
              >
                <option value="bimestral">Bimestral (4 Bimestres)</option>
                <option value="trimestral">Trimestral (3 Trimestres)</option>
                <option value="semestral">Semestral (2 Semestres)</option>
              </select>
            </div>

            {/* Média de Corte */}
            <div>
              <label className="text-xs text-[#8E8E93] block mb-1">Média Mínima para Passar</label>
              <select
                value={passingGrade}
                onChange={(e) => handlePassingGradeChange(parseFloat(e.target.value))}
                className="w-full bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-3 py-2.5 text-xs min-h-[44px] focus:outline-none focus:border-[#11C76F]"
              >
                <option value="5.0">5.0 (Recuperação facilitada)</option>
                <option value="6.0">6.0 (Padrão maioria das escolas)</option>
                <option value="7.0">7.0 (Padrão escolas particulares/federais)</option>
                <option value="8.0">8.0 (Alta exigência)</option>
              </select>
            </div>

            {/* Modelo de Média */}
            <div>
              <label className="text-xs text-[#8E8E93] block mb-1">Cálculo de Média</label>
              <button
                onClick={handleToggleWeights}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all min-h-[44px] ${
                  useWeights 
                    ? 'bg-[#11C76F]/10 border-[#11C76F] text-[#11C76F]' 
                    : 'bg-[#1C1C1C] border-[#262626] text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{useWeights ? 'Pesos Ponderados' : 'Média Simples'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Disciplinas do Boletim */}
      <div className="space-y-3">
        {subjects.map((subj) => {
          const currentAvg = calculateCurrentAverage(subj.grades, useWeights);
          const projection = calculateRequiredGradeToPass(
            termSystem,
            subj.grades,
            passingGrade,
            useWeights
          );

          let statusBadgeClass = 'bg-[#1C1C1C] text-[#8E8E93] border-[#262626]';
          let statusText = 'Em andamento';

          if (currentAvg !== null) {
            if (projection.isGuaranteedPass) {
              statusBadgeClass = 'bg-[#11C76F]/10 text-[#11C76F] border-[#11C76F]/30';
              statusText = 'Aprovado Direto 🎉';
            } else if (projection.isImpossible) {
              statusBadgeClass = 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30';
              statusText = 'Risco Alto (Recuperação)';
            } else if (currentAvg >= passingGrade) {
              statusBadgeClass = 'bg-[#11C76F]/10 text-[#11C76F] border-[#11C76F]/30';
              statusText = 'Dentro da Meta';
            } else {
              statusBadgeClass = 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30';
              statusText = 'Atenção';
            }
          }

          return (
            <div
              key={subj.id}
              className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: subj.color }} 
                  />
                  <span className="text-sm font-bold text-white">{subj.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                    {statusText}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-[#8E8E93] mr-1">Média:</span>
                    <span className={`text-sm font-extrabold ${
                      currentAvg !== null && currentAvg >= passingGrade ? 'text-[#11C76F]' : 'text-white'
                    }`}>
                      {currentAvg !== null ? currentAvg.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inputs dos Períodos (Bimestres / Trimestres) */}
              <div className={`grid gap-2 ${
                totalPeriods === 2 ? 'grid-cols-2' : totalPeriods === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
              }`}>
                {subj.grades.slice(0, totalPeriods).map((g) => (
                  <div key={g.periodNumber} className="p-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626]">
                    <div className="flex items-center justify-between text-[11px] text-[#8E8E93] mb-1">
                      <span>{g.periodNumber}º {termSystem === 'bimestral' ? 'Bim' : termSystem === 'trimestral' ? 'Trim' : 'Sem'}</span>
                      {useWeights && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">P:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={g.weight || 1}
                            onChange={(e) => handleWeightChange(subj.id, g.periodNumber, e.target.value)}
                            className="w-7 text-center bg-[#141414] border border-[#262626] text-[10px] text-white rounded focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="Nota"
                      value={g.grade !== null ? g.grade : ''}
                      onChange={(e) => handleGradeChange(subj.id, g.periodNumber, e.target.value)}
                      className="w-full bg-[#141414] border border-[#262626] text-white font-bold text-center text-sm rounded-lg py-2 min-h-[44px] focus:outline-none focus:border-[#11C76F]"
                    />
                  </div>
                ))}
              </div>

              {/* Mensagem da Calculadora Inteligente de Aprovação */}
              <div className="p-2.5 rounded-xl bg-[#1C1C1C]/60 border border-[#262626] flex items-start gap-2 text-xs">
                <TrendingUp className="w-4 h-4 text-[#11C76F] shrink-0 mt-0.5" />
                <span className="text-[#8E8E93] leading-relaxed">
                  {projection.message}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão de Adicionar Disciplina */}
      <button
        onClick={() => setShowAddSubjectModal(true)}
        className="w-full py-3.5 px-4 rounded-xl border border-dashed border-[#262626] hover:border-[#11C76F]/50 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[48px] bg-[#141414]/40"
      >
        <Plus className="w-4 h-4 text-[#11C76F]" />
        <span>Adicionar Nova Disciplina ao Boletim</span>
      </button>

      {/* Modal Simples de Criação de Matéria */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#141414] border border-[#262626] p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Nova Disciplina</h3>
            <input
              type="text"
              placeholder="Ex: Sociologia, Filosofia, Literatura..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-3 py-2.5 text-xs min-h-[44px] focus:outline-none focus:border-[#11C76F]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-white min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSubject}
                className="flex-1 py-2.5 rounded-xl bg-[#11C76F] text-black font-semibold text-xs min-h-[44px]"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
