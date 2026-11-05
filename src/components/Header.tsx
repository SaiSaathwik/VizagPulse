import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, RotateCcw, Activity } from 'lucide-react';
import { SystemCheckModal } from './SystemCheckModal';

interface HeaderProps {
  onResetDemo: () => void;
  openCount: number;
  fixedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onResetDemo,
  openCount,
  fixedCount,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [systemCheckOpen, setSystemCheckOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#0B0B0D]/90 backdrop-blur-md border-b border-[rgba(230,230,225,0.18)]">
        <div className="max-w-md mx-auto px-4 h-15 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C8F169] text-[#0B0B0D] flex items-center justify-center font-extrabold text-base shadow-sm shadow-[#C8F169]/30">
              <span className="translate-y-[-1px]">⚡</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-[-0.03em] text-[#EDEDE8]">
                  VizagPulse
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1B1B20] text-[#C8F169] border border-[#C8F169]/30 tracking-wider uppercase">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-[#94949E] font-medium leading-none mt-0.5">
                Visakhapatnam Civic Intelligence
              </p>
            </div>
          </div>

          {/* Right Hamburger Icon */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="w-10 h-10 rounded-xl bg-[#141417] hover:bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] text-[#EDEDE8] flex items-center justify-center transition-colors active:scale-95"
          >
            <Menu className="w-5 h-5 text-[#EDEDE8]" />
          </button>
        </div>
      </header>

      {/* Slide-in Drawer with Framer Motion */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setDrawerOpen(false);
                setShowConfirmReset(false);
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-y-0 right-0 max-w-xs w-full bg-[#141417] border-l border-[rgba(230,230,225,0.18)] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[rgba(230,230,225,0.10)]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-[#C8F169] text-[#0B0B0D] flex items-center justify-center font-black text-xs">
                      ⚡
                    </div>
                    <span className="font-extrabold text-base text-[#EDEDE8]">
                      VizagPulse
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowConfirmReset(false);
                    }}
                    className="p-1.5 rounded-lg text-[#94949E] hover:text-[#EDEDE8] hover:bg-[#1B1B20]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* About VizagPulse (exact requirements) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#EDEDE8] uppercase tracking-wider">
                    About VizagPulse
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[rgba(230,230,225,0.10)] space-y-2 text-xs text-[#94949E] leading-relaxed">
                    <p>
                      VizagPulse lets citizens report local infrastructure issues and transparently verify municipal fixes across Visakhapatnam.
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] pt-1 border-t border-white/5">
                      This app is an independent civic technology prototype and is not connected to any government agency.
                    </p>
                  </div>
                </div>

                {/* Live Stats Snippet */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.10)] text-center">
                    <span className="text-[10px] text-[#94949E] uppercase tracking-wider block font-semibold">
                      Open Queue
                    </span>
                    <span className="text-xl font-bold text-[#F59E0B] tnum">
                      {openCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.10)] text-center">
                    <span className="text-[10px] text-[#94949E] uppercase tracking-wider block font-semibold">
                      Resolved
                    </span>
                    <span className="text-xl font-bold text-[#22C55E] tnum">
                      {fixedCount}
                    </span>
                  </div>
                </div>

                {/* System Diagnostics & Demo Controls */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-[#EDEDE8] uppercase tracking-wider">
                    Tools &amp; Controls
                  </h3>

                  {/* Feature G: Run System Check Item */}
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setSystemCheckOpen(true);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-[#1B1B20] hover:bg-[#23232A] border border-[rgba(230,230,225,0.18)] text-xs font-bold text-[#EDEDE8] flex items-center justify-between transition active:scale-98"
                  >
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-[#C8F169]" />
                      <span>Run system check</span>
                    </div>
                    <span className="text-[10px] text-[#C8F169] uppercase font-bold tracking-wider">
                      Self-Test
                    </span>
                  </button>

                  {/* Reset Demo Data Action */}
                  {showConfirmReset ? (
                    <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2">
                      <p className="text-xs text-red-300 font-semibold">
                        Reset all issues and votes to default sample reports?
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onResetDemo();
                            setShowConfirmReset(false);
                            setDrawerOpen(false);
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                        >
                          Confirm Reset
                        </button>
                        <button
                          onClick={() => setShowConfirmReset(false)}
                          className="px-3 py-1.5 rounded-xl bg-[#1B1B20] text-[#94949E] text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmReset(true)}
                      className="w-full py-3 px-4 rounded-2xl bg-[#1B1B20] hover:bg-[#23232a] border border-[rgba(230,230,225,0.18)] text-xs font-bold text-[#EDEDE8] flex items-center justify-center space-x-2 transition active:scale-98"
                    >
                      <RotateCcw className="w-4 h-4 text-[#C8F169]" />
                      <span>Reset Demo Data</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer (exact requirement: "Created by Team Ouroboros") */}
              <div className="pt-6 border-t border-[rgba(230,230,225,0.10)] text-center space-y-1">
                <p className="text-xs font-semibold tracking-wide text-[#EDEDE8]">
                  Created by Team Ouroboros
                </p>
                <p className="text-[10px] text-[#94949E]">
                  VizagPulse v2.5 • Visakhapatnam, AP
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feature G: System Check Bottom Sheet */}
      <SystemCheckModal
        isOpen={systemCheckOpen}
        onClose={() => setSystemCheckOpen(false)}
      />
    </>
  );
};
