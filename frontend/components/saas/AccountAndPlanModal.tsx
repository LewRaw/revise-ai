'use client';

import React from 'react';
import {
  User,
  Crown,
  Sparkles,
  ShieldCheck,
  LogOut,
  Sliders,
  X,
} from 'lucide-react';
import { Portal } from '@/components/Portal';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SaasPlanTier } from '@/lib/storageService';

interface AccountAndPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountAndPlanModal({ isOpen, onClose }: AccountAndPlanModalProps) {
  const {
    currentUser,
    isAuthenticated,
    startNewStudentOnboarding,
    upgradeUserPlan,
    signOut,
    openAuthModal,
  } = useAuth();
  const { showToast } = useToast();
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleOpenOnboardingWizard = () => {
    onClose();
    startNewStudentOnboarding();
  };

  const handleSelectPlan = async (tier: SaasPlanTier, label: string) => {
    await upgradeUserPlan(tier);
    showToast(
      `Plano atualizado para ${label} e sincronizado em public.profiles!`,
      'success'
    );
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    showToast('Sessão encerrada com segurança.', 'info');
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="bg-surface border border-borderSubtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-textPrimary">Minha Conta & Plano SaaS</h2>
                <p className="text-xs text-textSecondary">
                  Sessão autenticada via Supabase Auth (`public.profiles`)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar gestão de conta"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-oled border border-borderSubtle flex items-center justify-center text-textSecondary hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-1">
            {/* Cartão do Usuário Autenticado */}
            <div className="p-4 rounded-2xl bg-oled border border-brand/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Supabase RLS Ativo
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand/20 text-brand text-[10px] font-bold uppercase">
                  Plano {currentUser.plan}
                </span>
              </div>
              <div className="text-base font-bold text-textPrimary">{currentUser.fullName}</div>
              <div className="text-xs text-textSecondary">
                {currentUser.email || 'Sessão ativa'} • {currentUser.schoolGrade}
              </div>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-borderSubtle">
                <span className="text-textSecondary">Meta: {currentUser.targetExam}</span>
                <span className="text-brand font-bold">
                  {currentUser.aiCreditsRemaining} créditos IA
                </span>
              </div>
            </div>

            {/* Reconfigurar Trilha / Onboarding */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleOpenOnboardingWizard}
                className="w-full min-h-[48px] rounded-xl bg-brand/15 border border-brand/40 hover:bg-brand/25 text-brand font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Sliders className="w-4 h-4" />
                Personalizar Grade & Conteúdos (Assistente em 4 Etapas)
              </button>
            </div>

            {/* Planos SaaS Sincronizados com public.profiles */}
            <div className="space-y-2 pt-2 border-t border-borderSubtle">
              <label className="text-xs font-bold text-textSecondary flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-warning" /> Assinatura SaaS (`public.profiles.plan`)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'free', name: 'Free', price: 'R$ 0', perks: '25 créditos IA/mês' },
                    { id: 'plus', name: 'Plus', price: 'R$ 19/mês', perks: '150 créditos + Voz' },
                    { id: 'pro', name: 'Pro ENEM', price: 'R$ 39/mês', perks: 'IA & OCR Ilimitados' },
                  ] as const
                ).map((tier) => {
                  const active = currentUser.plan === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => handleSelectPlan(tier.id, tier.name)}
                      className={`min-h-[72px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        active
                          ? 'bg-brand/15 border-brand text-textPrimary'
                          : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-textPrimary">{tier.name}</span>
                        {active && <Sparkles className="w-3 h-3 text-brand" />}
                      </div>
                      <div className="text-[11px] font-bold text-brand">{tier.price}</div>
                      <div className="text-[10px] opacity-80 leading-tight">{tier.perks}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-borderSubtle flex items-center justify-between gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] px-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold flex items-center gap-1.5 hover:bg-[#EF4444]/25 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="min-h-[44px] px-4 rounded-xl bg-brand text-black text-xs font-bold"
              >
                Entrar / Criar Conta
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl bg-surfaceHighlight text-textPrimary text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
