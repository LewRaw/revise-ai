'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Calendar, 
  Sparkles, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Plus, 
  Flame,
  AlertTriangle,
  Sliders,
  Trash2
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { RoutinePlayerModal, RoutineStepDef } from './RoutinePlayerModal';
import { 
  loadAgendaEvents, 
  saveAgendaEvents, 
  StoredAgendaEvent, 
  getAtRiskSubjectsFromGradebook 
} from '@/lib/storageService';

export interface StudyRoutinePreset {
  id: string;
  title: string;
  tag: string;
  estimatedMinutes: number;
  description: string;
  steps: RoutineStepDef[];
}

interface RoutineManagerProps {
  onScoreGain: (points: number) => void;
}

const AVAILABLE_STEP_BLOCKS: { type: RoutineStepDef['type']; label: string; desc: string }[] = [
  { type: 'summary', label: 'Resumo Geral Conceitual', desc: 'Leitura estruturada dos conceitos e fórmulas do tópico.' },
  { type: 'quiz_objective', label: 'Bateria de Questões Objetivas', desc: 'Questões de múltipla escolha com gabarito comentado.' },
  { type: 'focal_error_summary', label: 'Resumo Focal nos Erros (IA)', desc: 'Intervenção inteligente focada apenas nas questões erradas.' },
  { type: 'quiz_descriptive', label: 'Questões Descritivas (Voz/Texto)', desc: 'Questão dissertativa avaliada pelo espelho de correção da IA.' },
  { type: 'final_summary', label: 'Resumo Final & Checklist', desc: 'Fechamento de retenção e consolidação de pontos TRI.' },
];

