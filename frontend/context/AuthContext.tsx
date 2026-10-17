'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  SaasUserProfile, SaasPlanTier, UserSubjectWithContents, SubjectTopicItem, TopicGeneratedStudyData,
  UNAUTHENTICATED_PROFILE, DEFAULT_USER_SUBJECTS, setActiveUserId, loadUserSubjects, saveUserSubjects,
  provisionUserOnboarding, loadGradebookState, saveGradebookState,
} from '@/lib/storageService';
import { TermSystem, getPeriodsCount } from '@/lib/gradeCalculations';

const CREDITS_BY_PLAN: Record<SaasPlanTier, number> = { free: 25, plus: 150, pro: 999 };

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
    fullName: string; email: string; schoolGrade: SaasUserProfile['schoolGrade'];
    targetExam: string; termSystem: TermSystem; passingGrade: number;
    plan?: SaasPlanTier; subjects: UserSubjectWithContents[];
  }) => SaasUserProfile;
  addCustomSubject: (params: {
    name: string; area: UserSubjectWithContents['area']; color: string; icon: string;
    initialTopicTitle?: string; initialSummaryText?: string; generatedStudyData?: TopicGeneratedStudyData;
  }) => void;
  addContentTopic: (
    subjectName: string, topicTitle: string, summaryText?: string,
    difficulty?: 'easy' | 'medium' | 'hard', generatedStudyData?: TopicGeneratedStudyData
  ) => void;
  updateTopicStudyData: (subjectName: string, topicTitle: string, generatedData: TopicGeneratedStudyData) => void;
  consumeAiCredits: (cost?: number) => Promise<boolean>;
  upgradeUserPlan: (plan: SaasPlanTier) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeSchoolGrade = (raw?: string | null): SaasUserProfile['schoolGrade'] =>
  raw === '1º Ano EM' || raw === '2º Ano EM' || raw === '3º Ano EM' || raw === 'Cursinho / ENEM' ? raw : '3º Ano EM';

const normalizePlan = (raw?: string | null): SaasPlanTier =>
  raw === 'free' || raw === 'plus' || raw === 'pro' ? raw : 'free';

