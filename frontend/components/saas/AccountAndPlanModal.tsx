'use client';

import React from 'react';
import { Users, Crown, UserPlus, Check, Sparkles, ShieldCheck, X } from 'lucide-react';
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
    usersList,
    switchUser,
    startNewStudentOnboarding,
    upgradeUserPlan,
  } = useAuth();
  const { showToast } = useToast();
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSwitchAccount = (userId: string, name: string) => {
    switchUser(userId);
    showToast(`Sessão alternada para ${name}. Boletim, disciplinas e rotinas isolados carregados!`, 'info');
    onClose();
  };

  const handleStartNewUserWizard = () => {
    onClose();
    startNewStudentOnboarding();
  };

  const handleSelectPlan = (tier: SaasPlanTier, label: string) => {
    upgradeUserPlan(tier);
    showToast(`Plano SaaS atualizado para ${label} na conta de ${currentUser.fullName}!`, 'success');
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="bg-surface border border-borderSubtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 max-h-[90vh] flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-borderSubtle">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-textPrimary">Conta SaaS & Multi-Usuários</h2>
                <p className="text-xs text-textSecondary">
                  Gerencie perfis isolados, planos e novo onboarding
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
            {/* Cartão do Usuário Ativo */}
            <div className="p-4 rounded-2xl bg-oled border border-brand/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Conta Ativa Isolada (RLS)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand/20 text-brand text-[10px] font-bold uppercase">
                  Plano {currentUser.plan}
                </span>
              </div>
              <div className="text-base font-bold text-textPrimary">{currentUser.fullName}</div>
              <div className="text-xs text-textSecondary">
                {currentUser.email} • {currentUser.schoolGrade}
              </div>
              <div className="pt-2 flex items-center justify-between text-xs border-t border-borderSubtle">
                <span className="text-textSecondary">Meta: {currentUser.targetExam}</span>
                <span className="text-brand font-bold">
                  {currentUser.aiCreditsRemaining} créditos IA
                </span>
              </div>
            </div>

            {/* Alternador de Contas (Multi-User Switcher) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-textSecondary">
                  Perfis Cadastrados ({usersList.length})
                </label>
                <button
                  type="button"
                  onClick={handleStartNewUserWizard}
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Novo Cadastro (Onboarding)
                </button>
              </div>

              <div className="space-y-2">
                {usersList.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSwitchAccount(u.id, u.fullName)}
                      className={`w-full min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-brand/15 border-brand text-textPrimary'
                          : 'bg-oled border-borderSubtle text-textSecondary hover:text-textPrimary'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-textPrimary flex items-center gap-2">
                          <span>{u.fullName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceHighlight text-textSecondary uppercase">
                            {u.plan}
                          </span>
                        </div>
                        <div className="text-[11px] text-textSecondary truncate">
                          {u.schoolGrade} • Sistema {u.termSystem} (Média {u.passingGrade.toFixed(1)})
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleStartNewUserWizard}
                className="w-full min-h-[48px] mt-1 rounded-xl bg-brand/15 border border-brand/40 hover:bg-brand/25 text-brand font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Novo Estudante (Onboarding em 4 Etapas)
              </button>
            </div>

            {/* Planos SaaS */}
            <div className="space-y-2 pt-2 border-t border-borderSubtle">
              <label className="text-xs font-bold text-textSecondary flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-warning" /> Assinatura SaaS do Estudante Ativo
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

          <div className="pt-3 border-t border-borderSubtle flex justify-end">
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
