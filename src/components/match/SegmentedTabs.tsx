'use client';

import React from 'react';
import { Info, Radio, FileText, ListOrdered, Users } from 'lucide-react';

export type MatchCentreTab = 'info' | 'live' | 'scorecard' | 'overs' | 'squads';

interface SegmentedTabsProps {
  activeTab: MatchCentreTab;
  onChangeTab: (tab: MatchCentreTab) => void;
  isLive?: boolean;
}

export function SegmentedTabs({
  activeTab,
  onChangeTab,
  isLive = true,
}: SegmentedTabsProps) {
  const tabs: Array<{ id: MatchCentreTab; label: string; icon: React.ReactNode; isFeatured?: boolean }> = [
    {
      id: 'info',
      label: 'Info',
      icon: <Info className="w-3.5 h-3.5" />,
    },
    {
      id: 'live',
      label: 'Live',
      icon: <Radio className="w-3.5 h-3.5" />,
      isFeatured: true,
    },
    {
      id: 'scorecard',
      label: 'Scorecard',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: 'overs',
      label: 'Overs',
      icon: <ListOrdered className="w-3.5 h-3.5" />,
    },
    {
      id: 'squads',
      label: 'Squads',
      icon: <Users className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="w-full bg-[#0D1B2A]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#D8AD55]/25 shadow-lg">
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 min-w-[70px] sm:min-w-[90px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] shadow-md shadow-[#D8AD55]/20 font-black scale-[1.02]'
                  : 'text-[#8793A5] hover:text-white hover:bg-[#111D2D]/60'
              }`}
            >
              {tab.id === 'live' && isLive ? (
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-[#08111F]' : 'bg-red-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-[#08111F]' : 'bg-red-500'}`} />
                </span>
              ) : (
                tab.icon
              )}
              <span>{tab.label}</span>
              {tab.id === 'live' && (
                <span className={`text-[10px] ml-0.5 ${isActive ? 'text-[#08111F]' : 'text-[#D8AD55]'}`}>★</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
