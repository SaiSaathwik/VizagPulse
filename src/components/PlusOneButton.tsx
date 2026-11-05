import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PlusOneButtonProps {
  isVoted: boolean;
  count: number;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export const PlusOneButton: React.FC<PlusOneButtonProps> = ({
  isVoted,
  count,
  onToggle,
  size = 'sm',
}) => {
  const isSm = size === 'sm';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.90 }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isVoted ? `Remove +1, current total ${count}` : `Add +1 to issue`}
      className={`relative inline-flex items-center justify-center font-black rounded-2xl border transition-all active:scale-95 tnum select-none overflow-hidden ${
        isSm ? 'px-3.5 py-1.5 text-xs min-w-[54px]' : 'px-4 py-2 text-xs min-w-[64px]'
      } ${
        isVoted
          ? 'bg-[#C8F169] text-[#0B0B0D] border-[#C8F169] shadow-md shadow-[#C8F169]/20'
          : 'bg-[#1B1B20] hover:bg-[#24242C] text-[#EDEDE8] border-[rgba(230,230,225,0.18)]'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isVoted ? (
          <motion.span
            key={`voted-${count}`}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="tracking-tight"
          >
            +{count}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="tracking-tight"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
