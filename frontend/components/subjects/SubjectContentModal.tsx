'use client';

import React, { useState } from 'react';
import { BookOpen, Layers, Plus, Check, X, Sparkles, FileText } from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { UserSubjectWithContents } from '@/lib/storageService';

interface SubjectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubjectContentModal({ isOpen, onClose }: SubjectContentModalProps) {
  const {
    userSubjects,
    activeSubject,
    activeTopic,
    setActiveSubject,
    setActiveTopic,
    addCustomSubject,
    addContentTopic,
  } = useAuth();
  const { showToast } = useToast();
  useBodyScrollLock(isOpen);

  const [mode, setMode] = useState<'browse' | 'new_subject' | 'new_topic'>('browse');
  const [newSubName, setNewSubName] = useState('');
  const [newSubArea, setNewSubArea] = useState<UserSubjectWithContents['area']>('exatas');
  const [newSubIcon, setNewSubIcon] = useState('📘');
  const [newSubInitialTopic, setNewSubInitialTopic] = useState('');

  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSummary, setNewTopicSummary] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  if (!isOpen) return null;

  const currentSubjectObj =
    userSubjects.find((s) => s.name === activeSubject) || userSubjects[0];

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      showToast('Informe o nome da nova disciplina.', 'warning');
      return;
    }
    addCustomSubject({
      name: newSubName.trim(),
      area: newSubArea,
      color: '#11C76F',
      icon: newSubIcon,
      initialTopicTitle: newSubInitialTopic.trim() || `Fundamentos de ${newSubName.trim()}`,
    });
    showToast(`Disciplina "${newSubName.trim()}" adicionada à sua grade e ao Boletim!`, 'success');
    setNewSubName('');
    setNewSubInitialTopic('');
    setMode('browse');
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) {
      showToast('Informe o título do conteúdo ou assunto.', 'warning');
      return;
    }
    const targetSubName = currentSubjectObj?.name || activeSubject;
    addContentTopic(targetSubName, newTopicTitle.trim(), newTopicSummary.trim(), newTopicDifficulty);
    showToast(
      `Conteúdo "${newTopicTitle.trim()}" adicionado em ${targetSubName}! Questões e resumos já estão prontos.`,
      'success'
    );
    setNewTopicTitle('');
    setNewTopicSummary('');
    setMode('browse');
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="bg-surface border border-borderSubtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-textPrimary">Disciplinas & Conteúdos</h2>
                <p className="text-xs text-textSecondary">
                  Escolha o assunto ativo ou cadastre novas matérias e tópicos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar gerenciador de disciplinas"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-oled border border-borderSubtle flex items-center justify-center text-textSecondary hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Ações Rápidas */}
          <div className="grid grid-cols-3 gap-2 my-3">
            <button
              type="button"
              onClick={() => setMode('browse')}
              className={`min-h-[40px] rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                mode === 'browse'
                  ? 'bg-brand text-black border-brand'
                  : 'bg-oled text-textSecondary border-borderSubtle'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Explorar ({userSubjects.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('new_topic')}
              className={`min-h-[40px] rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                mode === 'new_topic'
                  ? 'bg-brand text-black border-brand'
                  : 'bg-oled text-textSecondary border-borderSubtle'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Conteúdo
            </button>
            <button
              type="button"
              onClick={() => setMode('new_subject')}
              className={`min-h-[40px] rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                mode === 'new_subject'
                  ? 'bg-brand text-black border-brand'
                  : 'bg-oled text-textSecondary border-borderSubtle'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Matéria
            </button>
          </div>

          {/* Corpo Principal */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {mode === 'browse' && (
              <>
                {/* Pílulas de Disciplinas */}
                <div>
                  <label className="text-xs font-semibold text-textSecondary block mb-2">
                    1. Selecione a Disciplina Ativa:
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                    {userSubjects.map((sub) => {
                      const isSelected = sub.name === activeSubject;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setActiveSubject(sub.name)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-brand/15 border-brand text-brand'
                              : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'
                          }`}
                        >
                          <span>{sub.icon}</span>
                          <span>{sub.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surfaceHighlight text-textSecondary">
                            {sub.topics.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lista de Conteúdos da Disciplina Ativa */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-textSecondary">
                      2. Conteúdos de <strong className="text-textPrimary">{currentSubjectObj?.name}</strong>:
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('new_topic')}
                      className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar assunto
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentSubjectObj?.topics.map((topic) => {
                      const isTopicSelected = topic.title === activeTopic;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            setActiveTopic(topic.title);
                            showToast(`Foco alterado para: ${currentSubjectObj.name} • ${topic.title}`, 'info');
                          }}
                          className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isTopicSelected
                              ? 'bg-brand/15 border-brand text-textPrimary'
                              : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-textPrimary truncate">
                              {topic.title}
                            </div>
                            {topic.summaryText ? (
                              <div className="text-[11px] text-textSecondary truncate mt-0.5">
                                {topic.summaryText}
                              </div>
                            ) : (
                              <div className="text-[10px] text-brand flex items-center gap-1 mt-0.5">
                                <Sparkles className="w-3 h-3" /> Banco de questões & resumo IA ativo
                              </div>
                            )}
                          </div>
                          {isTopicSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {mode === 'new_topic' && (
              <form onSubmit={handleCreateTopic} className="space-y-3">
                <div className="p-3 rounded-xl bg-oled border border-borderSubtle text-xs text-textSecondary">
                  Cadastrando novo conteúdo dentro de{' '}
                  <strong className="text-brand">{currentSubjectObj?.name}</strong>. O motor gerará
                  automaticamente resumo, questões e prompts Feynman para este tópico.
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Título do Conteúdo / Assunto *
                  </label>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Ex: Termodinâmica, Segunda Guerra Mundial, Matriz e Determinantes..."
                    className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Resumo ou Anotações Base (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={newTopicSummary}
                    onChange={(e) => setNewTopicSummary(e.target.value)}
                    placeholder="Cole aqui pontos importantes do seu caderno ou deixe em branco para a IA estruturar..."
                    className="w-full bg-oled border border-borderSubtle rounded-xl p-3 text-xs text-textPrimary focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Nível de Complexidade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'easy', label: 'Base / Fácil' },
                        { id: 'medium', label: 'Intermediário' },
                        { id: 'hard', label: 'Avançado / ENEM' },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setNewTopicDifficulty(d.id)}
                        className={`min-h-[44px] rounded-xl text-xs font-bold border ${
                          newTopicDifficulty === d.id
                            ? 'bg-brand/15 border-brand text-brand'
                            : 'bg-oled border-borderSubtle text-textSecondary'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brandHover text-black font-bold text-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Salvar Conteúdo em {currentSubjectObj?.name}
                </button>
              </form>
            )}

            {mode === 'new_subject' && (
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Nome da Nova Disciplina *
                  </label>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Ex: Filosofia, Sociologia, Literatura, Inglês..."
                    className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-textSecondary block mb-1 font-medium">
                      Área do Conhecimento
                    </label>
                    <select
                      aria-label="Área do conhecimento"
                      value={newSubArea}
                      onChange={(e) => setNewSubArea(e.target.value as UserSubjectWithContents['area'])}
                      className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary"
                    >
                      <option value="exatas">Matemática / Exatas</option>
                      <option value="natureza">Ciências da Natureza</option>
                      <option value="humanas">Ciências Humanas</option>
                      <option value="linguagens">Linguagens & Códigos</option>
                      <option value="outros">Técnico / Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-textSecondary block mb-1 font-medium">
                      Ícone
                    </label>
                    <select
                      aria-label="Ícone da disciplina"
                      value={newSubIcon}
                      onChange={(e) => setNewSubIcon(e.target.value)}
                      className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary"
                    >
                      <option value="📘">📘 Livro Azul</option>
                      <option value="🧠">🧠 Filosofia / Mente</option>
                      <option value="🌎">🌎 Sociedade / Mundo</option>
                      <option value="💻">💻 Tecnologia</option>
                      <option value="🎨">🎨 Artes / Literatura</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-textSecondary block mb-1 font-medium">
                    Primeiro Conteúdo / Assunto da Disciplina
                  </label>
                  <input
                    type="text"
                    value={newSubInitialTopic}
                    onChange={(e) => setNewSubInitialTopic(e.target.value)}
                    placeholder="Ex: Ética em Aristóteles, Interpretação Textual..."
                    className="w-full min-h-[44px] bg-oled border border-borderSubtle rounded-xl px-3 text-xs text-textPrimary focus:outline-none focus:border-brand"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brandHover text-black font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Disciplina & Sincronizar Boletim
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 mt-3 border-t border-borderSubtle flex items-center justify-between">
            <div className="text-[11px] text-textSecondary truncate">
              Ativo: <strong className="text-brand">{activeSubject}</strong> • {activeTopic}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl bg-surfaceHighlight text-textPrimary text-xs font-bold"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
