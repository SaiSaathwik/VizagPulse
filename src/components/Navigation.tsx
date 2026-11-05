import React from 'react';
import { motion } from 'motion/react';
import { TabType } from '../types';
import { LayoutGrid, Plus, ShieldCheck } from 'lucide-react';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  openCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  openCount,
}) => {
  return (
    <nav className="fixed bottom-5 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-xs mx-auto px-4">
        {/* Floating pill navigation container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto bg-[#141417]/90 backdrop-blur-xl border border-[rgba(230,230,225,0.18)] rounded-full px-2 py-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex items-center justify-between"
        >
          {/* Feed Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('feed')}
            className={`relative flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
              currentTab === 'feed'
                ? 'text-[#EDEDE8]'
                : 'text-[#94949E] hover:text-[#EDEDE8]'
            }`}
          >
            {currentTab === 'feed' && (
              <motion.div
                layoutId="navBubble"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] rounded-full"
              />
            )}
            <LayoutGrid className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Feed</span>
          </button>

          {/* Center REPORT Button highlighted in Accent colour (#C8F169) */}
          <button
            type="button"
            onClick={() => onSelectTab('report')}
            className={`relative flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all active:scale-95 shadow-md ${
              currentTab === 'report'
                ? 'bg-[#C8F169] text-[#0B0B0D] ring-4 ring-[#C8F169]/25 shadow-[#C8F169]/30'
                : 'bg-[#C8F169] hover:bg-[#d6f78a] text-[#0B0B0D]'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Report</span>
          </button>

          {/* Authority Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('authority')}
            className={`relative flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
              currentTab === 'authority'
                ? 'text-[#EDEDE8]'
                : 'text-[#94949E] hover:text-[#EDEDE8]'
            }`}
          >
            {currentTab === 'authority' && (
              <motion.div
                layoutId="navBubble"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] rounded-full"
              />
            )}
            <div className="relative z-10 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Audit</span>
              {openCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#F59E0B] text-[#0B0B0D] text-[9px] font-black tnum">
                  {openCount}
                </span>
              )}
            </div>
          </button>
        </motion.div>
      </div>
    </nav>
  );
};
