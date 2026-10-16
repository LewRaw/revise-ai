'use client';

import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Target,
  BookOpen,
  Layers,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X,
} from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { TermSystem } from '@/lib/gradeCalculations';
import { UserSubjectWithContents, SaasUserProfile, SaasPlanTier } from '@/lib/storageService';
import { SUBJECT_STUDY_BANK } from '@/lib/questionBank';

interface PresetSubjectOption {
  name: string;
  area: UserSubjectWithContents['area'];
  color: string;
  icon: string;
  suggestedTopics: string[];
}

const PRESET_SUBJECTS: PresetSubjectOption[] = [
  {
    name: 'Matemática',
    area: 'exatas',
    color: '#11C76F',
    icon: '📐',
    suggestedTopics: SUBJECT_STUDY_BANK['Matemática'].suggestedTopics,
  },
  {
    name: 'Física',
    area: 'natureza',
    color: '#3B82F6',
    icon: '⚡',
    suggestedTopics: SUBJECT_STUDY_BANK['Física'].suggestedTopics,
  },
  {
    name: 'Química',
    area: 'natureza',
    color: '#EC4899',
    icon: '🧪',
    suggestedTopics: SUBJECT_STUDY_BANK['Química'].suggestedTopics,
  },
  {
    name: 'Biologia',
    area: 'natureza',
    color: '#10B981',
    icon: '🧬',
    suggestedTopics: SUBJECT_STUDY_BANK['Biologia'].suggestedTopics,
  },
  {
    name: 'História',
    area: 'humanas',
    color: '#F59E0B',
    icon: '🏛️',
    suggestedTopics: SUBJECT_STUDY_BANK['História'].suggestedTopics,
  },
  {
    name: 'Geografia',
    area: 'humanas',
    color: '#06B6D4',
    icon: '🌍',
    suggestedTopics: SUBJECT_STUDY_BANK['Geografia'].suggestedTopics,
  },
  {
    name: 'Redação & Linguagens',
    area: 'linguagens',
    color: '#8B5CF6',
    icon: '✍️',
    suggestedTopics: SUBJECT_STUDY_BANK['Redação & Linguagens'].suggestedTopics,
  },
];

