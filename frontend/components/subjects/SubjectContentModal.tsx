'use client';

import React, { useState } from 'react';
import { BookOpen, Layers, Plus, Check, X, Sparkles, FileText, RefreshCw } from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserSubjectWithContents, SubjectTopicItem, TopicGeneratedStudyData } from '@/lib/storageService';

interface SubjectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Base / Fácil' },
  { id: 'medium', label: 'Intermediário' },
  { id: 'hard', label: 'Avançado / ENEM' },
] as const;

export function SubjectContentModal({ isOpen, onClose }: SubjectContentModalProps) {
  const {
    currentUser, userSubjects, activeSubject, activeTopic, setActiveSubject, setActiveTopic,
    addCustomSubject, addContentTopic, updateTopicStudyData, consumeAiCredits,
  } = useAuth();
  const { showToast } = useToast();
  useBodyScrollLock(isOpen);

  const [mode, setMode] = useState<'browse' | 'new_subject' | 'new_topic'>('browse');
  const [newSubName, setNewSubName] = useState('');
  const [newSubArea, setNewSubArea] = useState<UserSubjectWithContents['area']>('exatas');
  const [newSubIcon, setNewSubIcon] = useState('📘');
  const [newSubInitialTopic, setNewSubInitialTopic] = useState('');
  const [newSubNotes, setNewSubNotes] = useState('');
  const [newSubDifficulty, setNewSubDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSummary, setNewTopicSummary] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [regeneratingTopicId, setRegeneratingTopicId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubjectObj = userSubjects.find((s) => s.name === activeSubject) || userSubjects[0];
  const inputCls = 'w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary focus:outline-none focus:border-brand';

  const requestAiTopicMaterial = async (
    subject: string, topicTitle: string, userNotes: string, difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<TopicGeneratedStudyData | undefined> => {
    const hasCredit = await consumeAiCredits(1);
    if (!hasCredit) {
      showToast('Créditos de IA esgotados no plano atual. Faça upgrade para geração ilimitada!', 'warning');
      return undefined;
    }
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_topic_material', subject, topicTitle, userNotes, difficulty,
          schoolGrade: currentUser.schoolGrade, targetExam: currentUser.targetExam,
        }),
      });
      const json = await res.json();
      if (json?.ok && json.data) {
        return {
          summaryDefinition: json.data.summaryDefinition,
          formulaOrRule: json.data.formulaOrRule,
          enemTip: json.data.enemTip,
          descriptivePrompt: json.data.descriptivePrompt,
          questions: json.data.questions || [],
          userNotes,
          source: json.data.source,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('Erro ao gerar material de estudo com IA:', e);
    }
    return undefined;
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSub = newSubName.trim();
    if (!cleanSub) return showToast('Informe o nome da nova disciplina.', 'warning');
    const initialTopic = newSubInitialTopic.trim() || `Fundamentos de ${cleanSub}`;
    setIsGeneratingAi(true);
    const generatedStudyData = await requestAiTopicMaterial(cleanSub, initialTopic, newSubNotes.trim(), newSubDifficulty);
    setIsGeneratingAi(false);

    addCustomSubject({
      name: cleanSub, area: newSubArea, color: '#11C76F', icon: newSubIcon,
      initialTopicTitle: initialTopic,
      initialSummaryText: generatedStudyData?.summaryDefinition || newSubNotes.trim() || undefined,
      generatedStudyData,
    });
    showToast(`Disciplina "${cleanSub}" criada com resumo, fórmulas e questões geradas por IA!`, 'success');
    setNewSubName(''); setNewSubInitialTopic(''); setNewSubNotes(''); setMode('browse');
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = newTopicTitle.trim();
    if (!cleanTopic) return showToast('Informe o título do conteúdo ou assunto.', 'warning');
    const targetSubName = currentSubjectObj?.name || activeSubject;
    setIsGeneratingAi(true);
    const generatedStudyData = await requestAiTopicMaterial(targetSubName, cleanTopic, newTopicSummary.trim(), newTopicDifficulty);
    setIsGeneratingAi(false);

    addContentTopic(
      targetSubName, cleanTopic,
      generatedStudyData?.summaryDefinition || newTopicSummary.trim() || undefined,
      newTopicDifficulty, generatedStudyData
    );
    showToast(`Conteúdo "${cleanTopic}" adicionado em ${targetSubName} com resumo, fórmulas e questões sob medida!`, 'success');
    setNewTopicTitle(''); setNewTopicSummary(''); setMode('browse');
  };

  const handleRegenerateTopicWithAi = async (topic: SubjectTopicItem) => {
    const targetSubName = currentSubjectObj?.name || activeSubject;
    setRegeneratingTopicId(topic.id);
    setIsGeneratingAi(true);
    const generated = await requestAiTopicMaterial(
      targetSubName, topic.title, topic.generatedStudyData?.userNotes || topic.summaryText || '', topic.difficulty || 'medium'
    );
    setIsGeneratingAi(false);
    setRegeneratingTopicId(null);
    if (generated) {
      updateTopicStudyData(targetSubName, topic.title, generated);
      setActiveTopic(topic.title);
      showToast(`"${topic.title}" personalizado com novo resumo, fórmulas e questões da IA!`, 'success');
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="bg-surface border border-borderSubtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-textPrimary">Disciplinas & Conteúdos IA</h2>
                <p className="text-xs text-textSecondary">Personalize assuntos e gere resumos, fórmulas e questões sob medida</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Fechar gerenciador de disciplinas" className="min-w-[44px] min-h-[44px] rounded-xl bg-oled border border-borderSubtle flex items-center justify-center text-textSecondary hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 my-3">
            {[
              { id: 'browse', label: `Explorar (${userSubjects.length})`, icon: BookOpen },
              { id: 'new_topic', label: 'Novo Conteúdo', icon: Plus },
              { id: 'new_subject', label: 'Nova Matéria', icon: Plus },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} type="button" disabled={isGeneratingAi} onClick={() => setMode(tab.id as any)} className={`min-h-[40px] rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${mode === tab.id ? 'bg-brand text-black border-brand' : 'bg-oled text-textSecondary border-borderSubtle'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isGeneratingAi && (
            <div className="mb-3 p-3 rounded-xl bg-brand/15 border border-brand text-xs text-brand font-semibold flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>✨ IA gerando resumo, fórmulas e questões sob medida...</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {mode === 'browse' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-textSecondary block mb-2">1. Selecione a Disciplina Ativa:</label>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                    {userSubjects.map((sub) => (
                      <button key={sub.id} type="button" onClick={() => setActiveSubject(sub.name)} className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${sub.name === activeSubject ? 'bg-brand/15 border-brand text-brand' : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'}`}>
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surfaceHighlight text-textSecondary">{sub.topics.length}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-textSecondary">2. Conteúdos de <strong className="text-textPrimary">{currentSubjectObj?.name}</strong>:</label>
                    <button type="button" onClick={() => setMode('new_topic')} className="text-xs text-brand font-bold hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Adicionar assunto
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentSubjectObj?.topics.map((topic) => {
                      const isSelected = topic.title === activeTopic;
                      const isRegenerating = regeneratingTopicId === topic.id;
                      return (
                        <div key={topic.id} className={`w-full p-3 rounded-xl border transition-all space-y-2 ${isSelected ? 'bg-brand/15 border-brand text-textPrimary' : 'bg-oled border-borderSubtle text-textSecondary'}`}>
                          <button type="button" onClick={() => { setActiveTopic(topic.title); showToast(`Foco alterado para: ${currentSubjectObj.name} • ${topic.title}`, 'info'); }} className="w-full text-left flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-textPrimary truncate">{topic.title}</div>
                              {topic.summaryText ? (
                                <div className="text-[11px] text-textSecondary line-clamp-2 mt-0.5">{topic.summaryText}</div>
                              ) : (
                                <div className="text-[10px] text-brand flex items-center gap-1 mt-0.5">
                                  <Sparkles className="w-3 h-3" /> Banco de questões & resumo IA ativo
                                </div>
                              )}
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                          </button>

                          <div className="flex items-center justify-between pt-1 border-t border-borderSubtle/60">
                            <span className="text-[10px] text-textSecondary">
                              {topic.customQuestions?.length ? `${topic.customQuestions.length} questões IA sob medida` : 'Pronto para estudo ativo'}
                            </span>
                            <button type="button" disabled={isGeneratingAi} onClick={() => handleRegenerateTopicWithAi(topic)} className="min-h-[32px] px-2.5 py-1 rounded-lg bg-surface border border-brand/40 text-[11px] font-bold text-brand hover:bg-brand/15 flex items-center gap-1 transition-colors">
                              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                              <span>✨ Personalizar / Recriar com IA</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {mode === 'new_topic' && (
              <form onSubmit={handleCreateTopic} className="space-y-3">
                <div className="p-3 rounded-xl bg-oled border border-borderSubtle text-xs text-textSecondary">
                  Cadastrando conteúdo em <strong className="text-brand">{currentSubjectObj?.name}</strong>. A IA criará resumo específico, fórmulas/regras e questões inéditas baseadas no seu foco (1 crédito IA).
                </div>
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">Título do Conteúdo / Assunto *</label>
                  <input type="text" value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} placeholder="Ex: Óptica Geométrica, Revolução Industrial, Logaritmos..." className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">O que você está estudando / Dúvidas ou Anotações do Caderno</label>
                  <textarea rows={3} value={newTopicSummary} onChange={(e) => setNewTopicSummary(e.target.value)} placeholder="Descreva o foco da sua prova, fórmulas que tem dúvida ou cole anotações para a IA personalizar o resumo e as questões..." className="w-full bg-oled border border-borderSubtle rounded-xl p-3 text-xs text-textPrimary focus:outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">Nível / Foco das Questões</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <button key={d.id} type="button" onClick={() => setNewTopicDifficulty(d.id)} className={`min-h-[44px] rounded-xl text-xs font-bold border ${newTopicDifficulty === d.id ? 'bg-brand/15 border-brand text-brand' : 'bg-oled border-borderSubtle text-textSecondary'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isGeneratingAi} className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brandHover text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  <FileText className="w-4 h-4" />
                  {isGeneratingAi ? '✨ IA gerando resumo, fórmulas e questões sob medida...' : `Gerar com IA & Salvar em ${currentSubjectObj?.name}`}
                </button>
              </form>
            )}

            {mode === 'new_subject' && (
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">Nome da Nova Disciplina *</label>
                  <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Ex: Filosofia, Sociologia, Literatura, Biotecnologia..." className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-textSecondary block mb-1 font-medium">Área do Conhecimento</label>
                    <select aria-label="Área do conhecimento" value={newSubArea} onChange={(e) => setNewSubArea(e.target.value as UserSubjectWithContents['area'])} className={inputCls}>
                      <option value="exatas">Matemática / Exatas</option>
                      <option value="natureza">Ciências da Natureza</option>
                      <option value="humanas">Ciências Humanas</option>
                      <option value="linguagens">Linguagens & Códigos</option>
                      <option value="outros">Técnico / Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-textSecondary block mb-1 font-medium">Ícone</label>
                    <select aria-label="Ícone da disciplina" value={newSubIcon} onChange={(e) => setNewSubIcon(e.target.value)} className={inputCls}>
                      <option value="📘">📘 Livro Azul</option>
                      <option value="🧠">🧠 Filosofia / Mente</option>
                      <option value="🌎">🌎 Sociedade / Mundo</option>
                      <option value="💻">💻 Tecnologia</option>
                      <option value="🎨">🎨 Artes / Literatura</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">Primeiro Conteúdo / Assunto da Disciplina</label>
                  <input type="text" value={newSubInitialTopic} onChange={(e) => setNewSubInitialTopic(e.target.value)} placeholder="Ex: Ética em Aristóteles, Interpretação Textual..." className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">O que está estudando nesta matéria? (Contexto para a IA)</label>
                  <textarea rows={2} value={newSubNotes} onChange={(e) => setNewSubNotes(e.target.value)} placeholder="Descreva os temas da prova, autores ou fórmulas que deseja focar..." className="w-full bg-oled border border-borderSubtle rounded-xl p-3 text-xs text-textPrimary focus:outline-none focus:border-brand" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button key={d.id} type="button" onClick={() => setNewSubDifficulty(d.id)} className={`min-h-[40px] rounded-xl text-xs font-bold border ${newSubDifficulty === d.id ? 'bg-brand/15 border-brand text-brand' : 'bg-oled border-borderSubtle text-textSecondary'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={isGeneratingAi} className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brandHover text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  <Plus className="w-4 h-4" />
                  {isGeneratingAi ? '✨ IA gerando resumo, fórmulas e questões sob medida...' : 'Criar Disciplina com IA & Sincronizar Boletim'}
                </button>
              </form>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-borderSubtle flex items-center justify-between">
            <div className="text-[11px] text-textSecondary truncate">
              Ativo: <strong className="text-brand">{activeSubject}</strong> • {activeTopic}
            </div>
            <button type="button" onClick={onClose} className="min-h-[44px] px-4 rounded-xl bg-surfaceHighlight text-textPrimary text-xs font-bold">
              Concluído
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
