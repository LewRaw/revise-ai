'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, HelpCircle, Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { getDynamicStudyDataForTopic, BankQuestion } from '@/lib/questionBank';
import {
  createErrorCard,
  scheduleNextFsrsReview,
  getActiveErrorCards,
  ErrorNotebookCard,
  FsrsRating,
} from '@/lib/fsrsEngine';
import { saveErrorNotebook, TopicGeneratedStudyData } from '@/lib/storageService';

interface ErrorNotebookTabProps {
  errorCards: ErrorNotebookCard[];
  onUpdateErrorCards: (cards: ErrorNotebookCard[]) => void;
  onScoreGain: (points: number, incrementReviews?: boolean) => void;
}

export const ErrorNotebookTab: React.FC<ErrorNotebookTabProps> = ({
  errorCards,
  onUpdateErrorCards,
  onScoreGain,
}) => {
  const { showToast } = useToast();
  const {
    currentUser,
    userSubjects,
    activeSubject,
    activeTopic,
    setActiveSubject,
    setActiveTopic,
    updateTopicStudyData,
    consumeAiCredits,
  } = useAuth();

  const [revealedErrorIds, setRevealedErrorIds] = useState<Record<string, boolean>>({});
  const [quizQuestions, setQuizQuestions] = useState<BankQuestion[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);

  useEffect(() => {
    const activeSubObj = userSubjects.find((s) => s.name === activeSubject);
    const activeTopObj = activeSubObj?.topics.find((t) => t.title === activeTopic);
    const dynamicData = getDynamicStudyDataForTopic(
      activeSubject,
      activeTopic,
      activeTopObj?.summaryText,
      activeTopObj
    );
    setQuizQuestions(dynamicData.questions.map((q) => ({ ...q, selectedLetter: undefined })));
    setQuizSubmitted(false);
  }, [activeSubject, activeTopic, userSubjects]);

  const handleGenerateMoreQuestionsWithAi = async () => {
    const hasCredit = await consumeAiCredits(1);
    if (!hasCredit) {
      showToast('Créditos de IA esgotados no seu plano atual. Faça upgrade para continuar!', 'warning');
      return;
    }

    const activeSubObj = userSubjects.find((s) => s.name === activeSubject);
    const activeTopObj = activeSubObj?.topics.find((t) => t.title === activeTopic);

    setIsGeneratingAiQuiz(true);
    showToast(`✨ IA gerando novas questões inéditas para ${activeSubject} • ${activeTopic}...`, 'info');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_topic_material',
          subject: activeSubject,
          topicTitle: activeTopic,
          userNotes: activeTopObj?.generatedStudyData?.userNotes || activeTopObj?.summaryText || '',
          difficulty: activeTopObj?.difficulty || 'medium',
          schoolGrade: currentUser.schoolGrade,
          targetExam: currentUser.targetExam,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.data) {
        const generated: TopicGeneratedStudyData = {
          summaryDefinition: json.data.summaryDefinition,
          formulaOrRule: json.data.formulaOrRule,
          enemTip: json.data.enemTip,
          descriptivePrompt: json.data.descriptivePrompt,
          questions: json.data.questions || [],
          userNotes: activeTopObj?.summaryText,
          source: json.data.source,
          updatedAt: new Date().toISOString(),
        };
        updateTopicStudyData(activeSubject, activeTopic, generated);
        if (Array.isArray(generated.questions) && generated.questions.length > 0) {
          setQuizQuestions(generated.questions.map((q) => ({ ...q, selectedLetter: undefined })));
          setQuizSubmitted(false);
        }
        showToast('Novas questões personalizadas geradas pela IA e carregadas no simulado!', 'success');
      } else {
        showToast('Não foi possível gerar novas questões agora. Tente novamente.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao gerar questões com IA.', 'error');
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  const handleSelectOption = (questionId: string, letter: string) => {
    if (quizSubmitted) return;
    setQuizQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, selectedLetter: letter } : q)));
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
      onUpdateErrorCards(currentNotebook);
      saveErrorNotebook(currentNotebook, currentUser.id);
    }

    const gainedScore = correctCount * 15;
    onScoreGain(gainedScore, true);
    showToast(
      `Simulado finalizado! Acertou ${correctCount}/${quizQuestions.length}. ${
        newErrorsAdded > 0 ? `${newErrorsAdded} erro(s) salvos no FSRS.` : 'Gabaritou!'
      }`,
      'success'
    );
  };

  const handleResetQuiz = () => {
    setQuizSubmitted(false);
    setQuizQuestions((prev) => prev.map((q) => ({ ...q, selectedLetter: undefined })));
    showToast('Simulado reiniciado para novo treino.', 'info');
  };

  const handleRateErrorCard = (cardId: string, rating: FsrsRating) => {
    const updated = errorCards.map((c) => (c.id === cardId ? scheduleNextFsrsReview(c, rating) : c));
    onUpdateErrorCards(updated);
    saveErrorNotebook(updated, currentUser.id);
    if (rating === 'good' || rating === 'easy') {
      onScoreGain(5, false);
      showToast('Conceito fortalecido na memória de longo prazo (FSRS)! +5 pts', 'success');
    } else {
      showToast('Card reagendado pelo algoritmo FSRS para reforço em breve.', 'info');
    }
  };

  const activeErrorCards = getActiveErrorCards(errorCards);
  const currentSubjectObj = userSubjects.find((s) => s.name === activeSubject) || userSubjects[0];

  return (
    <section className="space-y-5 animate-in fade-in duration-200">
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {userSubjects.map((subj) => (
            <button
              key={subj.id}
              onClick={() => setActiveSubject(subj.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[44px] flex items-center gap-1.5 ${
                activeSubject === subj.name
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
                        <button onClick={() => handleRateErrorCard(card.id, 'again')} className="py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] font-semibold min-h-[38px]">
                          Errei (1d)
                        </button>
                        <button onClick={() => handleRateErrorCard(card.id, 'good')} className="py-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] font-semibold min-h-[38px]">
                          Bom (+Dias)
                        </button>
                        <button onClick={() => handleRateErrorCard(card.id, 'easy')} className="py-2 rounded-lg bg-[#11C76F]/10 border border-[#11C76F]/30 text-[#11C76F] font-semibold min-h-[38px]">
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

      {/* Header do Simulado com Geração Sob Demanda IA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#141414] border border-[#262626]">
        <div>
          <h2 className="text-base font-bold text-white">
            📝 Simulado: {activeSubject} • {activeTopic}
          </h2>
          <p className="text-xs text-[#8E8E93]">
            {quizQuestions.length} questões estilo ENEM • Erros vão automaticamente para o FSRS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isGeneratingAiQuiz}
            onClick={handleGenerateMoreQuestionsWithAi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#11C76F]/15 border border-[#11C76F]/40 text-xs font-bold text-[#11C76F] hover:bg-[#11C76F] hover:text-black transition-all min-h-[40px] disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingAiQuiz ? 'Gerando com IA...' : '✨ Gerar +Questões IA'}</span>
          </button>
          {quizSubmitted && (
            <button
              onClick={handleResetQuiz}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-white hover:text-[#11C76F] transition-colors min-h-[40px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refazer
            </button>
          )}
        </div>
      </div>

      {/* Lista de Questões */}
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
                  if (opt.isCorrect) optionClasses = 'bg-[#11C76F]/10 border-[#11C76F] text-white';
                  else if (isSelected && !opt.isCorrect) optionClasses = 'bg-[#EF4444]/10 border-[#EF4444] text-white';
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
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-[#11C76F] text-black' : 'bg-[#262626] text-white'}`}>
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
  );
};
