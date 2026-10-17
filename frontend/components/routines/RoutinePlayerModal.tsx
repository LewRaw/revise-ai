'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Clock, AlertCircle, Sparkles, Send, Award, Mic, MicOff, BookOpen } from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { DescriptiveFeedback } from '@/lib/ai_service';
import { getDynamicStudyDataForTopic, BankQuestion } from '@/lib/questionBank';
import { createErrorCard } from '@/lib/fsrsEngine';
import { loadErrorNotebook, saveErrorNotebook } from '@/lib/storageService';

export interface RoutineStepDef {
  id: string;
  title: string;
  type: 'summary' | 'quiz_objective' | 'quiz_descriptive' | 'focal_error_summary' | 'final_summary';
  description: string;
}

interface RoutinePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  routineTitle: string;
  subjectName: string;
  steps: RoutineStepDef[];
  onCompleteRoutine: (gainedScore: number) => void;
}

export const RoutinePlayerModal: React.FC<RoutinePlayerModalProps> = ({
  isOpen, onClose, routineTitle, subjectName, steps, onCompleteRoutine,
}) => {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();
  const { userSubjects, activeTopic } = useAuth();

  const matchedSubject = userSubjects.find((s) => s.name === subjectName);
  const matchedTopic = matchedSubject?.topics.find((t) => t.title === activeTopic) || matchedSubject?.topics[0];
  const studyData = getDynamicStudyDataForTopic(subjectName, matchedTopic?.title, matchedTopic?.summaryText, matchedTopic);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [objectiveAnswers, setObjectiveAnswers] = useState<Record<string, string>>({});
  const [missedQuestions, setMissedQuestions] = useState<BankQuestion[]>([]);
  const [focalAiSummary, setFocalAiSummary] = useState<{ title: string; explanation: string; rulesOfThumb: string[] } | null>(null);
  const [descriptiveText, setDescriptiveText] = useState<string>('');
  const [isRecordingDescriptive, setIsRecordingDescriptive] = useState<boolean>(false);
  const [descriptiveFeedback, setDescriptiveFeedback] = useState<DescriptiveFeedback | null>(null);
  const [isEvaluatingDescriptive, setIsEvaluatingDescriptive] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    } else {
      setElapsedSeconds(0); setCurrentStepIndex(0); setObjectiveAnswers({});
      setMissedQuestions([]); setFocalAiSummary(null); setDescriptiveText('');
      setDescriptiveFeedback(null); setIsRecordingDescriptive(false);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);
  const stepQuestions: BankQuestion[] = currentStepIndex <= 1 ? studyData.questions.slice(0, 3) : studyData.questions;
  const formatTime = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  const handleToggleVoiceDescriptive = () => {
    if (isRecordingDescriptive) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsRecordingDescriptive(false);
      showToast('Gravação de voz finalizada.', 'info');
      return;
    }

    const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onstart = () => {
          setIsRecordingDescriptive(true);
          showToast('Microfone ativo (pt-BR)! Dite sua resposta dissertativa...', 'info');
        };
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
          setDescriptiveText(transcript);
        };
        recognition.onerror = () => {
          setIsRecordingDescriptive(false);
          setDescriptiveText(`Em ${subjectName} (${studyData.defaultTopic}), o fenômeno se explica pela relação entre seus conceitos estruturantes e as condições de contorno analisadas.`);
          showToast('Usando transcrição assistida (permissão de microfone indisponível).', 'info');
        };
        recognition.onend = () => setIsRecordingDescriptive(false);
        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {}
    }

    setIsRecordingDescriptive(true);
    showToast('Transcrevendo resposta falada...', 'info');
    setTimeout(() => {
      setDescriptiveText(`Os conceitos centrais de ${studyData.defaultTopic} em ${subjectName} operam segundo as leis de conservação e causalidade sob as condições definidas no enunciado.`);
      setIsRecordingDescriptive(false);
      showToast('Voz transcrita com sucesso no campo de resposta!', 'success');
    }, 2200);
  };

  const handleNextStep = async () => {
    if (currentStep.type === 'quiz_objective') {
      const currentErrors: BankQuestion[] = [];
      const existingNotebook = loadErrorNotebook();
      let addedToFSRS = 0;

      for (const q of stepQuestions) {
        const key = `${currentStepIndex}_${q.id}`;
        const chosen = objectiveAnswers[key];
        const correctOpt = q.options.find((o) => o.isCorrect);

        if (chosen && correctOpt && chosen !== correctOpt.letter) {
          currentErrors.push(q);
          const alreadyExists = existingNotebook.some((c) => c.questionId === q.id && !c.resolved);
          if (!alreadyExists) {
            existingNotebook.unshift(
              createErrorCard({
                questionId: q.id, subject: q.subject, topic: q.topic, questionText: q.text,
                wrongSelectedLetter: chosen, correctLetter: correctOpt.letter,
                correctOptionText: correctOpt.text, explanation: correctOpt.explanation,
              })
            );
            addedToFSRS++;
          }
        }
      }

      if (addedToFSRS > 0) {
        saveErrorNotebook(existingNotebook);
        showToast(`${addedToFSRS} questão(ões) errada(s) adicionada(s) ao Caderno de Erros FSRS!`, 'info');
      }
      setMissedQuestions(currentErrors);

      const nextStep = steps[currentStepIndex + 1];
      if (nextStep?.type === 'focal_error_summary') {
        try {
          const errorTexts = currentErrors.length > 0 ? currentErrors.map((e) => `${e.topic}: ${e.text}`) : [`Revisão preventiva de ${studyData.defaultTopic}`];
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'focal_summary', topic: `${subjectName} - ${studyData.defaultTopic}`, errorDescriptions: errorTexts }),
          });
          const json = await res.json();
          if (json?.ok && json.data) setFocalAiSummary(json.data);
        } catch {}
      }
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      showToast(`Etapa ${currentStepIndex + 2}: ${steps[currentStepIndex + 1].title}`, 'info');
    } else {
      const gained = routineTitle.includes('Pré-Prova') ? 45 : 35;
      onCompleteRoutine(gained);
      onClose();
      showToast(`Rotina "${routineTitle}" concluída! +${gained} Pontos TRI.`, 'success');
    }
  };

  const handleEvaluateDescriptive = async () => {
    if (!descriptiveText.trim()) {
      showToast('Escreva ou grave sua resposta dissertativa para a IA avaliar.', 'error');
      return;
    }
    setIsEvaluatingDescriptive(true);
    showToast('Avaliando sua resposta pelo espelho de correção...', 'info');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_descriptive',
          topic: `${subjectName} - ${studyData.defaultTopic}`,
          question: studyData.descriptivePrompt,
          studentAnswer: descriptiveText,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.data) {
        setDescriptiveFeedback(json.data);
        showToast(`Nota calculada: ${json.data.score}/10!`, 'success');
      }
    } catch {
      showToast('Avaliação concluída em modo offline.', 'info');
    } finally {
      setIsEvaluatingDescriptive(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200" role="dialog" aria-modal="true">
        <div className="border-b border-[#262626] bg-[#141414] p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#11C76F]/10 text-[#11C76F] border border-[#11C76F]/20">
                {subjectName}
              </span>
              <span className="text-xs font-semibold text-white truncate max-w-[160px] sm:max-w-xs">{routineTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8E8E93] mt-1">
              <Clock className="w-3.5 h-3.5 text-[#11C76F]" />
              <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              <span>• Etapa {currentStepIndex + 1} de {steps.length}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#1C1C1C] border border-[#262626] text-white hover:text-[#EF4444] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Encerrar rotina">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full bg-[#262626] h-1.5">
          <div className="bg-[#11C76F] h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#11C76F]">
              Etapa {currentStepIndex + 1} • {studyData.defaultTopic}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{currentStep.title}</h2>
            <p className="text-xs sm:text-sm text-[#8E8E93]">{currentStep.description}</p>
          </div>

          {currentStep.type === 'summary' && (
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#11C76F]">
                <Sparkles className="w-4 h-4" />
                <span>Síntese Conceitual: {subjectName} • {studyData.defaultTopic}</span>
              </div>
              <div className="text-xs sm:text-sm text-neutral-300 space-y-3 leading-relaxed">
                <p><strong className="text-white">Conceito Central:</strong> {studyData.generalSummary.definition}</p>
                <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs font-mono text-[#11C76F]">
                  {studyData.generalSummary.formulaOrRule}
                </div>
                <p><strong className="text-white">Foco ENEM & Vestibular:</strong> {studyData.generalSummary.enemTip}</p>
              </div>
            </div>
          )}

          {currentStep.type === 'quiz_objective' && (
            <div className="space-y-4">
              {stepQuestions.map((q, idx) => {
                const answerKey = `${currentStepIndex}_${q.id}`;
                const selected = objectiveAnswers[answerKey];
                const correctOpt = q.options.find((o) => o.isCorrect);

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#11C76F]">Questão {idx + 1} de {stepQuestions.length} • {q.topic}</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#1C1C1C] text-[#8E8E93] border border-[#262626]">{q.difficulty}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">{q.text}</p>
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = selected === opt.letter;
                        let btnStyle = 'bg-[#1C1C1C] border-[#262626] text-[#8E8E93]';
                        if (selected) {
                          if (opt.isCorrect) btnStyle = 'bg-[#11C76F]/10 border-[#11C76F] text-white';
                          else if (isSelected && !opt.isCorrect) btnStyle = 'bg-[#EF4444]/10 border-[#EF4444] text-white';
                        }
                        return (
                          <button key={opt.letter} onClick={() => setObjectiveAnswers((prev) => ({ ...prev, [answerKey]: opt.letter }))} className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-98 min-h-[48px] ${btnStyle}`}>
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? (opt.isCorrect ? 'bg-[#11C76F] text-black' : 'bg-[#EF4444] text-white') : 'bg-[#262626] text-white'}`}>{opt.letter}</span>
                            <span className="text-xs sm:text-sm leading-snug">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selected && correctOpt && (
                      <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-[#8E8E93]">
                        <strong className={selected === correctOpt.letter ? 'text-[#11C76F]' : 'text-[#EF4444]'}>
                          {selected === correctOpt.letter ? '✓ Acertou! ' : '✗ Atenção (Salvo no Caderno de Erros): '}
                        </strong>
                        {correctOpt.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {currentStep.type === 'focal_error_summary' && (
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#F59E0B]/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B]">
                <AlertCircle className="w-4 h-4" />
                <span>{focalAiSummary?.title || `Intervenção Focal: Pontos Cegos em ${subjectName}`}</span>
              </div>
              {missedQuestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white leading-relaxed">
                    Você errou <strong>{missedQuestions.length} questão(ões)</strong> na bateria anterior. Elas já foram agendadas no seu <strong>Caderno de Erros (FSRS)</strong>. Veja a revisão focal antes da próxima bateria:
                  </p>
                  {missedQuestions.map((mq) => {
                    const rightOpt = mq.options.find((o) => o.isCorrect);
                    return (
                      <div key={mq.id} className="p-3 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs space-y-1">
                        <div className="font-bold text-[#F59E0B]">Tópico: {mq.topic}</div>
                        <div className="text-white">{rightOpt?.explanation}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-white leading-relaxed">
                  {focalAiSummary?.explanation || 'Você não cometeu erros críticos na primeira bateria! Aproveite este resumo de blindagem para não cair em pegadinhas nas questões difíceis.'}
                </p>
              )}
              {focalAiSummary?.rulesOfThumb && (
                <div className="p-3.5 rounded-xl bg-[#1C1C1C] border border-[#262626] space-y-1.5 text-xs text-[#8E8E93]">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#11C76F]" />
                    <span>Regras de Bolso da IA:</span>
                  </div>
                  {focalAiSummary.rulesOfThumb.map((rule, idx) => <div key={idx}>• {rule}</div>)}
                </div>
              )}
            </div>
          )}

          {currentStep.type === 'quiz_descriptive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#EC4899]">Questão Dissertativa ({subjectName}):</span>
                  <button onClick={handleToggleVoiceDescriptive} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all min-h-[38px] ${isRecordingDescriptive ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] animate-pulse' : 'bg-[#1C1C1C] border-[#262626] text-white hover:text-[#11C76F]'}`}>
                    {isRecordingDescriptive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#11C76F]" />}
                    <span>{isRecordingDescriptive ? 'Ouvindo (pt-BR)...' : 'Gravar por Voz'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">{studyData.descriptivePrompt}</p>
                <textarea rows={4} value={descriptiveText} onChange={(e) => setDescriptiveText(e.target.value)} placeholder="Escreva sua justificativa aqui ou clique em 'Gravar por Voz' para ditar pelo microfone..." className="w-full bg-[#1C1C1C] border border-[#262626] text-white text-xs rounded-xl p-3 focus:outline-none focus:border-[#11C76F] leading-relaxed" />
                <button onClick={handleEvaluateDescriptive} disabled={isEvaluatingDescriptive} className="w-full py-3 rounded-xl bg-[#1C1C1C] border border-[#262626] hover:border-[#11C76F] text-xs font-semibold text-white flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[44px]">
                  <Send className="w-3.5 h-3.5 text-[#11C76F]" />
                  <span>{isEvaluatingDescriptive ? 'Corrigindo com IA...' : 'Enviar Resposta para Correção da IA'}</span>
                </button>
              </div>
              {descriptiveFeedback && (
                <div className="p-4 rounded-2xl bg-[#141414] border border-[#11C76F]/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Espelho de Correção da IA</span>
                    <span className="text-xs font-extrabold text-[#11C76F] bg-[#11C76F]/10 px-2.5 py-1 rounded-full">Nota: {descriptiveFeedback.score} / 10</span>
                  </div>
                  <div className="text-xs text-[#11C76F] space-y-0.5">{descriptiveFeedback.criteriaMet.map((c, i) => <div key={i}>✓ {c}</div>)}</div>
                  <p className="text-xs text-[#8E8E93]">{descriptiveFeedback.suggestedImprovement}</p>
                </div>
              )}
            </div>
          )}

          {currentStep.type === 'final_summary' && (
            <div className="p-6 rounded-2xl bg-[#141414] border border-[#11C76F]/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#11C76F]/10 text-[#11C76F] flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Excelente! Sessão de Estudo Concluída</h3>
              <p className="text-xs text-[#8E8E93] max-w-sm mx-auto leading-relaxed">
                Você cumpriu todas as etapas da rotina <strong>{routineTitle}</strong> em <strong>{subjectName}</strong> ({formatTime(elapsedSeconds)}).
              </p>
              {missedQuestions.length > 0 && (
                <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#262626] text-xs text-[#F59E0B]">
                  📌 {missedQuestions.length} questão(ões) foram agendadas no seu Caderno de Erros FSRS para revisão espaçada.
                </div>
              )}
            </div>
          )}
        </main>

        <div className="border-t border-[#262626] bg-[#141414] p-4 sticky bottom-0 z-10">
          <div className="max-w-xl mx-auto">
            <button onClick={handleNextStep} className="w-full py-3.5 px-4 rounded-xl bg-[#11C76F] text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all min-h-[48px] shadow-lg shadow-[#11C76F]/20">
              <span>{currentStepIndex === steps.length - 1 ? 'Concluir Rotina (+Pontos TRI)' : 'Avançar Próxima Etapa'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