function makeTopicItem(
  title: string, summaryText?: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  gen?: TopicGeneratedStudyData, existing?: SubjectTopicItem
): SubjectTopicItem {
  return {
    id: existing?.id || `top_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    title,
    summaryText: gen?.summaryDefinition || summaryText || existing?.summaryText,
    formulaOrRule: gen?.formulaOrRule || existing?.formulaOrRule,
    enemTip: gen?.enemTip || existing?.enemTip,
    descriptivePrompt: gen?.descriptivePrompt || existing?.descriptivePrompt,
    customQuestions: gen?.questions || existing?.customQuestions,
    generatedStudyData: gen || existing?.generatedStudyData,
    difficulty,
    masteryScore: existing?.masteryScore ?? 72,
  };
}

function buildTopicFromRow(row: any, existing?: SubjectTopicItem): SubjectTopicItem {
  const questions = Array.isArray(row.custom_questions) ? row.custom_questions : existing?.customQuestions;
  const summaryDefinition = row.summary_definition || existing?.summaryText || '';
  const formulaOrRule = row.formula_or_rule || existing?.formulaOrRule || '';
  const enemTip = row.enem_tip || existing?.enemTip || '';
  const descriptivePrompt = row.descriptive_prompt || existing?.descriptivePrompt || '';
  const hasAi = Boolean(formulaOrRule || enemTip || descriptivePrompt || (questions && questions.length > 0));
  const gen = hasAi ? { summaryDefinition, formulaOrRule, enemTip, descriptivePrompt, questions: questions || [] } : existing?.generatedStudyData;
  return makeTopicItem(row.title || existing?.title || 'Tópico', summaryDefinition || undefined, existing?.difficulty || 'medium', gen, existing);
}

function toDbContentPayload(userId: string, subjectName: string, topic: SubjectTopicItem, mastery = 72) {
  return {
    user_id: userId,
    subject_name: subjectName,
    title: topic.title,
    summary_definition: topic.summaryText || null,
    formula_or_rule: topic.formulaOrRule || null,
    enem_tip: topic.enemTip || null,
    descriptive_prompt: topic.descriptivePrompt || null,
    custom_questions: topic.customQuestions || [],
    mastery_level: mastery,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<SaasUserProfile>(UNAUTHENTICATED_PROFILE);
  const [userSubjects, setUserSubjects] = useState<UserSubjectWithContents[]>(DEFAULT_USER_SUBJECTS);
  const [activeSubject, setActiveSubjectState] = useState<string>('Física');
  const [activeTopic, setActiveTopicState] = useState<string>('Termodinâmica & Conservação de Energia');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const syncProfileFromSupabase = useCallback(async (authUser: SupabaseUser) => {
    setActiveUserId(authUser.id);
    const fallbackName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Estudante';
    const fallbackGrade = normalizeSchoolGrade(authUser.user_metadata?.grade_level);
    const fallbackTarget = authUser.user_metadata?.target_exam || 'ENEM & Vestibulares';
    let resolvedProfile: SaasUserProfile = {
      ...UNAUTHENTICATED_PROFILE, id: authUser.id, fullName: fallbackName, email: authUser.email || '',
      schoolGrade: fallbackGrade, targetExam: fallbackTarget, createdAt: authUser.created_at || new Date().toISOString(),
    };

    try {
      const { data: p, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      if (!error && p) {
        const gb = loadGradebookState(authUser.id);
        resolvedProfile = {
          id: authUser.id, fullName: p.name || fallbackName, email: p.email || authUser.email || '',
          schoolGrade: normalizeSchoolGrade(p.grade_level), targetExam: p.target_exam || fallbackTarget,
          termSystem: gb.termSystem || 'bimestral', passingGrade: gb.passingGrade || 6.0,
          plan: normalizePlan(p.plan), aiCreditsRemaining: typeof p.ai_credits === 'number' ? p.ai_credits : 25,
          onboardingCompleted: Boolean(p.onboarding_completed), createdAt: p.created_at || resolvedProfile.createdAt,
        };
      } else {
        await supabase.from('profiles').upsert({
          id: authUser.id, email: authUser.email || '', name: fallbackName,
          grade_level: fallbackGrade, target_exam: fallbackTarget, plan: 'free', ai_credits: 25, onboarding_completed: false,
        }, { onConflict: 'id' });
      }
    } catch (e) {
      console.error('Erro ao sincronizar public.profiles:', e);
    }

    setCurrentUser(resolvedProfile);
    let merged = loadUserSubjects(authUser.id);
    try {
      const [{ data: dbSubs }, { data: dbTopics }] = await Promise.all([
        supabase.from('user_subjects').select('*').eq('user_id', authUser.id),
        supabase.from('subject_contents').select('*').eq('user_id', authUser.id),
      ]);
      if (Array.isArray(dbSubs)) {
        for (const r of dbSubs) {
          if (r?.name && !merged.some((s) => s.name.toLowerCase() === r.name.toLowerCase())) {
            merged = [...merged, { id: r.id || `sub_${Date.now()}`, name: r.name, area: r.area || 'outros', color: r.color_accent || '#11C76F', icon: '📘', isCustom: Boolean(r.is_custom ?? true), topics: [] }];
          }
        }
      }
      if (Array.isArray(dbTopics)) {
        for (const r of dbTopics) {
          if (!r?.subject_name || !r?.title) continue;
          const sIdx = merged.findIndex((s) => s.name.toLowerCase() === String(r.subject_name).toLowerCase());
          if (sIdx === -1) {
            merged = [...merged, { id: `sub_${Date.now()}`, name: r.subject_name, area: 'outros', color: '#11C76F', icon: '📘', isCustom: true, topics: [buildTopicFromRow(r)] }];
          } else {
            const sub = merged[sIdx];
            const tIdx = sub.topics.findIndex((t) => t.title.toLowerCase() === String(r.title).toLowerCase());
            const topics = tIdx === -1 ? [...sub.topics, buildTopicFromRow(r)] : sub.topics.map((t, i) => (i === tIdx ? buildTopicFromRow(r, t) : t));
            merged = merged.map((s, i) => (i === sIdx ? { ...s, topics } : s));
          }
        }
      }
      saveUserSubjects(merged, authUser.id);
    } catch (e) {
      console.error('Erro ao hidratar user_subjects/subject_contents:', e);
    }

    setUserSubjects(merged);
    if (merged.length > 0) {
      setActiveSubjectState(merged[0].name);
      setActiveTopicState(merged[0].topics[0]?.title || `Fundamentos de ${merged[0].name}`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) await syncProfileFromSupabase(s.user);
      else { setActiveUserId(''); setCurrentUser(UNAUTHENTICATED_PROFILE); }
      if (mounted) setIsLoadingAuth(false);
    }).catch(() => { if (mounted) setIsLoadingAuth(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
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
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [syncProfileFromSupabase]);

  const setActiveSubject = useCallback((subjectName: string) => {
    setActiveSubjectState(subjectName);
    const found = userSubjects.find((s) => s.name === subjectName);
    setActiveTopicState(found?.topics[0]?.title || `Tópico Geral de ${subjectName}`);
  }, [userSubjects]);

  const setActiveTopic = useCallback((topicTitle: string) => setActiveTopicState(topicTitle), []);
  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const switchUser = useCallback(() => setIsAuthModalOpen(true), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setActiveUserId('');
    setSession(null);
    setCurrentUser(UNAUTHENTICATED_PROFILE);
  }, []);

  const startNewStudentOnboarding = useCallback(() => {
    if (!session?.user) setIsAuthModalOpen(true);
    else setIsOnboardingOpen(true);
  }, [session]);

  const completeOnboarding = useCallback((params: {
    fullName: string; email: string; schoolGrade: SaasUserProfile['schoolGrade'];
    targetExam: string; termSystem: TermSystem; passingGrade: number;
    plan?: SaasPlanTier; subjects: UserSubjectWithContents[];
  }) => {
    const uid = session?.user?.id || currentUser.id;
    const created = provisionUserOnboarding({ ...params, userId: uid });
    setCurrentUser(created);
    setUserSubjects(params.subjects.length > 0 ? params.subjects : DEFAULT_USER_SUBJECTS);
    setIsOnboardingOpen(false);
    if (session?.user?.id) {
      const chosenPlan = params.plan || 'free';
      supabase.from('profiles').update({
        name: created.fullName, grade_level: created.schoolGrade, target_exam: created.targetExam,
        plan: chosenPlan, ai_credits: CREDITS_BY_PLAN[chosenPlan], onboarding_completed: true,
      }).eq('id', session.user.id).then();
    }
    return created;
  }, [session, currentUser.id]);

  const addCustomSubject = useCallback((params: {
    name: string; area: UserSubjectWithContents['area']; color: string; icon: string;
    initialTopicTitle?: string; initialSummaryText?: string; generatedStudyData?: TopicGeneratedStudyData;
  }) => {
    const cleanName = params.name.trim();
    if (!cleanName) return;
    const defaultTopicTitle = params.initialTopicTitle?.trim() || `Introdução a ${cleanName}`;
    const newTopic = makeTopicItem(defaultTopicTitle, params.initialSummaryText?.trim(), 'medium', params.generatedStudyData);
    const newSubject: UserSubjectWithContents = {
      id: `sub_${Date.now()}`, name: cleanName, area: params.area,
      color: params.color || '#11C76F', icon: params.icon || '📚', isCustom: true, topics: [newTopic],
    };

    setUserSubjects((prev) => {
      const exists = prev.some((s) => s.name.toLowerCase() === cleanName.toLowerCase());
      const updated = exists
        ? prev.map((s) => (s.name.toLowerCase() === cleanName.toLowerCase() ? { ...s, topics: [...s.topics, newTopic] } : s))
        : [...prev, newSubject];
      saveUserSubjects(updated, currentUser.id);
      return updated;
    });

    const gb = loadGradebookState(currentUser.id);
    if (!gb.subjects.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      const periods = getPeriodsCount(gb.termSystem);
      const grades = Array.from({ length: periods }, (_, i) => ({ periodNumber: i + 1, grade: null, weight: 1 }));
      saveGradebookState({ ...gb, subjects: [...gb.subjects, { id: newSubject.id, name: cleanName, color: newSubject.color, grades }] }, currentUser.id);
    }

    if (session?.user?.id) {
      supabase.from('user_subjects').upsert({ user_id: session.user.id, name: cleanName, area: params.area, color_accent: newSubject.color, is_custom: true }, { onConflict: 'user_id,name' }).then();
      supabase.from('subject_contents').insert(toDbContentPayload(session.user.id, cleanName, newTopic, 70)).then();
    }
    setActiveSubjectState(cleanName);
    setActiveTopicState(defaultTopicTitle);
  }, [currentUser.id, session]);

  const addContentTopic = useCallback((
    subjectName: string, topicTitle: string, summaryText?: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium', generatedStudyData?: TopicGeneratedStudyData
  ) => {
    const cleanTitle = topicTitle.trim();
    if (!cleanTitle) return;
    const newTopic = makeTopicItem(cleanTitle, summaryText?.trim(), difficulty, generatedStudyData);

    setUserSubjects((prev) => {
      const updated = prev.map((sub) => {
        if (sub.name !== subjectName) return sub;
        const idx = sub.topics.findIndex((t) => t.title.toLowerCase() === cleanTitle.toLowerCase());
        const topics = idx >= 0 ? sub.topics.map((t, i) => (i === idx ? makeTopicItem(cleanTitle, summaryText?.trim(), difficulty, generatedStudyData, t) : t)) : [...sub.topics, newTopic];
        return { ...sub, topics };
      });
      saveUserSubjects(updated, currentUser.id);
      return updated;
    });

    if (session?.user?.id) {
      supabase.from('subject_contents').insert(toDbContentPayload(session.user.id, subjectName, newTopic, 72)).then();
    }
    setActiveSubjectState(subjectName);
    setActiveTopicState(cleanTitle);
  }, [currentUser.id, session]);

  const updateTopicStudyData = useCallback((subjectName: string, topicTitle: string, generatedData: TopicGeneratedStudyData) => {
    const cleanTitle = topicTitle.trim();
    if (!cleanTitle) return;
    setUserSubjects((prev) => {
      const updated = prev.map((sub) => {
        if (sub.name !== subjectName) return sub;
        const exists = sub.topics.some((t) => t.title.toLowerCase() === cleanTitle.toLowerCase());
        const topics = exists
          ? sub.topics.map((t) => (t.title.toLowerCase() === cleanTitle.toLowerCase() ? makeTopicItem(cleanTitle, generatedData.summaryDefinition, t.difficulty, generatedData, t) : t))
          : [...sub.topics, makeTopicItem(cleanTitle, generatedData.summaryDefinition, 'medium', generatedData)];
        return { ...sub, topics };
      });
      saveUserSubjects(updated, currentUser.id);
      return updated;
    });

    if (session?.user?.id) {
      supabase.from('subject_contents').update({
        summary_definition: generatedData.summaryDefinition,
        formula_or_rule: generatedData.formulaOrRule,
        enem_tip: generatedData.enemTip,
        descriptive_prompt: generatedData.descriptivePrompt,
        custom_questions: generatedData.questions,
      }).eq('user_id', session.user.id).eq('subject_name', subjectName).eq('title', cleanTitle).then();
    }
  }, [currentUser.id, session]);

  const consumeAiCredits = useCallback(async (cost: number = 1): Promise<boolean> => {
    if (currentUser.plan === 'pro') return true;
    if (currentUser.aiCreditsRemaining < cost) return false;
    const nextCredits = Math.max(0, currentUser.aiCreditsRemaining - cost);
    setCurrentUser((prev) => ({ ...prev, aiCreditsRemaining: nextCredits }));
    if (session?.user?.id) {
      await supabase.from('profiles').update({ ai_credits: nextCredits }).eq('id', session.user.id);
    }
    return true;
  }, [currentUser.plan, currentUser.aiCreditsRemaining, session]);

  const upgradeUserPlan = useCallback(async (plan: SaasPlanTier) => {
    setCurrentUser((prev) => ({ ...prev, plan, aiCreditsRemaining: CREDITS_BY_PLAN[plan] }));
    if (session?.user?.id) {
      await supabase.from('profiles').update({ plan, ai_credits: CREDITS_BY_PLAN[plan] }).eq('id', session.user.id);
    }
  }, [session]);

  const isAuthenticated = Boolean(session?.user);
  const shouldShowAuthModal = !isLoadingAuth && (!isAuthenticated || isAuthModalOpen);

  return (
    <AuthContext.Provider value={{
      session, isAuthenticated, isLoadingAuth, currentUser, usersList: isAuthenticated ? [currentUser] : [],
      userSubjects, activeSubject, activeTopic, isOnboardingOpen, setActiveSubject, setActiveTopic,
      setIsOnboardingOpen, openAuthModal, signOut, switchUser, startNewStudentOnboarding, completeOnboarding,
      addCustomSubject, addContentTopic, updateTopicStudyData, consumeAiCredits, upgradeUserPlan,
    }}>
      {children}
      <AuthModal isOpen={shouldShowAuthModal} allowClose={isAuthenticated} onClose={() => setIsAuthModalOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  return ctx;
}