export const RoutineManager: React.FC<RoutineManagerProps> = ({ onScoreGain }) => {
  const { showToast } = useToast();
  const {
    currentUser,
    userSubjects,
    activeSubject,
    activeTopic,
    setActiveSubject,
    setActiveTopic,
  } = useAuth();

  const [activeRoutine, setActiveRoutine] = useState<StudyRoutinePreset | null>(null);
  const selectedSubject = activeSubject;
  const setSelectedSubject = setActiveSubject;
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGeneratingAiRoutine, setIsGeneratingAiRoutine] = useState<boolean>(false);

  // Estado do Construtor Manual de Rotinas
  const [showBuilderModal, setShowBuilderModal] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customMinutes, setCustomMinutes] = useState<number>(40);
  const [customSteps, setCustomSteps] = useState<RoutineStepDef[]>([
    { id: 'cs_1', title: 'Resumo Geral Conceitual', type: 'summary', description: 'Leitura inicial dos conceitos.' },
    { id: 'cs_2', title: '5 Questões Objetivas', type: 'quiz_objective', description: 'Bateria diagnóstica.' },
    { id: 'cs_3', title: 'Resumo Focal nos Erros (IA)', type: 'focal_error_summary', description: 'Correção de lacunas.' },
    { id: 'cs_4', title: 'Resumo Final & Checklist', type: 'final_summary', description: 'Fechamento da sessão.' },
  ]);

  // Matérias em risco vindas do Boletim
  const [atRiskSubjects, setAtRiskSubjects] = useState<
    { name: string; currentAverage: number; requiredNext: number | null }[]
  >([]);

  // Rotinas Padrão (Dia Normal, Pré-Prova e Revisão Relâmpago)
  const [presets, setPresets] = useState<StudyRoutinePreset[]>([
    {
      id: 'routine_normal',
      title: 'Dia Normal',
      tag: 'Mais Usada',
      estimatedMinutes: 45,
      description: 'Resumo Geral -> 5 Questões -> Resumo Focal (Erros) -> 10 Questões -> Resumo Final.',
      steps: [
        { id: 's1', title: 'Resumo Geral Conceitual', type: 'summary', description: 'Leitura rápida dos princípios fundamentais e fórmulas centrais do tópico.' },
        { id: 's2', title: 'Primeira Bateria: 5 Questões Objetivas', type: 'quiz_objective', description: 'Teste diagnóstico de aquecimento para identificar pontos cegos.' },
        { id: 's3', title: 'Resumo Focal Baseado nos Erros (IA)', type: 'focal_error_summary', description: 'A IA analisa os erros da bateria anterior e sintetiza a explicação das dúvidas.' },
        { id: 's4', title: 'Segunda Bateria: 10 Questões de Fixação', type: 'quiz_objective', description: 'Aprofundamento com questões estilo ENEM para consolidação de memória de longo prazo.' },
        { id: 's5', title: 'Resumo Final & Checklist de Domínio', type: 'final_summary', description: 'Fechamento da sessão e ganho de pontuação no Score TRI.' },
      ]
    },
    {
      id: 'routine_pre_exam',
      title: 'Pré-Prova Intensivo',
      tag: 'Véspera de Prova',
      estimatedMinutes: 60,
      description: 'Resumo Geral -> 5 Questões Descritivas -> Resumo com Base em Correção.',
      steps: [
        { id: 'p1', title: 'Resumo Geral Aprofundado', type: 'summary', description: 'Revisão das pegadinhas mais comuns em provas e relações interdisciplinares.' },
        { id: 'p2', title: '5 Questões Descritivas / Dissertativas', type: 'quiz_descriptive', description: 'O aluno digita ou grava sua justificativa para a IA avaliar o espelho de correção.' },
        { id: 'p3', title: 'Resumo com Base na Correção da IA', type: 'final_summary', description: 'Feedback detalhado dos critérios de avaliação e palavras-chave que garantem a nota máxima.' },
      ]
    },
    {
      id: 'routine_flash',
      title: 'Revisão Relâmpago',
      tag: '15 Minutos',
      estimatedMinutes: 15,
      description: 'Resumo Flash -> 3 Questões Rápidas -> Conclusão.',
      steps: [
        { id: 'f1', title: 'Síntese Flash em Tópicos', type: 'summary', description: 'Relembre os conceitos fundamentais do dia.' },
        { id: 'f2', title: '3 Questões Objetivas', type: 'quiz_objective', description: 'Validação imediata de retenção.' },
        { id: 'f3', title: 'Fechamento da Ofensiva', type: 'final_summary', description: 'Garante o dia na sua sequência de estudos diária.' },
      ]
    }
  ]);

  // Agenda da Semana Persistente
  const [scheduledDays, setScheduledDays] = useState<StoredAgendaEvent[]>([]);
  const [newAgendaDay, setNewAgendaDay] = useState<string>('Sábado');
  const [newAgendaRoutine, setNewAgendaRoutine] = useState<string>('Dia Normal');

  useEffect(() => {
    setScheduledDays(loadAgendaEvents(currentUser.id));
    setAtRiskSubjects(getAtRiskSubjectsFromGradebook(currentUser.id));
  }, [currentUser.id]);

  const handleStartRoutine = (preset: StudyRoutinePreset) => {
    setActiveRoutine(preset);
    setIsPlayerOpen(true);
  };

  const handleToggleAgendaStatus = (id: string) => {
    const updated = scheduledDays.map((item) =>
      item.id === id
        ? { ...item, status: (item.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' }
        : item
    );
    setScheduledDays(updated);
    saveAgendaEvents(updated, currentUser.id);
    showToast('Status da agenda atualizado!', 'success');
  };

  const handleAddAgendaEvent = () => {
    const newItem: StoredAgendaEvent = {
      id: `ag_${Date.now()}`,
      day: newAgendaDay,
      subject: selectedSubject,
      routine: newAgendaRoutine,
      status: 'pending',
    };
    const updated = [...scheduledDays, newItem];
    setScheduledDays(updated);
    saveAgendaEvents(updated, currentUser.id);
    showToast(`Sessão de ${selectedSubject} agendada para ${newAgendaDay}!`, 'success');
  };

  const handleSaveCustomRoutine = () => {
    if (!customTitle.trim()) {
      showToast('Dê um nome para sua rotina personalizada.', 'error');
      return;
    }
    if (customSteps.length === 0) {
      showToast('Adicione pelo menos 1 etapa na rotina.', 'error');
      return;
    }

    const created: StudyRoutinePreset = {
      id: `custom_${Date.now()}`,
      title: customTitle.trim(),
      tag: 'Customizada',
      estimatedMinutes: customMinutes,
      description: customSteps.map((s) => s.title).join(' -> '),
      steps: customSteps,
    };

    setPresets((prev) => [created, ...prev]);
    setCustomTitle('');
    setShowBuilderModal(false);
    showToast(`Rotina "${created.title}" criada com sucesso!`, 'success');
  };

  const handleGenerateAiRoutine = () => {
    if (!aiPrompt.trim()) {
      showToast('Descreva quanto tempo você tem ou qual matéria quer focar.', 'error');
      return;
    }
    setIsGeneratingAiRoutine(true);
    showToast('A inteligência artificial está desenhando a melhor rotina...', 'info');

    setTimeout(() => {
      setIsGeneratingAiRoutine(false);
      const isExam = aiPrompt.toLowerCase().includes('prova') || aiPrompt.toLowerCase().includes('teste');
      const customPreset: StudyRoutinePreset = {
        id: `routine_ai_${Date.now()}`,
        title: `IA: ${selectedSubject} (${isExam ? 'Foco Prova' : 'Foco Erros'})`,
        tag: 'Gerada por IA',
        estimatedMinutes: 35,
        description: `Rotina adaptativa criada para: "${aiPrompt}".`,
        steps: isExam
          ? [
              { id: 'ai1', title: 'Resumo Geral Aprofundado', type: 'summary', description: 'Síntese dos tópicos que mais caem em prova.' },
              { id: 'ai2', title: 'Questão Dissertativa com IA', type: 'quiz_descriptive', description: 'Treino de argumentação escrita ou falada.' },
              { id: 'ai3', title: 'Bateria de Questões Objetivas', type: 'quiz_objective', description: 'Fixação rápida de múltipla escolha.' },
              { id: 'ai4', title: 'Resumo Final & Checklist', type: 'final_summary', description: 'Consolidação pré-prova.' },
            ]
          : [
              { id: 'ai1', title: 'Resumo Direto dos Pontos Críticos', type: 'summary', description: 'Revisão concisa dos conceitos.' },
              { id: 'ai2', title: 'Bateria Diagnóstica de Questões', type: 'quiz_objective', description: 'Identificação de lacunas.' },
              { id: 'ai3', title: 'Resumo Focal nos Erros (IA)', type: 'focal_error_summary', description: 'Explicação imediata das questões erradas.' },
              { id: 'ai4', title: 'Fechamento com Síntese Ativa', type: 'final_summary', description: 'Ganho de pontuação no Score TRI.' },
            ],
      };
      setPresets((prev) => [customPreset, ...prev]);
      setAiPrompt('');
      showToast('Nova rotina inteligente gerada pela IA!', 'success');
    }, 1000);
  };

  const activeSubjectObj =
    userSubjects.find((s) => s.name === selectedSubject) || userSubjects[0];

  return (
    <section className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">⚡ Rotinas de Estudo & Agenda</h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            Escolha sua disciplina, selecione o conteúdo e inicie sua rotina guiada
          </p>
        </div>
        <button
          onClick={() => setShowBuilderModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#11C76F]/10 border border-[#11C76F]/30 text-[#11C76F] text-xs font-bold active:scale-95 transition-all min-h-[40px]"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Criar Modo</span>
        </button>
      </div>

      {/* Alerta Inteligente Conectado ao Boletim Escolar */}
      {atRiskSubjects.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#F59E0B]/40 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-white block">
                Prioridade do Boletim: {atRiskSubjects.map((s) => `${s.name} (Média ${s.currentAverage.toFixed(1)})`).join(', ')}
              </span>
              <span className="text-[#8E8E93]">
                Sua média está abaixo do corte em {atRiskSubjects[0].name}. Recomendamos iniciar uma rotina hoje!
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedSubject(atRiskSubjects[0].name);
              handleStartRoutine(presets[0]);
            }}
            className="px-3 py-2 rounded-xl bg-[#F59E0B] text-black font-bold text-xs shrink-0 min-h-[40px]"
          >
            Resgatar Nota
          </button>
        </div>
      )}

      {/* Seletor de Disciplina e Conteúdo em Foco */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {userSubjects.map((subj) => (
            <button
              key={subj.id}
              onClick={() => setSelectedSubject(subj.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] flex items-center gap-1.5 ${
                selectedSubject === subj.name
                  ? 'bg-[#11C76F] text-black shadow-md shadow-[#11C76F]/20'
                  : 'bg-[#141414] text-[#8E8E93] border border-[#262626] hover:text-white'
              }`}
            >
              <span>{subj.icon}</span>
              <span>{subj.name}</span>
            </button>
          ))}
        </div>

        {/* Seletor de Conteúdo/Tópico da Disciplina Ativa */}
        {activeSubjectObj && activeSubjectObj.topics.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-[#8E8E93] font-medium shrink-0 pr-1">
              Conteúdo:
            </span>
            {activeSubjectObj.topics.map((top) => (
              <button
                key={top.id}
                onClick={() => setActiveTopic(top.title)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all min-h-[34px] ${
                  activeTopic === top.title
                    ? 'bg-[#11C76F]/15 border-[#11C76F] text-[#11C76F]'
                    : 'bg-[#141414] border-[#262626] text-[#8E8E93] hover:text-white'
                }`}
              >
                {top.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards de Modos de Estudo Pré-Configurados */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
          Modos de Estudo ({selectedSubject} • {activeTopic})
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#11C76F]/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{preset.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1C1C1C] text-[#11C76F] border border-[#262626]">
                      {preset.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                    <Clock className="w-3.5 h-3.5 text-[#11C76F]" />
                    <span>~{preset.estimatedMinutes} minutos</span>
                    <span>•</span>
                    <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>{preset.steps.length} etapas encadeadas</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartRoutine(preset)}
                  className="px-4 py-2.5 rounded-xl bg-[#11C76F] text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#11C76F]/20 active:scale-95 transition-all min-h-[44px]"
                  aria-label={`Iniciar rotina ${preset.title}`}
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Iniciar</span>
                </button>
              </div>

              {/* Pré-visualização das Etapas */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {preset.steps.map((st, i) => (
                  <span
                    key={st.id}
                    className="text-[11px] px-2 py-1 rounded-lg bg-[#1C1C1C] border border-[#262626] text-[#8E8E93]"
                  >
                    {i + 1}. {st.title.split(':')[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assistente de Criação de Rotina com IA */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Sparkles className="w-4 h-4 text-[#11C76F]" />
          <span>Montar Rotina Sob Medida com IA</span>
        </div>
        <p className="text-xs text-[#8E8E93]">
          Diga quanto tempo você tem ou se tem prova amanhã para a IA montar o fluxo ideal.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Tenho prova de Física amanhã e 40 min livres..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 bg-[#1C1C1C] border border-[#262626] text-white text-xs rounded-xl px-3 py-2.5 min-h-[44px] focus:outline-none focus:border-[#11C76F]"
          />
          <button
            onClick={handleGenerateAiRoutine}
            disabled={isGeneratingAiRoutine}
            className="px-4 py-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] text-white hover:text-[#11C76F] text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all min-h-[44px] shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#11C76F]" />
            <span>{isGeneratingAiRoutine ? 'Gerando...' : 'Criar'}</span>
          </button>
        </div>
      </div>

      {/* Agenda de Estudos da Semana & Lembretes Push */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Calendar className="w-4 h-4 text-[#3B82F6]" />
            <span>Cronograma Semanal Planejado</span>
          </div>
          <button
            onClick={async () => {
              if (typeof window !== 'undefined' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  showToast('Lembretes push ativados! Você receberá avisos antes de cada rotina.', 'success');
                } else {
                  showToast('Permissão de notificações não concedida no navegador.', 'info');
                }
              } else {
                showToast('Lembretes push configurados localmente no PWA.', 'success');
              }
            }}
            className="text-[11px] font-semibold text-[#11C76F] hover:underline flex items-center gap-1 p-1 min-h-[32px]"
          >
            🔔 Ativar Lembretes Push
          </button>
        </div>

        <div className="space-y-2">
          {scheduledDays.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs"
            >
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleToggleAgendaStatus(item.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    item.status === 'completed'
                      ? 'bg-[#11C76F] border-[#11C76F] text-black'
                      : 'border-[#404040] text-transparent'
                  }`}
                  aria-label="Marcar como concluída"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <div>
                  <span className={`font-semibold ${item.status === 'completed' ? 'line-through text-[#8E8E93]' : 'text-white'}`}>
                    {item.day}
                  </span>
                  <span className="text-[#8E8E93] ml-2">• {item.subject} ({item.routine})</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const target = presets.find((p) => p.title === item.routine) || presets[0];
                  setSelectedSubject(item.subject);
                  handleStartRoutine(target);
                }}
                className="text-[11px] font-semibold text-[#11C76F] hover:underline p-1 min-h-[32px] flex items-center"
              >
                Iniciar
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar Novo Dia na Agenda */}
        <div className="pt-2 border-t border-[#262626] flex flex-wrap sm:flex-nowrap gap-2">
          <select
            value={newAgendaDay}
            onChange={(e) => setNewAgendaDay(e.target.value)}
            className="bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-2.5 py-2 text-xs min-h-[40px]"
          >
            <option value="Segunda">Segunda</option>
            <option value="Terça">Terça</option>
            <option value="Quarta">Quarta</option>
            <option value="Quinta">Quinta</option>
            <option value="Sexta">Sexta</option>
            <option value="Sábado">Sábado</option>
            <option value="Domingo">Domingo</option>
          </select>
          <select
            value={newAgendaRoutine}
            onChange={(e) => setNewAgendaRoutine(e.target.value)}
            className="flex-1 bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-2.5 py-2 text-xs min-h-[40px]"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.title}>{p.title}</option>
            ))}
          </select>
          <button
            onClick={handleAddAgendaEvent}
            className="px-3 py-2 rounded-xl bg-[#11C76F]/10 border border-[#11C76F]/30 text-[#11C76F] font-semibold text-xs flex items-center gap-1 min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agendar ({selectedSubject})</span>
          </button>
        </div>
      </div>

      {/* Modal Construtor Manual de Rotina de Estudos */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#262626] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">🛠️ Montar Rotina de Estudos Genérica</h3>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="text-xs text-[#8E8E93] hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] text-[#8E8E93] block mb-1">Nome do Modo</label>
                <input
                  type="text"
                  placeholder="Ex: Revisão de Fim de Semana"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-3 py-2 text-xs min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8E8E93] block mb-1">Minutos</label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 30)}
                  className="w-full bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-3 py-2 text-xs min-h-[40px]"
                />
              </div>
            </div>

            {/* Etapas Atuais */}
            <div>
              <span className="text-[11px] text-[#8E8E93] block mb-1.5">Sequência de Etapas ({customSteps.length}):</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {customSteps.map((st, idx) => (
                  <div key={st.id} className="flex items-center justify-between p-2 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs">
                    <span className="text-white truncate">{idx + 1}. {st.title}</span>
                    <button
                      onClick={() => setCustomSteps((prev) => prev.filter((item) => item.id !== st.id))}
                      className="text-[#EF4444] p-1"
                      aria-label="Remover etapa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Adicionar Blocos */}
            <div>
              <span className="text-[11px] text-[#8E8E93] block mb-1.5">Adicionar Bloco na Sequência:</span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_STEP_BLOCKS.map((blk) => (
                  <button
                    key={blk.type}
                    onClick={() =>
                      setCustomSteps((prev) => [
                        ...prev,
                        {
                          id: `cs_${Date.now()}_${Math.random()}`,
                          title: blk.label,
                          type: blk.type,
                          description: blk.desc,
                        },
                      ])
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#1C1C1C] border border-[#262626] hover:border-[#11C76F] text-[11px] text-white flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#11C76F]" />
                    <span>{blk.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowBuilderModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-white min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustomRoutine}
                className="flex-1 py-2.5 rounded-xl bg-[#11C76F] text-black font-bold text-xs min-h-[44px]"
              >
                Salvar Rotina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interativo do Player de Rotina */}
      {activeRoutine && (
        <RoutinePlayerModal
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          routineTitle={activeRoutine.title}
          subjectName={selectedSubject}
          steps={activeRoutine.steps}
          onCompleteRoutine={(pts) => onScoreGain(pts)}
        />
      )}
    </section>
  );
};
