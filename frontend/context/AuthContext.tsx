'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  SaasUserProfile,
  SaasPlanTier,
  UserSubjectWithContents,
  SubjectTopicItem,
  UNAUTHENTICATED_PROFILE,
  DEFAULT_USER_SUBJECTS,
  setActiveUserId,
  loadUserSubjects,
  saveUserSubjects,
  provisionUserOnboarding,
  loadGradebookState,
  saveGradebookState,
} from '@/lib/storageService';
import { TermSystem, getPeriodsCount } from '@/lib/gradeCalculations';

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  currentUser: SaasUserProfile;
  usersList: SaasUserProfile[];
  userSubjects: UserSubjectWithContents[];
  activeSubject: string;
  activeTopic: string;
  isOnboardingOpen: boolean;
  setActiveSubject: (subjectName: string) => void;
  setActiveTopic: (topicTitle: string) => void;
  setIsOnboardingOpen: (open: boolean) => void;
  openAuthModal: () => void;
  signOut: () => Promise<void>;
  switchUser: (userId: string) => void;
  startNewStudentOnboarding: () => void;
  completeOnboarding: (params: {
    fullName: string;
    email: string;
    schoolGrade: SaasUserProfile['schoolGrade'];
    targetExam: string;
    termSystem: TermSystem;
    passingGrade: number;
    plan?: SaasPlanTier;
    subjects: UserSubjectWithContents[];
  }) => SaasUserProfile;
  addCustomSubject: (params: {
    name: string;
    area: UserSubjectWithContents['area'];
    color: string;
    icon: string;
    initialTopicTitle?: string;
    initialSummaryText?: string;
  }) => void;
  addContentTopic: (
    subjectName: string,
    topicTitle: string,
    summaryText?: string,
    difficulty?: 'easy' | 'medium' | 'hard'
  ) => void;
  upgradeUserPlan: (plan: SaasPlanTier) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeSchoolGrade(raw?: string | null): SaasUserProfile['schoolGrade'] {
  if (raw === '1º Ano EM' || raw === '2º Ano EM' || raw === '3º Ano EM' || raw === 'Cursinho / ENEM') {
    return raw;
  }
  return '3º Ano EM';
}