export function OnboardingWizard() {
  const { isOnboardingOpen, setIsOnboardingOpen, completeOnboarding } = useAuth();
  const { showToast } = useToast();
  useBodyScrollLock(isOnboardingOpen);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Etapa 1: Identidade & Série
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolGrade, setSchoolGrade] = useState<SaasUserProfile['schoolGrade']>('3º Ano EM');
  const [plan, setPlan] = useState<SaasPlanTier>('plus');

  // Etapa 2: Meta & Sistema de Avaliação
  const [targetExam, setTargetExam] = useState('ENEM & Vestibulares');
  const [termSystem, setTermSystem] = useState<TermSystem>('bimestral');
  const [passingGrade, setPassingGrade] = useState<number>(6.0);

  // Etapa 3: Seleção de Disciplinas + Criação Customizada
  const [selectedSubjectNames, setSelectedSubjectNames] = useState<string[]>([
    'Matemática',
    'Física',
    'Química',
    'Redação & Linguagens',
  ]);
  const [customSubjectsList, setCustomSubjectsList] = useState<PresetSubjectOption[]>([]);
  const [newCustomSubName, setNewCustomSubName] = useState('');
  const [newCustomSubArea, setNewCustomSubArea] = useState<UserSubjectWithContents['area']>('outros');

  // Etapa 4: Conteúdos/Tópicos por Disciplina Selecionada
  const [topicsBySubject, setTopicsBySubject] = useState<Record<string, string[]>>({
    Matemática: ['Funções de 1º e 2º Grau', 'Estatística e Probabilidade ENEM'],
    Física: ['Cinemática: MU e MUV', 'Eletrodinâmica e Lei de Ohm'],
    Química: ['Estequiometria e Reações', 'Termoquímica e Entalpia'],
    'Redação & Linguagens': ['Estrutura Dissertativo-Argumentativa', 'Proposta de Intervenção (5 Elementos)'],
  });
  const [activeSubForTopicEdit, setActiveSubForTopicEdit] = useState<string>('Matemática');
  const [customTopicInput, setCustomTopicInput] = useState('');

  if (!isOnboardingOpen) return null;

  const allAvailableSubjects = [...PRESET_SUBJECTS, ...customSubjectsList];

  const handleToggleSubject = (subName: string) => {
    setSelectedSubjectNames((prev) => {
      if (prev.includes(subName)) {
        if (prev.length <= 1) {
          showToast('Selecione pelo menos 1 disciplina para sua trilha.', 'warning');
          return prev;
        }
        return prev.filter((s) => s !== subName);
      } else {
        // Inicializa tópicos sugeridos caso ainda não tenha
        const found = allAvailableSubjects.find((s) => s.name === subName);
        if (found && !topicsBySubject[subName]) {
          setTopicsBySubject((tPrev) => ({
            ...tPrev,
            [subName]: found.suggestedTopics.slice(0, 2),
          }));
        }
        return [...prev, subName];
      }
    });
  };

  const handleAddCustomSubjectInWizard = () => {
    const clean = newCustomSubName.trim();
    if (!clean) {
      showToast('Digite o nome da disciplina personalizada.', 'warning');
      return;
    }
    if (allAvailableSubjects.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      showToast('Esta disciplina já está na lista.', 'info');
      return;
    }

    const customOption: PresetSubjectOption = {
      name: clean,
      area: newCustomSubArea,
      color: '#11C76F',
      icon: '📘',
      suggestedTopics: [`Fundamentos de ${clean}`, `Exercícios Práticos de ${clean}`, `Revisão Geral: ${clean}`],
    };

    setCustomSubjectsList((prev) => [...prev, customOption]);
    setSelectedSubjectNames((prev) => [...prev, clean]);
    setTopicsBySubject((prev) => ({
      ...prev,
      [clean]: [`Fundamentos de ${clean}`, `Exercícios Práticos de ${clean}`],
    }));
    setNewCustomSubName('');
    showToast(`Disciplina "${clean}" adicionada com sucesso!`, 'success');
  };

  const handleToggleTopicForSubject = (subName: string, topicTitle: string) => {
    setTopicsBySubject((prev) => {
      const currentList = prev[subName] || [];
      if (currentList.includes(topicTitle)) {
        if (currentList.length <= 1) {
          showToast('Mantenha ao menos 1 conteúdo inicial na disciplina.', 'warning');
          return prev;
        }
        return { ...prev, [subName]: currentList.filter((t) => t !== topicTitle) };
      }
      return { ...prev, [subName]: [...currentList, topicTitle] };
    });
  };

  const handleAddCustomTopicInWizard = () => {
    const clean = customTopicInput.trim();
    if (!clean) {
      showToast('Digite o título do conteúdo ou assunto.', 'warning');
      return;
    }
    const targetSub = activeSubForTopicEdit || selectedSubjectNames[0];
    setTopicsBySubject((prev) => {
      const existing = prev[targetSub] || [];
      if (existing.includes(clean)) return prev;
      return {
        ...prev,
        [targetSub]: [...existing, clean],
      };
    });
    setCustomTopicInput('');
    showToast(`Conteúdo "${clean}" vinculado a ${targetSub}!`, 'success');
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        showToast('Informe seu nome ou apelido para continuar.', 'warning');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (selectedSubjectNames.length === 0) {
        showToast('Selecione pelo menos 1 disciplina.', 'warning');
        return;
      }
      setActiveSubForTopicEdit(selectedSubjectNames[0]);
      setStep(4);
    }
  };

  const handleFinishOnboarding = () => {
    const builtSubjects: UserSubjectWithContents[] = selectedSubjectNames.map((subName, idx) => {
      const meta = allAvailableSubjects.find((s) => s.name === subName);
      const chosenTopics = topicsBySubject[subName] && topicsBySubject[subName].length > 0
        ? topicsBySubject[subName]
        : [`Fundamentos de ${subName}`];

      return {
        id: `sub_${Date.now()}_${idx}`,
        name: subName,
        area: meta?.area || 'outros',
        color: meta?.color || '#11C76F',
        icon: meta?.icon || '📚',
        isCustom: !PRESET_SUBJECTS.some((p) => p.name === subName),
        topics: chosenTopics.map((title, tIdx) => ({
          id: `top_${Date.now()}_${idx}_${tIdx}`,
          title,
          difficulty: 'medium',
          masteryScore: 70,
        })),
      };
    });

    const createdUser = completeOnboarding({
      fullName,
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@reviseai.com.br`,
      schoolGrade,
      targetExam,
      termSystem,
      passingGrade,
      plan,
      subjects: builtSubjects,
    });

    showToast(
      `Bem-vindo(a), ${createdUser.fullName}! Sua conta SaaS e suas ${builtSubjects.length} disciplinas foram configuradas.`,
      'success'
    );
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 overflow-y-auto animate-fade-in">
        {/* Top Header */}
        <div className="max-w-md w-full mx-auto pt-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-brand/15 border border-brand/30 text-brand text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Onboarding SaaS • Passo {step} de 4
              </span>
            </div>
            <button
              onClick={() => setIsOnboardingOpen(false)}
              aria-label="Fechar Onboarding"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-surface border border-borderSubtle flex items-center justify-center text-textSecondary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Progresso em 4 Etapas */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx <= step ? 'bg-brand' : 'bg-surfaceHighlight'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo da Etapa Atual */}
        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          {step === 1 && (
            <div className="bg-surface border border-borderSubtle rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-textPrimary">1. Crie seu Perfil de Estudante</h2>
                  <p className="text-xs text-textSecondary">
                    Seus dados ficam isolados em sua conta multi-usuário com sincronização em nuvem.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Nome ou Apelido *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Mariana Costa"
                    className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3.5 text-sm text-textPrimary focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    E-mail da Conta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mariana@escola.edu.br"
                    className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3.5 text-sm text-textPrimary focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1.5 font-medium">
                    Série / Etapa Atual
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['1º Ano EM', '2º Ano EM', '3º Ano EM', 'Cursinho / ENEM'] as const).map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSchoolGrade(grade)}
                        className={`min-h-[44px] px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          schoolGrade === grade
                            ? 'bg-brand/15 border-brand text-brand'
                            : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1.5 font-medium">
                    Plano SaaS Inicial (Teste Grátis Incluso)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'free' as const, name: 'Free', desc: '25 créditos IA' },
                      { id: 'plus' as const, name: 'Plus', desc: '150 créditos IA' },
                      { id: 'pro' as const, name: 'Pro ENEM', desc: 'IA Ilimitada' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setPlan(tier.id)}
                        className={`min-h-[48px] p-2 rounded-xl border text-left transition-all ${
                          plan === tier.id
                            ? 'bg-brand/15 border-brand text-brand'
                            : 'bg-oled border-borderSubtle text-textSecondary'
                        }`}
                      >
                        <div className="text-xs font-bold">{tier.name}</div>
                        <div className="text-[10px] opacity-80">{tier.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-surface border border-borderSubtle rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-textPrimary">2. Objetivo & Sistema de Notas</h2>
                  <p className="text-xs text-textSecondary">
                    Configuraremos seu Boletim Inteligente e cálculo de nota de corte automaticamente.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Foco Principal de Estudo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'ENEM & Vestibulares',
                      'Passar de Ano no Colégio',
                      'Medicina / Alta Concorrência',
                      'Concursos / Olimpíadas',
                    ].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setTargetExam(goal)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all ${
                          targetExam === goal
                            ? 'bg-brand/15 border-brand text-brand'
                            : 'bg-oled border-borderSubtle text-textSecondary'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Divisão de Períodos da sua Escola
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'bimestral', label: 'Bimestral (4)' },
                        { id: 'trimestral', label: 'Trimestral (3)' },
                        { id: 'semestral', label: 'Semestral (2)' },
                      ] as const
                    ).map((sys) => (
                      <button
                        key={sys.id}
                        type="button"
                        onClick={() => setTermSystem(sys.id)}
                        className={`min-h-[44px] px-2 rounded-xl text-xs font-bold border transition-all ${
                          termSystem === sys.id
                            ? 'bg-brand/15 border-brand text-brand'
                            : 'bg-oled border-borderSubtle text-textSecondary'
                        }`}
                      >
                        {sys.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Média de Aprovação (0 a 10): <span className="text-brand font-bold">{passingGrade.toFixed(1)}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5.0, 6.0, 7.0, 8.0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPassingGrade(val)}
                        className={`min-h-[44px] rounded-xl text-xs font-bold border transition-all ${
                          passingGrade === val
                            ? 'bg-brand/15 border-brand text-brand'
                            : 'bg-oled border-borderSubtle text-textSecondary'
                        }`}
                      >
                        Média {val.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-surface border border-borderSubtle rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-textPrimary">3. Escolha suas Disciplinas</h2>
                  <p className="text-xs text-textSecondary">
                    Selecione as matérias da sua grade ou cadastre disciplinas específicas do seu curso.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {allAvailableSubjects.map((sub) => {
                  const isSelected = selectedSubjectNames.includes(sub.name);
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => handleToggleSubject(sub.name)}
                      className={`min-h-[48px] p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-brand/15 border-brand text-textPrimary'
                          : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{sub.icon}</span>
                        <span className="text-xs font-bold truncate">{sub.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Adicionar Disciplina Customizada */}
              <div className="pt-2 border-t border-borderSubtle space-y-2">
                <label className="text-xs font-semibold text-textSecondary block">
                  Não encontrou uma disciplina? Cadastre agora:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomSubName}
                    onChange={(e) => setNewCustomSubName(e.target.value)}
                    placeholder="Ex: Filosofia, Sociologia, Robótica..."
                    className="flex-1 min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary focus:outline-none focus:border-brand"
                  />
                  <select
                    aria-label="Área da disciplina customizada"
                    value={newCustomSubArea}
                    onChange={(e) => setNewCustomSubArea(e.target.value as UserSubjectWithContents['area'])}
                    className="min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-2 text-xs text-textSecondary"
                  >
                    <option value="humanas">Humanas</option>
                    <option value="exatas">Exatas</option>
                    <option value="natureza">Natureza</option>
                    <option value="linguagens">Linguagens</option>
                    <option value="outros">Outros</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomSubjectInWizard}
                    className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-brand text-black font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-surface border border-borderSubtle rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-textPrimary">4. Conteúdos por Disciplina</h2>
                  <p className="text-xs text-textSecondary">
                    Defina os assuntos e tópicos que você está estudando em cada matéria para gerar questões e resumos sob medida.
                  </p>
                </div>
              </div>

              {/* Seletor de Disciplina para editar os conteúdos */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {selectedSubjectNames.map((subName) => {
                  const count = (topicsBySubject[subName] || []).length;
                  const active = activeSubForTopicEdit === subName;
                  return (
                    <button
                      key={subName}
                      type="button"
                      onClick={() => setActiveSubForTopicEdit(subName)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-brand text-black border-brand'
                          : 'bg-oled text-textSecondary border-borderSubtle hover:text-textPrimary'
                      }`}
                    >
                      <span>{subName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          active ? 'bg-black/20 text-black' : 'bg-surfaceHighlight text-textPrimary'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Lista de Tópicos Sugeridos + Customizados da Disciplina Ativa */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(() => {
                  const meta = allAvailableSubjects.find((s) => s.name === activeSubForTopicEdit);
                  const currentTopics = topicsBySubject[activeSubForTopicEdit] || [];
                  const combinedTopics = Array.from(
                    new Set([...(meta?.suggestedTopics || []), ...currentTopics])
                  );

                  return combinedTopics.map((topicTitle) => {
                    const isChecked = currentTopics.includes(topicTitle);
                    return (
                      <button
                        key={topicTitle}
                        type="button"
                        onClick={() => handleToggleTopicForSubject(activeSubForTopicEdit, topicTitle)}
                        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-brand/15 border-brand/50 text-textPrimary'
                            : 'bg-oled border-borderSubtle text-textSecondary'
                        }`}
                      >
                        <span className="text-xs font-medium">{topicTitle}</span>
                        {isChecked && <Check className="w-4 h-4 text-brand shrink-0" />}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Input para adicionar conteúdo específico */}
              <div className="pt-2 border-t border-borderSubtle space-y-1.5">
                <label className="text-xs text-textSecondary block">
                  Adicionar conteúdo específico em <strong className="text-textPrimary">{activeSubForTopicEdit}</strong>:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    placeholder="Ex: Leis de Kepler, Revolução Francesa, Polinômios..."
                    className="flex-1 min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary focus:outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTopicInWizard}
                    className="min-h-[44px] px-3.5 rounded-xl bg-brand text-black font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Navegação entre Etapas */}
        <div className="max-w-md w-full mx-auto pt-4 pb-2 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
              className="min-h-[48px] px-4 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs font-bold flex items-center gap-2 hover:bg-surfaceHighlight transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="min-h-[48px] px-6 rounded-xl bg-brand hover:bg-brandHover text-black font-bold text-sm flex items-center gap-2 transition-all ml-auto"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="min-h-[48px] px-6 rounded-xl bg-brand hover:bg-brandHover text-black font-bold text-sm flex items-center gap-2 transition-all ml-auto shadow-lg shadow-brand/20"
            >
              <Check className="w-4 h-4" />
              Concluir Cadastro & Iniciar
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}
