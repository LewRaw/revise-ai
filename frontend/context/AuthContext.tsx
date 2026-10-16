'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SaasUserProfile,
  SaasPlanTier,
  UserSubjectWithContents,
  SubjectTopicItem,
  DEFAULT_DEMO_USER,
  DEFAULT_USER_SUBJECTS,
  loadSaasUsers,
  saveSaasUsers,
  loadActiveUserProfile,
  setActiveUserId,
  loadUserSubjects,
  saveUserSubjects,
  provisionUserOnboarding,
  loadGradebookState,
  saveGradebookState,
} from '@/lib/storageService';
import { TermSystem, getPeriodsCount } from '@/lib/gradeCalculations';

interface AuthContextValue {
  currentUser: SaasUserProfile;
  usersList: SaasUserProfile[];
  userSubjects: UserSubjectWithContents[];
  activeSubject: string;
  activeTopic: string;
  isOnboardingOpen: boolean;
  setActiveSubject: (subjectName: string) => void;
  setActiveTopic: (topicTitle: string) => void;
  setIsOnboardingOpen: (open: boolean) => void;
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
  addContentTopic: (subjectName: string, topicTitle: string, summaryText?: string, difficulty?: 'easy' | 'medium' | 'hard') => void;
  upgradeUserPlan: (plan: SaasPlanTier) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SaasUserProfile>(DEFAULT_DEMO_USER);
  const [usersList, setUsersList] = useState<SaasUserProfile[]>([DEFAULT_DEMO_USER]);
  const [userSubjects, setUserSubjects] = useState<UserSubjectWithContents[]>(DEFAULT_USER_SUBJECTS);
  const [activeSubject, setActiveSubjectState] = useState<string>('Física');
  const [activeTopic, setActiveTopicState] = useState<string>('Cinemática: MU e MUV');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const hydrateForActiveUser = useCallback(() => {
    const allUsers = loadSaasUsers();
    const activeProfile = loadActiveUserProfile();
    const subjects = loadUserSubjects(activeProfile.id);

    setUsersList(allUsers);
    setCurrentUser(activeProfile);
    setUserSubjects(subjects);

    if (subjects.length > 0) {
      const firstSub = subjects[0];
      setActiveSubjectState(firstSub.name);
      setActiveTopicState(firstSub.topics[0]?.title || `Fundamentos de ${firstSub.name}`);
    }
  }, []);

  useEffect(() => {
    hydrateForActiveUser();
  }, [hydrateForActiveUser]);

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

  const switchUser = useCallback(
    (userId: string) => {
      setActiveUserId(userId);
      hydrateForActiveUser();
    },
    [hydrateForActiveUser]
  );

  const startNewStudentOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

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
      const created = provisionUserOnboarding(params);
      hydrateForActiveUser();
      setIsOnboardingOpen(false);
      return created;
    },
    [hydrateForActiveUser]
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

      // Sincroniza também no Boletim Escolar do usuário ativo se ainda não existir
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

      setActiveSubjectState(cleanName);
      setActiveTopicState(defaultTopicTitle);
    },
    [currentUser.id]
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

      setActiveSubjectState(subjectName);
      setActiveTopicState(cleanTitle);
    },
    [currentUser.id]
  );

  const upgradeUserPlan = useCallback(
    (plan: SaasPlanTier) => {
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
      const all = loadSaasUsers().map((u) => (u.id === updatedUser.id ? updatedUser : u));
      saveSaasUsers(all);
      setUsersList(all);
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        userSubjects,
        activeSubject,
        activeTopic,
        isOnboardingOpen,
        setActiveSubject,
        setActiveTopic,
        setIsOnboardingOpen,
        switchUser,
        startNewStudentOnboarding,
        completeOnboarding,
        addCustomSubject,
        addContentTopic,
        upgradeUserPlan,
      }}
    >
      {children}
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
