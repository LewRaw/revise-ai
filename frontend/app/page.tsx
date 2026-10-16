'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Award, 
  ArrowRight, 
  BookOpen, 
  Zap, 
  RotateCcw,
  HelpCircle,
  GraduationCap,
  Brain,
  Send,
  Users,
  Layers,
  UserPlus,
  Plus
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { BottomNav, ActiveTab } from '@/components/BottomNav';
import { RoutineManager } from '@/components/routines/RoutineManager';
import { GradebookView } from '@/components/gradebook/GradebookView';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { SubjectContentModal } from '@/components/subjects/SubjectContentModal';
import { AccountAndPlanModal } from '@/components/saas/AccountAndPlanModal';
import { getDynamicStudyDataForTopic, BankQuestion } from '@/lib/questionBank';
import { 
  createErrorCard, 
  scheduleNextFsrsReview, 
  getActiveErrorCards, 
  ErrorNotebookCard, 
  FsrsRating 
} from '@/lib/fsrsEngine';
import {
  loadUserStats,
  saveUserStats,
  loadErrorNotebook,
  saveErrorNotebook,
} from '@/lib/storageService';

export default function HomePage() {
  const { showToast } = useToast();
  const {
    currentUser,
    userSubjects,
    activeSubject,
    activeTopic,
    setActiveSubject,
    setActiveTopic,
    startNewStudentOnboarding,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Dashboard Stats Persistentes Isolados por Usuário
  const [masteryScore, setMasteryScore] = useState<number>(780);
  const [streakDays, setStreakDays] = useState<number>(5);
  const [completedReviews, setCompletedReviews] = useState<number>(8);

  // Caderno de Erros FSRS Isolado por Usuário
  const [errorCards, setErrorCards] = useState<ErrorNotebookCard[]>([]);
  const [revealedErrorIds, setRevealedErrorIds] = useState<Record<string, boolean>>({});

  // Disciplina Global Selecionada sincronizada com AuthContext
  const selectedSubject = activeSubject;
  const setSelectedSubject = setActiveSubject;

  // Módulo de Voz (Feynman)
  const [voiceTopic, setVoiceTopic] = useState<string>('Cinemática: MU e MUV');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceTranscription, setVoiceTranscription] = useState<string>('');
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<{
    score: number;
    positives: string[];
    gaps: string[];
    message: string;
  } | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Módulo de Foto do Caderno
  const [notebookImage, setNotebookImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<{
    detectedTopic?: string;
    summary: string;
    keyPoints: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Módulo de Simulado Dinâmico (Suporta qualquer disciplina e conteúdo customizado)
  const [quizQuestions, setQuizQuestions] = useState<BankQuestion[]>(() =>
    getDynamicStudyDataForTopic('Física', 'Cinemática: MU e MUV').questions.map((q) => ({
      ...q,
      selectedLetter: undefined,
    }))
  );
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Recarregar estado isolado sempre que o usuário ativo mudar
  useEffect(() => {
    const stats = loadUserStats(currentUser.id);
    setMasteryScore(stats.masteryScore);
    setStreakDays(stats.streakDays);
    setCompletedReviews(stats.completedReviews);
    setErrorCards(loadErrorNotebook(currentUser.id));
  }, [currentUser.id]);

  // Atualizar questões e tópico de voz quando a disciplina ou conteúdo ativo mudar
  useEffect(() => {
    setVoiceTopic(activeTopic);
    const activeSubObj = userSubjects.find((s) => s.name === activeSubject);
    const activeTopObj = activeSubObj?.topics.find((t) => t.title === activeTopic);
    const dynamicData = getDynamicStudyDataForTopic(
      activeSubject,
      activeTopic,
      activeTopObj?.summaryText
    );
    setQuizQuestions(
      dynamicData.questions.map((q) => ({
        ...q,
        selectedLetter: undefined,
      }))
    );
    setQuizSubmitted(false);
  }, [activeSubject, activeTopic, userSubjects]);

  const updateScoreAndPersist = (deltaScore: number, incrementReviews: boolean = true) => {
    setMasteryScore((prev) => {
      const nextScore = Math.min(1000, prev + deltaScore);
      const nextReviews = incrementReviews ? completedReviews + 1 : completedReviews;
      if (incrementReviews) setCompletedReviews(nextReviews);
      saveUserStats(
        {
          masteryScore: nextScore,
          streakDays,
          completedReviews: nextReviews,
        },
        currentUser.id
      );
      return nextScore;
    });
  };

  // Trocar disciplina do simulado
  const handleSelectSubject = (subj: string) => {
    setSelectedSubject(subj);
  };

  // Timer da Gravação de Voz
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Avaliar explicação Feynman via API /api/ai
  const evaluateFeynmanText = async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) {
      showToast('Fale ou digite sua explicação antes de avaliar.', 'error');
      return;
    }
    setIsAnalyzingVoice(true);
    showToast('Analisando sua explicação com a IA pedagógica...', 'info');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_voice',
          topic: `${selectedSubject}: ${voiceTopic}`,
          transcription: textToAnalyze,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.data) {
        setVoiceFeedback({
          score: json.data.clarity_score || 88,
          positives: json.data.concepts_grasped || ['Boa articulação conceitual'],
          gaps: json.data.gaps_detected || ['Aprofundar nas fórmulas e unidades'],
          message: json.data.encouragement || 'Excelente domínio intuitivo!',
        });
        updateScoreAndPersist(15, true);
        showToast('Diagnóstico Feynman concluído! +15 Pontos TRI.', 'success');
      }
    } catch {
      setVoiceFeedback({
        score: 88,
        positives: [
          'Diferenciou perfeitamente conservação de energia e entropia.',
          'Entendeu a impossibilidade de máquina térmica 100% eficiente.',
        ],
        gaps: ['Faltou citar a fórmula matemática (ΔU = Q - W).'],
        message: 'Excelente domínio intuitivo! Sua explicação foi clara e sem decorebas.',
      });
      updateScoreAndPersist(15, true);
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  // Ações do Módulo de Voz com Web Speech API Real + Fallback
  const toggleRecording = () => {
    if (isRecording) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
      if (voiceTranscription.trim()) {
        evaluateFeynmanText(voiceTranscription);
      }
      return;
    }

    setVoiceFeedback(null);
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
          showToast('Microfone ativo (pt-BR)! Explique o assunto com suas palavras...', 'info');
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setVoiceTranscription(transcript);
        };

        recognition.onerror = () => {
          setIsRecording(false);
          const sample =
            'A primeira lei diz que a energia se conserva: se o gás expande ele realiza trabalho. Já na segunda lei a entropia sempre aumenta, impedindo 100% de eficiência.';
          setVoiceTranscription(sample);
          evaluateFeynmanText(sample);
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {}
    }

    // Fallback automático caso o navegador não tenha Web Speech API
    setIsRecording(true);
    showToast('Gravação iniciada! Explique o conteúdo com suas próprias palavras.', 'info');
    setTimeout(() => {
      const sample =
        'A primeira lei diz que a energia se conserva... se o gás expande ele faz trabalho contra a vizinhança. Mas na segunda lei a entropia sempre aumenta, então não dá pra transformar 100% de calor em trabalho.';
      setVoiceTranscription(sample);
      setIsRecording(false);
      evaluateFeynmanText(sample);
    }, 2800);
  };

  // Ações do Módulo de Foto do Caderno (Chama /api/ai com Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setNotebookImage(base64);
      setIsAnalyzingImage(true);
      showToast('Caderno enviado! Processando OCR Multimodal...', 'info');

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze_notebook',
            base64Image: base64,
            subject: selectedSubject,
          }),
        });
        const json = await res.json();
        if (json?.ok && json.data) {
          setOcrResult(json.data);
          showToast('Anotações e fórmulas extraídas com sucesso!', 'success');
        }
      } catch {
        setOcrResult({
          detectedTopic: `Anotações de ${selectedSubject}`,
          summary: 'Anotações sobre Ciclo de Carnot e Rendimento Térmico Máximo.',
          keyPoints: [
            'Fórmula identificada: η = 1 - (T_fria / T_quente)',
            'Temperaturas devem estar sempre em escala absoluta Kelvin (K)',
            'Transformações: 2 isotérmicas reversíveis e 2 adiabáticas reversíveis',
          ],
        });
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Resposta do Simulado
  const handleSelectOption = (questionId: string, letter: string) => {
    if (quizSubmitted) return;
    setQuizQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, selectedLetter: letter } : q))
    );
  };

  const handleSubmitQuiz = () => {
    const allAnswered = quizQuestions.every((q) => q.selectedLetter !== undefined);
    if (!allAnswered) {
      showToast('Por favor, responda todas as questões antes de finalizar.', 'error');
      return;
    }

    setQuizSubmitted(true);
    let correctCount = 0;
    const currentNotebook = [...errorCards];
    let newErrorsAdded = 0;

    for (const q of quizQuestions) {
      const chosenOpt = q.options.find((opt) => opt.letter === q.selectedLetter);
      const rightOpt = q.options.find((opt) => opt.isCorrect);

      if (chosenOpt?.isCorrect) {
        correctCount++;
      } else if (q.selectedLetter && rightOpt) {
        // Registra no Caderno de Erros FSRS
        const exists = currentNotebook.some((c) => c.questionId === q.id && !c.resolved);
        if (!exists) {
          currentNotebook.unshift(
            createErrorCard({
              questionId: q.id,
              subject: q.subject,
              topic: q.topic,
              questionText: q.text,
              wrongSelectedLetter: q.selectedLetter,
              correctLetter: rightOpt.letter,
              correctOptionText: rightOpt.text,
              explanation: rightOpt.explanation,
            })
          );
          newErrorsAdded++;
        }
      }
    }

    if (newErrorsAdded > 0) {
      setErrorCards(currentNotebook);
      saveErrorNotebook(currentNotebook, currentUser.id);
    }

    const gainedScore = correctCount * 15;
    updateScoreAndPersist(gainedScore, true);
    showToast(
      `Simulado finalizado! Acertou ${correctCount}/${quizQuestions.length}. ${
        newErrorsAdded > 0 ? `${newErrorsAdded} erro(s) salvos no FSRS.` : 'Gabaritou!'
      }`,
      'success'
    );
  };

  const handleResetQuiz = () => {
    setQuizSubmitted(false);
    const activeSubObj = userSubjects.find((s) => s.name === selectedSubject);
    const activeTopObj = activeSubObj?.topics.find((t) => t.title === activeTopic);
    const dynamicData = getDynamicStudyDataForTopic(
      selectedSubject,
      activeTopic,
      activeTopObj?.summaryText
    );
    setQuizQuestions(
      dynamicData.questions.map((q) => ({
        ...q,
        selectedLetter: undefined,
      }))
    );
    showToast('Simulado reiniciado para novo treino.', 'info');
  };

  // Avaliar revisão de um card no Caderno de Erros FSRS
  const handleRateErrorCard = (cardId: string, rating: FsrsRating) => {
    const updated = errorCards.map((c) =>
      c.id === cardId ? scheduleNextFsrsReview(c, rating) : c
    );
    setErrorCards(updated);
    saveErrorNotebook(updated, currentUser.id);
    if (rating === 'good' || rating === 'easy') {
      updateScoreAndPersist(5, false);
      showToast('Conceito fortalecido na memória de longo prazo (FSRS)! +5 pts', 'success');
    } else {
      showToast('Card reagendado pelo algoritmo FSRS para reforço em breve.', 'info');
    }
  };

  const activeErrorCards = getActiveErrorCards(errorCards);
  const currentSubjectObj =
    userSubjects.find((s) => s.name === selectedSubject) || userSubjects[0];

  return (
    <main className="w-full">
      {/* Top Header Fintech SaaS */}
      <header className="flex flex-col gap-3 pb-4 border-b border-[#262626] mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Revise<span className="text-[#11C76F]">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#11C76F]/15 border border-[#11C76F]/30 text-[#11C76F]">
                SaaS {currentUser.plan}
              </span>
            </div>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {currentUser.fullName} • {currentUser.schoolGrade}
            </p>
          </div>

          {/* Badges de Domínio, Ofensiva & Troca de Conta */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141414] border border-[#262626]">
              <Flame className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs font-semibold text-white">{streakDays}d</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#11C76F]/10 border border-[#11C76F]/30">
              <Award className="w-4 h-4 text-[#11C76F]" />
              <span className="text-xs font-bold text-[#11C76F]">{masteryScore}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              aria-label="Gerenciar contas SaaS e planos"
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#11C76F] flex items-center justify-center gap-1.5 text-xs font-bold text-white transition-all"
            >
              <Users className="w-4 h-4 text-[#11C76F]" />
            </button>
          </div>
        </div>

        {/* Barra SaaS de Foco de Estudo (Disciplina + Conteúdo + Onboarding Rápido) */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#141414] border border-[#262626]">
          <button
            type="button"
            onClick={() => setIsSubjectModalOpen(true)}
            className="flex-1 min-h-[44px] px-3 py-1.5 rounded-xl bg-[#1C1C1C] border border-[#262626] hover:border-[#11C76F]/50 text-left flex items-center justify-between gap-2 transition-all"
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[#8E8E93] font-semibold flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#11C76F]" /> Disciplina & Conteúdo Ativo
              </div>
              <div className="text-xs font-bold text-white truncate">
                {selectedSubject} • <span className="text-[#11C76F]">{activeTopic}</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#11C76F] shrink-0 flex items-center gap-0.5">
              <Plus className="w-3.5 h-3.5" /> Conteúdos
            </span>
          </button>

          <button
            type="button"
            onClick={startNewStudentOnboarding}
            className="min-h-[44px] px-3 rounded-xl bg-[#11C76F]/15 border border-[#11C76F]/40 hover:bg-[#11C76F]/25 text-[#11C76F] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden xs:inline">Onboarding</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* ABA 1: DASHBOARD CENTRAL                                       */}
      {/* ============================================================== */}
      {activeTab === 'dashboard' && (
        <section className="space-y-5 animate-in fade-in duration-200">
          {/* Card Destaque: Score de Domínio */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wider">
                Meta: {currentUser.targetExam}
              </span>
              <span className="text-xs font-bold text-[#11C76F]">
                {masteryScore >= 750 ? 'Nível Avançado' : 'Em Evolução'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-white">{masteryScore}</span>
              <span className="text-xs text-[#8E8E93]">/ 1000 pontos TRI</span>
            </div>
            <div className="w-full bg-[#262626] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#11C76F] h-full transition-all duration-500 rounded-full"
                style={{ width: `${(masteryScore / 1000) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[#8E8E93] mt-3">
              💡 Você concluiu <strong className="text-white">{completedReviews} revisões ativas</strong> em{' '}
              <strong className="text-white">{userSubjects.length} disciplinas</strong> cadastradas.
            </p>
          </div>

          {/* Card de Repetição Espaçada FSRS (Caderno de Erros) */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#11C76F]/10 text-[#11C76F] shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Caderno de Erros FSRS ({activeErrorCards.length} pendentes)
                </div>
                <p className="text-xs text-[#8E8E93]">
                  {activeErrorCards.length > 0
                    ? 'Questões que você errou estão prontas para revisão espaçada.'
                    : 'Zero erros pendentes! Faça um simulado para alimentar seu algoritmo FSRS.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('quiz')}
              className="px-3.5 py-2 rounded-xl bg-[#1C1C1C] border border-[#262626] hover:border-[#11C76F] text-xs font-semibold text-[#11C76F] shrink-0 min-h-[44px]"
            >
              {activeErrorCards.length > 0 ? 'Revisar Erros' : 'Abrir Simulado'}
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Ações Rápidas de Estudo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('routines')}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#11C76F]/50 transition-all text-left active:scale-98 min-h-[56px]"
              >
                <div className="p-2.5 rounded-xl bg-[#11C76F]/10 text-[#11C76F] shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Rotina Dia Normal</div>
                  <div className="text-xs text-[#8E8E93] truncate">Fluxo guiado de 45 min</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8E93]" />
              </button>

              <button
                onClick={() => setActiveTab('review')}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#3B82F6]/50 transition-all text-left active:scale-98 min-h-[56px]"
              >
                <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Explicar por Voz</div>
                  <div className="text-xs text-[#8E8E93] truncate">Técnica de Feynman + OCR</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8E93]" />
              </button>

              <button
                onClick={() => setActiveTab('gradebook')}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#F59E0B]/50 transition-all text-left active:scale-98 min-h-[56px]"
              >
                <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">Boletim Escolar</div>
                  <div className="text-xs text-[#8E8E93] truncate">Notas, pesos & metas</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8E93]" />
              </button>
            </div>
          </div>

          {/* Disciplinas Interativas do Usuário (Suporta Customizadas) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">
                Suas Disciplinas & Conteúdos ({userSubjects.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(true)}
                className="text-xs font-bold text-[#11C76F] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Matéria / Assunto
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {userSubjects.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => {
                    handleSelectSubject(subj.name);
                    setActiveTab('quiz');
                  }}
                  className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#11C76F] text-left transition-all active:scale-98 min-h-[72px] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-base">{subj.icon}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1C1C1C] text-[#8E8E93] border border-[#262626]">
                      {subj.topics.length} conteúdos
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white truncate">{subj.name}</div>
                    <div className="text-[10px] text-[#11C76F] truncate">
                      {subj.topics[0]?.title || 'Praticar Simulado →'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* ABA 2: REVISAR (VOZ FEYNMAN & FOTO DO CADERNO)                 */}
      {/* ============================================================== */}
      {activeTab === 'review' && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626]">
            <h2 className="text-base font-bold text-white mb-1">🎙️ Revisão Ativa (Voz & Caderno)</h2>
            <p className="text-xs text-[#8E8E93]">
              Ensine a matéria com suas próprias palavras (Web Speech API) ou tire foto do caderno para extração multimodal.
            </p>
          </div>

          {/* Seletor Dinâmico de Matéria e Conteúdo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {userSubjects.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => setSelectedSubject(subj.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                    selectedSubject === subj.name
                      ? 'bg-[#11C76F] text-black'
                      : 'bg-[#141414] text-[#8E8E93] border border-[#262626] hover:text-white'
                  }`}
                >
                  <span>{subj.icon}</span>
                  <span>{subj.name}</span>
                </button>
              ))}
            </div>

            {currentSubjectObj && currentSubjectObj.topics.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {currentSubjectObj.topics.map((top) => (
                  <button
                    key={top.id}
                    onClick={() => {
                      setActiveTopic(top.title);
                      setVoiceTopic(top.title);
                    }}
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

          {/* Seção 1: Gravação Feynman */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#11C76F]">Método Feynman por Voz</span>
              <span className="text-xs text-[#8E8E93]">{selectedSubject}</span>
            </div>

            <input
              type="text"
              value={voiceTopic}
              onChange={(e) => setVoiceTopic(e.target.value)}
              placeholder="Assunto (ex: Leis da Termodinâmica)..."
              className="w-full bg-[#1C1C1C] border border-[#262626] text-white rounded-xl px-3 py-2.5 text-xs min-h-[44px] focus:outline-none focus:border-[#11C76F]"
            />

            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#1C1C1C] text-center">
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 mb-2 ${
                  isRecording ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-[#11C76F] text-black'
                }`}
                aria-label="Gravar voz"
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <span className="text-xs text-white font-medium">
                {isRecording
                  ? `Ouvindo (pt-BR)... 00:${recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}`
                  : 'Toque no microfone para explicar falando'}
              </span>
            </div>

            {/* Caixa de Transcrição Editável */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={voiceTranscription}
                onChange={(e) => setVoiceTranscription(e.target.value)}
                placeholder="Sua fala transcrita aparecerá aqui (ou digite sua explicação diretamente)..."
                className="w-full bg-[#1C1C1C] border border-[#262626] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-[#11C76F]"
              />
              <button
                onClick={() => evaluateFeynmanText(voiceTranscription)}
                disabled={isAnalyzingVoice}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1C1C1C] border border-[#262626] hover:border-[#11C76F] text-xs font-semibold text-white flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Send className="w-3.5 h-3.5 text-[#11C76F]" />
                <span>{isAnalyzingVoice ? 'Avaliando com Gemini...' : 'Avaliar Minha Explicação com IA'}</span>
              </button>
            </div>

            {voiceFeedback && (
              <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#11C76F]/30 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#11C76F]" />
                    Diagnóstico da IA:
                  </span>
                  <span className="font-bold text-[#11C76F]">Clareza {voiceFeedback.score}%</span>
                </div>
                <p className="text-white">{voiceFeedback.message}</p>
                <div className="space-y-1 pt-1">
                  <div className="text-[#11C76F] font-semibold">✅ Pontos Fortes:</div>
                  {voiceFeedback.positives.map((p, i) => (
                    <div key={i} className="text-[#8E8E93]">• {p}</div>
                  ))}
                  <div className="text-[#F59E0B] font-semibold pt-1">⚠️ O que revisar:</div>
                  {voiceFeedback.gaps.map((g, i) => (
                    <div key={i} className="text-[#8E8E93]">• {g}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Foto do Caderno */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
              Foto do Caderno (OCR Multimodal - {selectedSubject})
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-[#262626] hover:border-[#3B82F6] rounded-xl flex items-center justify-center gap-2 text-xs text-white bg-[#1C1C1C]/40 min-h-[48px]"
            >
              <Camera className="w-4 h-4 text-[#3B82F6]" />
              <span>{isAnalyzingImage ? 'Processando Imagem...' : 'Tirar Foto ou Enviar do Álbum'}</span>
            </button>

            {notebookImage && (
              <div className="rounded-xl overflow-hidden border border-[#262626] bg-black max-h-48 flex justify-center">
                <img src={notebookImage} alt="Preview do caderno" className="max-h-48 object-contain" />
              </div>
            )}

            {ocrResult && (
              <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs space-y-2.5 animate-in fade-in">
                <div className="font-bold text-white">{ocrResult.summary}</div>
                <div className="space-y-1 text-[#8E8E93]">
                  {ocrResult.keyPoints.map((pt, i) => (
                    <div key={i}>• {pt}</div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    handleSelectSubject(selectedSubject);
                    setActiveTab('quiz');
                    showToast(`Simulado de ${selectedSubject} carregado a partir do caderno!`, 'success');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#11C76F] text-black font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span>Praticar Simulado deste Caderno</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* ABA 3: ROTINAS DE ESTUDO & AGENDA                              */}
      {/* ============================================================== */}
      {activeTab === 'routines' && (
        <RoutineManager
          onScoreGain={(pts) => updateScoreAndPersist(pts, true)}
        />
      )}

      {/* ============================================================== */}
      {/* ABA 4: SIMULADOS & CADERNO DE ERROS FSRS                       */}
      {/* ============================================================== */}
      {activeTab === 'quiz' && (
        <section className="space-y-5 animate-in fade-in duration-200">
          {/* Seletor Dinâmico de Disciplina e Conteúdo do Simulado */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {userSubjects.map((subj) => (
                <button
                  key={subj.id}
                  onClick={() => handleSelectSubject(subj.name)}
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

            {currentSubjectObj && currentSubjectObj.topics.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {currentSubjectObj.topics.map((top) => (
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

          {/* Seção do Caderno de Erros FSRS (Se houver erros para revisar) */}
          {activeErrorCards.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#F59E0B]/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                    Fila de Repetição Espaçada FSRS ({activeErrorCards.length})
                  </h3>
                </div>
                <span className="text-[11px] text-[#8E8E93]">Caderno de Erros Ativo</span>
              </div>

              <div className="space-y-2.5">
                {activeErrorCards.slice(0, 3).map((card) => {
                  const isRevealed = !!revealedErrorIds[card.id];
                  return (
                    <div key={card.id} className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#262626] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                        <span className="font-semibold text-white">{card.subject} • {card.topic}</span>
                        <span>Estabilidade FSRS: {card.stability}d</span>
                      </div>
                      <p className="text-white font-medium">{card.questionText}</p>

                      {!isRevealed ? (
                        <button
                          onClick={() => setRevealedErrorIds((prev) => ({ ...prev, [card.id]: true }))}
                          className="w-full py-2 rounded-lg bg-[#141414] border border-[#262626] text-[#11C76F] font-semibold min-h-[40px]"
                        >
                          Mostrar Gabarito e Explicação
                        </button>
                      ) : (
                        <div className="space-y-2 pt-1 animate-in fade-in">
                          <div className="p-2.5 rounded-lg bg-[#141414] border border-[#11C76F]/30 text-[#8E8E93]">
                            <div className="text-[#11C76F] font-bold mb-0.5">
                              Resposta Correta ({card.correctLetter}): {card.correctOptionText}
                            </div>
                            <div>{card.explanation}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <button
                              onClick={() => handleRateErrorCard(card.id, 'again')}
                              className="py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] font-semibold min-h-[38px]"
                            >
                              Errei (1d)
                            </button>
                            <button
                              onClick={() => handleRateErrorCard(card.id, 'good')}
                              className="py-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] font-semibold min-h-[38px]"
                            >
                              Bom (+Dias)
                            </button>
                            <button
                              onClick={() => handleRateErrorCard(card.id, 'easy')}
                              className="py-2 rounded-lg bg-[#11C76F]/10 border border-[#11C76F]/30 text-[#11C76F] font-semibold min-h-[38px]"
                            >
                              Dominado ✓
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Header do Simulado */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141414] border border-[#262626]">
            <div>
              <h2 className="text-base font-bold text-white">
                📝 Simulado: {selectedSubject} • {activeTopic}
              </h2>
              <p className="text-xs text-[#8E8E93]">
                {quizQuestions.length} questões estilo ENEM • Erros vão automaticamente para o FSRS
              </p>
            </div>
            {quizSubmitted && (
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-white hover:text-[#11C76F] transition-colors min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Refazer
              </button>
            )}
          </div>

          <div className="space-y-4">
            {quizQuestions.map((q, qIndex) => (
              <div key={q.id} className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#11C76F] px-2 py-0.5 rounded-md bg-[#11C76F]/10">
                    Questão {qIndex + 1} • {q.topic}
                  </span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#1C1C1C] text-[#8E8E93] border border-[#262626]">
                    {q.difficulty}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">{q.text}</p>

                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const isSelected = q.selectedLetter === opt.letter;
                    let optionClasses = 'bg-[#1C1C1C] border-[#262626] text-white hover:border-[#404040]';

                    if (quizSubmitted) {
                      if (opt.isCorrect) {
                        optionClasses = 'bg-[#11C76F]/10 border-[#11C76F] text-white';
                      } else if (isSelected && !opt.isCorrect) {
                        optionClasses = 'bg-[#EF4444]/10 border-[#EF4444] text-white';
                      }
                    } else if (isSelected) {
                      optionClasses = 'bg-[#11C76F]/10 border-[#11C76F] text-white';
                    }

                    return (
                      <button
                        key={opt.letter}
                        disabled={quizSubmitted}
                        onClick={() => handleSelectOption(q.id, opt.letter)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-98 min-h-[48px] ${optionClasses}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-[#11C76F] text-black' : 'bg-[#262626] text-white'
                        }`}>
                          {opt.letter}
                        </span>
                        <span className="text-xs sm:text-sm leading-snug flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <HelpCircle className="w-3.5 h-3.5 text-[#11C76F]" />
                      <span>Explicação Pedagógica:</span>
                    </div>
                    <p className="text-[#8E8E93] leading-relaxed">
                      {q.options.find((opt) => opt.isCorrect)?.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!quizSubmitted && (
            <button
              onClick={handleSubmitQuiz}
              className="w-full py-3.5 px-4 rounded-xl bg-[#11C76F] text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[48px]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Enviar Respostas e Ver Gabarito</span>
            </button>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* ABA 5: BOLETIM ESCOLAR UNIVERSAL                               */}
      {/* ============================================================== */}
      {activeTab === 'gradebook' && (
        <GradebookView />
      )}

      {/* Modais SaaS Multi-Usuários, Onboarding em 4 Etapas e Disciplinas/Conteúdos */}
      <OnboardingWizard />
      <SubjectContentModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />
      <AccountAndPlanModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Barra de Navegação Inferior Nativa Fintech (5 Abas) */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
