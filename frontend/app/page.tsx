'use client';

import React, { useState, useEffect } from 'react';
import { Mic, ArrowRight, Zap, GraduationCap, Brain, Plus, Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProfileHeader } from '@/components/ProfileHeader';
import { BottomNav, ActiveTab } from '@/components/BottomNav';
import { ActiveStudyTab } from '@/components/study/ActiveStudyTab';
import { ErrorNotebookTab } from '@/components/study/ErrorNotebookTab';
import { RoutineManager } from '@/components/routines/RoutineManager';
import { GradebookView } from '@/components/gradebook/GradebookView';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { SubjectContentModal } from '@/components/subjects/SubjectContentModal';
import { getActiveErrorCards, ErrorNotebookCard } from '@/lib/fsrsEngine';
import { loadUserStats, saveUserStats, loadErrorNotebook } from '@/lib/storageService';

export default function HomePage() {
  const { currentUser, userSubjects, setActiveSubject } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [masteryScore, setMasteryScore] = useState<number>(780);
  const [streakDays, setStreakDays] = useState<number>(5);
  const [completedReviews, setCompletedReviews] = useState<number>(8);
  const [errorCards, setErrorCards] = useState<ErrorNotebookCard[]>([]);

  useEffect(() => {
    const stats = loadUserStats(currentUser.id);
    setMasteryScore(stats.masteryScore);
    setStreakDays(stats.streakDays);
    setCompletedReviews(stats.completedReviews);
    setErrorCards(loadErrorNotebook(currentUser.id));
  }, [currentUser.id]);

  const updateScoreAndPersist = (deltaScore: number, incrementReviews: boolean = true) => {
    setMasteryScore((prev) => {
      const nextScore = Math.min(1000, prev + deltaScore);
      const nextReviews = incrementReviews ? completedReviews + 1 : completedReviews;
      if (incrementReviews) setCompletedReviews(nextReviews);
      saveUserStats({ masteryScore: nextScore, streakDays, completedReviews: nextReviews }, currentUser.id);
      return nextScore;
    });
  };

  const activeErrorCards = getActiveErrorCards(errorCards);
  const quickActions = [
    { tab: 'routines' as const, title: 'Rotina Dia Normal', desc: 'Fluxo guiado de 45 min', icon: Zap, color: '#11C76F' },
    { tab: 'review' as const, title: 'Explicar por Voz', desc: 'Técnica de Feynman + OCR', icon: Mic, color: '#3B82F6' },
    { tab: 'gradebook' as const, title: 'Boletim Escolar', desc: 'Notas, pesos & metas', icon: GraduationCap, color: '#F59E0B' },
  ];

  return (
    <main className="w-full">
      <ProfileHeader onOpenSubjectsModal={() => setIsSubjectModalOpen(true)} />

      {activeTab === 'dashboard' && (
        <section className="space-y-5 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wider">
                Score TRI • {currentUser.schoolGrade}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#F59E0B]">
                <Flame className="w-3.5 h-3.5" /> {streakDays} dias seguidos
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
              💡 <strong className="text-white">{completedReviews} revisões ativas</strong> concluídas em{' '}
              <strong className="text-white">{userSubjects.length} disciplinas</strong>.
            </p>
          </div>

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
                    ? 'Questões erradas prontas para revisão espaçada.'
                    : 'Zero erros pendentes! Pratique um simulado.'}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map(({ tab, title, desc, icon: Icon }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#11C76F]/50 transition-all text-left min-h-[56px]"
              >
                <div className="p-2.5 rounded-xl bg-[#11C76F]/10 text-[#11C76F] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs text-[#8E8E93] truncate">{desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8E8E93]" />
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Suas Disciplinas ({userSubjects.length})</h2>
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
                    setActiveSubject(subj.name);
                    setActiveTab('quiz');
                  }}
                  className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#11C76F] text-left transition-all min-h-[72px] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-base">{subj.icon}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1C1C1C] text-[#8E8E93] border border-[#262626]">
                      {subj.topics.length} tópicos
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{subj.name}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'review' && (
        <ActiveStudyTab
          onScoreGain={(pts) => updateScoreAndPersist(pts, true)}
          onNavigateToQuiz={() => setActiveTab('quiz')}
        />
      )}

      {activeTab === 'routines' && (
        <RoutineManager onScoreGain={(pts) => updateScoreAndPersist(pts, true)} />
      )}

      {activeTab === 'quiz' && (
        <ErrorNotebookTab
          errorCards={errorCards}
          onUpdateErrorCards={setErrorCards}
          onScoreGain={(pts, inc = true) => updateScoreAndPersist(pts, inc)}
        />
      )}

      {activeTab === 'gradebook' && <GradebookView />}

      <OnboardingWizard />
      <SubjectContentModal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
