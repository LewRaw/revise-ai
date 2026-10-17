'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Crown,
  KeyRound,
  LogOut,
  X,
  Check,
  Layers,
  Plus,
  Sliders,
} from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabaseClient';
import { SaasPlanTier } from '@/lib/storageService';

interface ProfileHeaderProps {
  onOpenSubjectsModal: () => void;
}

const PLAN_LABELS: Record<SaasPlanTier, string> = {
  free: 'Free',
  plus: 'Plus',
  pro: 'Pro',
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onOpenSubjectsModal,
}) => {
  const {
    currentUser,
    isAuthenticated,
    activeSubject,
    activeTopic,
    upgradeUserPlan,
    signOut,
    openAuthModal,
    startNewStudentOnboarding,
  } = useAuth();
  const { showToast } = useToast();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  useBodyScrollLock(isSettingsOpen);

  const initials = (currentUser.fullName || 'Estudante')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'EA';

  const handlePlanChange = async (tier: SaasPlanTier) => {
    await upgradeUserPlan(tier);
    showToast(`Assinatura atualizada para o plano ${PLAN_LABELS[tier]}!`, 'success');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });
      if (error) {
        showToast(`Não foi possível trocar a senha: ${error.message}`, 'error');
        return;
      }
      setNewPassword('');
      showToast('Senha atualizada com sucesso no Supabase Auth!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao atualizar a senha.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsSettingsOpen(false);
    showToast('Você saiu da sua conta com segurança.', 'info');
  };

  return (
    <header className="flex flex-col gap-3 pb-4 border-b border-[#262626] mb-5">
      <div className="flex items-center justify-between gap-2">
        {/* Logotipo + Badge Discreta do Plano + Meta do Estudante */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-white">
              Revise<span className="text-[#11C76F]">AI</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141414] border border-[#262626] text-[#11C76F]">
              {PLAN_LABELS[currentUser.plan]}
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] truncate mt-0.5">
            Meta: {currentUser.targetExam}
          </p>
        </div>

        {/* Saldo de Créditos de IA + Avatar do Estudante */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] min-h-[40px]"
            title="Saldo de créditos de Inteligência Artificial"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#11C76F]" />
            <span className="text-xs font-bold text-white">
              {currentUser.aiCreditsRemaining}
            </span>
            <span className="text-[10px] text-[#8E8E93] hidden xs:inline">créditos IA</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Abrir configurações da conta"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-[#141414] border border-[#11C76F]/50 hover:border-[#11C76F] flex items-center justify-center text-xs font-extrabold text-[#11C76F] transition-all active:scale-95"
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Seletor Limpo de Disciplina e Conteúdo Ativo */}
      <button
        type="button"
        onClick={onOpenSubjectsModal}
        className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#11C76F]/50 text-left flex items-center justify-between gap-2 transition-all"
      >
        <div className="min-w-0 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#11C76F] shrink-0" />
          <span className="text-xs font-bold text-white truncate">
            {activeSubject} • <span className="text-[#11C76F]">{activeTopic}</span>
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#11C76F] shrink-0 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Matérias
        </span>
      </button>

      {/* Modal Limpo de Configurações (Assinatura/Plano, Trocar Senha e Logout) */}
      {isSettingsOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-settings-title"
          >
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#141414] border border-[#262626] p-5 max-h-[90vh] flex flex-col justify-between overflow-y-auto space-y-5">
              {/* Cabeçalho do Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#000000] border border-[#11C76F] flex items-center justify-center text-sm font-extrabold text-[#11C76F]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h2 id="profile-settings-title" className="text-base font-bold text-white truncate">
                      {currentUser.fullName}
                    </h2>
                    <p className="text-xs text-[#8E8E93] truncate">
                      {currentUser.email || 'Conta conectada'} • {currentUser.schoolGrade}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  aria-label="Fechar configurações"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#000000] border border-[#262626] flex items-center justify-center text-[#8E8E93] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Gerenciar Assinatura / Plano */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-[#11C76F]" /> Gerenciar Assinatura / Plano
                  </span>
                  <span className="text-[11px] text-[#11C76F] font-semibold">
                    {currentUser.aiCreditsRemaining} créditos IA ativos
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'free', name: 'Free', desc: '25 créd. IA' },
                      { id: 'plus', name: 'Plus', desc: '150 créd. IA' },
                      { id: 'pro', name: 'Pro', desc: 'IA Ilimitada' },
                    ] as const
                  ).map((tier) => {
                    const isSelected = currentUser.plan === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => handlePlanChange(tier.id)}
                        className={`min-h-[60px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-[#11C76F]/15 border-[#11C76F] text-white'
                            : 'bg-[#000000] border-[#262626] text-[#8E8E93] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{tier.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#11C76F]" />}
                        </div>
                        <span className="text-[10px] text-[#11C76F]">{tier.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    startNewStudentOnboarding();
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#000000] border border-[#262626] hover:border-[#11C76F] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#11C76F]" />
                  <span>Reconfigurar Disciplinas & Meta (Onboarding)</span>
                </button>
              </div>

              {/* 2. Trocar de Senha */}
              <form onSubmit={handlePasswordChange} className="space-y-2 pt-3 border-t border-[#262626]">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#11C76F]" /> Trocar de Senha
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#000000] border border-[#262626] text-xs text-white focus:outline-none focus:border-[#11C76F]"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="min-h-[44px] px-4 rounded-xl bg-[#11C76F] text-black font-bold text-xs shrink-0"
                  >
                    {isUpdatingPassword ? 'Salvando...' : 'Atualizar'}
                  </button>
                </div>
              </form>

              {/* 3. Sair (Logout) */}
              <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-2">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-[44px] px-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold flex items-center gap-1.5 hover:bg-[#EF4444]/25 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair (Logout)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      openAuthModal();
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-[#11C76F] text-black text-xs font-bold"
                  >
                    Entrar na Conta
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="min-h-[44px] px-5 rounded-xl bg-[#000000] border border-[#262626] text-white text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </header>
  );
};
