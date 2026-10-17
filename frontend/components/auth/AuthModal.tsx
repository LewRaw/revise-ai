'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  GraduationCap,
  Target,
  LogIn,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabaseClient';
import { SaasUserProfile } from '@/lib/storageService';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  allowClose?: boolean;
  onAuthSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  allowClose = false,
  onAuthSuccess,
}: AuthModalProps) {
  useBodyScrollLock(isOpen);
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [schoolGrade, setSchoolGrade] = useState<SaasUserProfile['schoolGrade']>('3º Ano EM');
  const [targetExam, setTargetExam] = useState<string>('ENEM & Vestibulares');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      showToast('Preencha seu e-mail e senha para continuar.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (mode === 'signup' && !fullName.trim()) {
      showToast('Informe seu nome completo ou apelido para criar sua conta.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          showToast(
            error.message === 'Invalid login credentials'
              ? 'E-mail ou senha incorretos. Verifique seus dados ou crie uma conta.'
              : `Erro ao entrar: ${error.message}`,
            'error'
          );
          return;
        }

        if (data.user) {
          showToast('Login realizado com sucesso! Bem-vindo(a) de volta.', 'success');
          onAuthSuccess?.();
          onClose?.();
        }
      } else {
        const cleanName = fullName.trim();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              grade_level: schoolGrade,
              target_exam: targetExam,
            },
          },
        });

        if (error) {
          showToast(`Não foi possível criar a conta: ${error.message}`, 'error');
          return;
        }

        if (data.user) {
          // Sincroniza o registro inicial em public.profiles respeitando RLS (auth.uid() = id)
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              email: cleanEmail,
              name: cleanName,
              grade_level: schoolGrade,
              target_exam: targetExam,
              plan: 'free',
              ai_credits: 25,
              onboarding_completed: false,
            },
            { onConflict: 'id' }
          );

          if (data.session) {
            showToast(
              `Conta criada com sucesso, ${cleanName}! Vamos personalizar suas disciplinas.`,
              'success'
            );
            onAuthSuccess?.();
            onClose?.();
          } else {
            showToast(
              'Cadastro registrado! Verifique seu e-mail para confirmar a conta ou faça login.',
              'info'
            );
            setMode('login');
          }
        }
      }
    } catch (err: any) {
      showToast(
        err?.message || 'Erro de conexão com o servidor de autenticação.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 bg-[#000000]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#262626] p-6 shadow-2xl space-y-5">
          {/* Header Fintech */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11C76F]/15 border border-[#11C76F]/30 text-[#11C76F] text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Auth • RLS Ativo</span>
              </div>
              <h2
                id="auth-modal-title"
                className="text-xl font-extrabold tracking-tight text-white pt-1"
              >
                Revise<span className="text-[#11C76F]">AI</span> •{' '}
                {mode === 'login' ? 'Entrar na Conta' : 'Criar Conta Grátis'}
              </h2>
              <p className="text-xs text-[#8E8E93]">
                {mode === 'login'
                  ? 'Acesse seu boletim, caderno de erros FSRS e rotinas sincronizadas.'
                  : 'Cadastre-se para salvar seu progresso na nuvem com inteligência artificial.'}
              </p>
            </div>

            {allowClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar janela de autenticação"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#000000] border border-[#262626] flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Seletor de Modo: Login vs Cadastro */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#000000] border border-[#262626]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-[#11C76F] text-black'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Já tenho conta</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup'
                  ? 'bg-[#11C76F] text-black'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar conta</span>
            </button>
          </div>

          {/* Formulário Principal */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
                  Nome ou Apelido *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Lucas Oliveira"
                    className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-[#000000] border border-[#262626] text-sm text-white placeholder-[#8E8E93]/60 focus:outline-none focus:border-[#11C76F]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
                E-mail do Estudante *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@escola.com.br"
                  className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-[#000000] border border-[#262626] text-sm text-white placeholder-[#8E8E93]/60 focus:outline-none focus:border-[#11C76F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
                Senha de Acesso (mín. 6 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-10 pr-11 rounded-xl bg-[#000000] border border-[#262626] text-sm text-white placeholder-[#8E8E93]/60 focus:outline-none focus:border-[#11C76F]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Alternar visibilidade da senha"
                  className="min-w-[40px] min-h-[40px] absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5">
                    Série / Etapa Atual
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ['1º Ano EM', '2º Ano EM', '3º Ano EM', 'Cursinho / ENEM'] as const
                    ).map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSchoolGrade(grade)}
                        className={`min-h-[44px] px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          schoolGrade === grade
                            ? 'bg-[#11C76F]/15 border-[#11C76F] text-[#11C76F]'
                            : 'bg-[#000000] border-[#262626] text-[#8E8E93] hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{grade}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
                    Objetivo Principal
                  </label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-[#11C76F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      aria-label="Objetivo principal"
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                      className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-[#000000] border border-[#262626] text-xs font-semibold text-white focus:outline-none focus:border-[#11C76F]"
                    >
                      <option value="ENEM & Vestibulares">ENEM & Vestibulares</option>
                      <option value="Medicina / Alta Concorrência">Medicina / Alta Concorrência</option>
                      <option value="Passar de Ano no Colégio">Passar de Ano no Colégio</option>
                      <option value="Olimpíadas Científicas">Olimpíadas Científicas</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] mt-2 rounded-xl bg-[#11C76F] hover:bg-[#0EA85C] disabled:opacity-60 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Autenticando...' : 'Entrar na Plataforma'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Criando conta...' : 'Criar Conta & Configurar Estudos'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Portal>
  );
}
