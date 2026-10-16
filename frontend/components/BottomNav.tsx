'use client';

import React from 'react';
import { Home, Mic, Zap, FileCheck2, GraduationCap } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'review' | 'routines' | 'quiz' | 'gradebook';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Início', icon: Home },
    { id: 'review' as ActiveTab, label: 'Revisar', icon: Mic },
    { id: 'routines' as ActiveTab, label: 'Rotinas', icon: Zap },
    { id: 'quiz' as ActiveTab, label: 'Simulados', icon: FileCheck2 },
    { id: 'gradebook' as ActiveTab, label: 'Boletim', icon: GraduationCap },
  ];

  return (
    <nav 
      aria-label="Navegação Principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-md border-t border-[#262626] safe-area-bottom"
    >
      <div className="max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all active:scale-95 ${
                isActive ? 'text-[#11C76F]' : 'text-[#8E8E93] hover:text-white'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#11C76F]/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