function normalizePlan(raw?: string | null): SaasPlanTier {
  if (raw === 'free' || raw === 'plus' || raw === 'pro') {
    return raw;
  }
  return 'free';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<SaasUserProfile>(UNAUTHENTICATED_PROFILE);
  const [userSubjects, setUserSubjects] = useState<UserSubjectWithContents[]>(DEFAULT_USER_SUBJECTS);
  const [activeSubject, setActiveSubjectState] = useState<string>('Física');
  const [activeTopic, setActiveTopicState] = useState<string>('Cinemática: MU e MUV');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  /**
   * Busca ou cria o registro do estudante autenticado na tabela public.profiles (RLS auth.uid() = id)
   */
  const syncProfileFromSupabase = useCallback(async (authUser: SupabaseUser) => {
    setActiveUserId(authUser.id);

    const fallbackName =
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'Estudante';
    const fallbackGrade = normalizeSchoolGrade(authUser.user_metadata?.grade_level);
    const fallbackTarget = authUser.user_metadata?.target_exam || 'ENEM & Vestibulares';

    let resolvedProfile: SaasUserProfile = {
      id: authUser.id,
      fullName: fallbackName,
      email: authUser.email || '',
      schoolGrade: fallbackGrade,
      targetExam: fallbackTarget,
      termSystem: 'bimestral',
      passingGrade: 6.0,
      plan: 'free',
      aiCreditsRemaining: 25,
      onboardingCompleted: false,
      createdAt: authUser.created_at || new Date().toISOString(),
    };

    try {
      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && profileRow) {
        const gb = loadGradebookState(authUser.id);
        resolvedProfile = {
          id: authUser.id,
          fullName: profileRow.name || fallbackName,
          email: profileRow.email || authUser.email || '',
          schoolGrade: normalizeSchoolGrade(profileRow.grade_level),
          targetExam: profileRow.target_exam || fallbackTarget,
          termSystem: gb.termSystem || 'bimestral',
          passingGrade: gb.passingGrade || 6.0,
          plan: normalizePlan(profileRow.plan),
          aiCreditsRemaining:
            typeof profileRow.ai_credits === 'number' ? profileRow.ai_credits : 25,
          onboardingCompleted: Boolean(profileRow.onboarding_completed),
          createdAt: profileRow.created_at || resolvedProfile.createdAt,
        };
      } else {
        // Garante que o perfil exista em public.profiles caso ainda não tenha sido criado
        await supabase.from('profiles').upsert(
          {
            id: authUser.id,
            email: authUser.email || '',
            name: fallbackName,
            grade_level: fallbackGrade,
            target_exam: fallbackTarget,
            plan: 'free',
            ai_credits: 25,
            onboarding_completed: false,
          },
          { onConflict: 'id' }
        );
      }
    } catch (e) {
      console.error('Erro ao sincronizar public.profiles:', e);
    }

    setCurrentUser(resolvedProfile);

    const localSubjects = loadUserSubjects(authUser.id);
    setUserSubjects(localSubjects);

    if (localSubjects.length > 0) {
      const firstSub = localSubjects[0];
      setActiveSubjectState(firstSub.name);
      setActiveTopicState(firstSub.topics[0]?.title || `Fundamentos de ${firstSub.name}`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuthSession() {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(activeSession);

        if (activeSession?.user) {
          await syncProfileFromSupabase(activeSession.user);
        } else {
          setActiveUserId('');
          setCurrentUser(UNAUTHENTICATED_PROFILE);
        }
      } catch (e) {
        console.error('Erro ao verificar sessão Supabase:', e);
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    initAuthSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (newSession?.user) {
        setIsAuthModalOpen(false);
        await syncProfileFromSupabase(newSession.user);
      } else {
        setActiveUserId('');
        setCurrentUser(UNAUTHENTICATED_PROFILE);
        setUserSubjects(DEFAULT_USER_SUBJECTS);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfileFromSupabase]);

  const setActiveSubject = useCallback(
    (subjectName: string) => {
      setActiveSubjectState(subjectName);
      const found = userSubjects.find((s) => s.name === subjectName);
      if (found && found.topics.length > 0) {
        setActiveTopicState(found.topics[0].title);
      } else {
        setActiveTopicState(`Tópico Geral de ${subjectName}`);
      }
    },
    [userSubjects]
  );

  const setActiveTopic = useCallback((topicTitle: string) => {
    setActiveTopicState(topicTitle);
  }, []);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setActiveUserId('');
    setSession(null);
    setCurrentUser(UNAUTHENTICATED_PROFILE);
  }, []);

  const switchUser = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const startNewStudentOnboarding = useCallback(() => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsOnboardingOpen(true);
  }, [session]);

  const completeOnboarding = useCallback(
    (params: {
      fullName: string;
      email: string;
      schoolGrade: SaasUserProfile['schoolGrade'];
      targetExam: string;
      termSystem: TermSystem;
      passingGrade: number;
      plan?: SaasPlanTier;
      subjects: UserSubjectWithContents[];
    }) => {
      const uid = session?.user?.id || currentUser.id;
      const created = provisionUserOnboarding({
        ...params,
        userId: uid,
      });

      setCurrentUser(created);
      setUserSubjects(params.subjects.length > 0 ? params.subjects : DEFAULT_USER_SUBJECTS);
      setIsOnboardingOpen(false);

      // Persiste também na tabela public.profiles do Supabase
      if (session?.user?.id) {
        const creditsMap: Record<SaasPlanTier, number> = {
          free: 25,
          plus: 150,
          pro: 999,
        };
        const chosenPlan = params.plan || 'free';
        supabase
          .from('profiles')
          .update({
            name: created.fullName,
            grade_level: created.schoolGrade,
            target_exam: created.targetExam,
            plan: chosenPlan,
            ai_credits: creditsMap[chosenPlan],
            onboarding_completed: true,
          })
          .eq('id', session.user.id)
          .then();
      }

      return created;
    },
    [session, currentUser.id]
  );

  const addCustomSubject = useCallback(
    (params: {
      name: string;
      area: UserSubjectWithContents['area'];
      color: string;
      icon: string;
      initialTopicTitle?: string;
      initialSummaryText?: string;
    }) => {
      const cleanName = params.name.trim();
      if (!cleanName) return;

      const defaultTopicTitle = params.initialTopicTitle?.trim() || `Introdução a ${cleanName}`;
      const newTopic: SubjectTopicItem = {
        id: `top_${Date.now()}`,
        title: defaultTopicTitle,
        summaryText: params.initialSummaryText?.trim() || undefined,
        difficulty: 'medium',
        masteryScore: 70,
      };

      const newSubject: UserSubjectWithContents = {
        id: `sub_${Date.now()}`,
        name: cleanName,
        area: params.area,
        color: params.color || '#11C76F',
        icon: params.icon || '📚',
        isCustom: true,
        topics: [newTopic],
      };

      setUserSubjects((prev) => {
        const exists = prev.some((s) => s.name.toLowerCase() === cleanName.toLowerCase());
        const updated = exists
          ? prev.map((s) =>
              s.name.toLowerCase() === cleanName.toLowerCase()
                ? { ...s, topics: [...s.topics, newTopic] }
                : s
            )
          : [...prev, newSubject];
        saveUserSubjects(updated, currentUser.id);
        return updated;
      });

      const gb = loadGradebookState(currentUser.id);
      const existsInGb = gb.subjects.some((s) => s.name.toLowerCase() === cleanName.toLowerCase());
      if (!existsInGb) {
        const periodsCount = getPeriodsCount(gb.termSystem);
        const updatedGb = {
          ...gb,
          subjects: [
            ...gb.subjects,
            {
              id: newSubject.id,
              name: cleanName,
              color: newSubject.color,
              grades: Array.from({ length: periodsCount }, (_, i) => ({
                periodNumber: i + 1,
                grade: null,
                weight: 1,
              })),
            },
          ],
        };
        saveGradebookState(updatedGb, currentUser.id);
      }

      if (session?.user?.id) {
        supabase
          .from('user_subjects')
          .upsert(
            {
              user_id: session.user.id,
              name: cleanName,
              area: params.area,
              color_accent: newSubject.color,
              is_custom: true,
            },
            { onConflict: 'user_id,name' }
          )
          .then();
      }

      setActiveSubjectState(cleanName);
      setActiveTopicState(defaultTopicTitle);
    },
    [currentUser.id, session]
  );

  const addContentTopic = useCallback(
    (
      subjectName: string,
      topicTitle: string,
      summaryText?: string,
      difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ) => {
      const cleanTitle = topicTitle.trim();
      if (!cleanTitle) return;

      const newTopic: SubjectTopicItem = {
        id: `top_${Date.now()}`,
        title: cleanTitle,
        summaryText: summaryText?.trim() || undefined,
        difficulty,
        masteryScore: 72,
      };

      setUserSubjects((prev) => {
        const updated = prev.map((sub) => {
          if (sub.name !== subjectName) return sub;
          return {
            ...sub,
            topics: [...sub.topics, newTopic],
          };
        });
        saveUserSubjects(updated, currentUser.id);
        return updated;
      });

      if (session?.user?.id) {
        supabase
          .from('subject_contents')
          .insert({
            user_id: session.user.id,
            subject_name: subjectName,
            title: cleanTitle,
            summary_definition: summaryText?.trim() || null,
            mastery_level: 72,
          })
          .then();
      }

      setActiveSubjectState(subjectName);
      setActiveTopicState(cleanTitle);
    },
    [currentUser.id, session]
  );

  const upgradeUserPlan = useCallback(
    async (plan: SaasPlanTier) => {
      const creditsMap: Record<SaasPlanTier, number> = {
        free: 25,
        plus: 150,
        pro: 999,
      };
      const updatedUser: SaasUserProfile = {
        ...currentUser,
        plan,
        aiCreditsRemaining: creditsMap[plan],
      };
      setCurrentUser(updatedUser);

      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({
            plan,
            ai_credits: creditsMap[plan],
          })
          .eq('id', session.user.id);
      }
    },
    [currentUser, session]
  );

  const isAuthenticated = Boolean(session?.user);
  const shouldShowAuthModal = !isLoadingAuth && (!isAuthenticated || isAuthModalOpen);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated,
        isLoadingAuth,
        currentUser,
        usersList: isAuthenticated ? [currentUser] : [],
        userSubjects,
        activeSubject,
        activeTopic,
        isOnboardingOpen,
        setActiveSubject,
        setActiveTopic,
        setIsOnboardingOpen,
        openAuthModal,
        signOut,
        switchUser,
        startNewStudentOnboarding,
        completeOnboarding,
        addCustomSubject,
        addContentTopic,
        upgradeUserPlan,
      }}
    >
      {children}
      <AuthModal
        isOpen={shouldShowAuthModal}
        allowClose={isAuthenticated}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return ctx;
}
