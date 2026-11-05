import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue } from '../types';
import { formatDaysOpen, formatTimeAgo } from '../utils/timeAgo';
import { AlertCircle, ThumbsUp, ArrowRight, X, MapPin } from 'lucide-react';

interface DuplicateWarningSheetProps {
  isOpen: boolean;
  duplicateMatch: { issue: Issue; distanceMetres: number } | null;
  onUpvoteExisting: (issue: Issue) => void;
  onReportAnyway: () => void;
  onCancel: () => void;
}

export const DuplicateWarningSheet: React.FC<DuplicateWarningSheetProps> = ({
  isOpen,
  duplicateMatch,
  onUpvoteExisting,
  onReportAnyway,
  onCancel,
}) => {
  if (!isOpen || !duplicateMatch) return null;

  const { issue, distanceMetres } = duplicateMatch;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#141417] border border-[rgba(230,230,225,0.22)] rounded-[28px] p-5 shadow-2xl space-y-4 z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#EDEDE8] tracking-tight">
                  Looks like this was already reported nearby
                </h3>
                <p className="text-xs text-[#94949E] mt-0.5">
                  An open <strong className="text-[#EDEDE8]">{issue.type}</strong> was found within{' '}
                  <span className="text-[#C8F169] font-bold tnum">{distanceMetres}m</span> of your location.
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-[#94949E] hover:text-[#EDEDE8] hover:bg-[#1B1B20]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Existing Issue Card Snippet */}
          <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[rgba(230,230,225,0.12)] flex items-center space-x-3.5">
            <div className="w-18 h-18 rounded-xl overflow-hidden bg-black shrink-0 border border-[rgba(230,230,225,0.10)]">
              <img
                src={issue.photoBefore}
                alt={issue.type}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#EDEDE8]">
                <MapPin className="w-3.5 h-3.5 text-[#C8F169] shrink-0" />
                <span className="truncate">{issue.areaName || 'Visakhapatnam'}</span>
              </div>
              <p className="text-[11px] text-[#94949E]">
                {formatDaysOpen(issue.createdAt)} •{' '}
                <span className="text-[#EDEDE8] font-semibold tnum">+{issue.plusOnes}</span> endorsements
              </p>
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#1B1B20] text-[#F59E0B] text-[9px] font-extrabold uppercase border border-[#F59E0B]/30">
                Open Report
              </span>
            </div>
          </div>

          {/* Two Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onUpvoteExisting(issue)}
              className="w-full py-3.5 px-4 rounded-full bg-[#C8F169] hover:bg-[#d6f78a] text-[#0B0B0D] text-xs font-extrabold flex items-center justify-center space-x-2 transition shadow-md active:scale-98"
            >
              <ThumbsUp className="w-4 h-4 stroke-[2.5]" />
              <span>+1 that issue instead</span>
            </button>

            <button
              type="button"
              onClick={onReportAnyway}
              className="w-full py-3 px-4 rounded-full bg-[#1B1B20] hover:bg-[#23232A] text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <span>Report anyway (new location / separate issue)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
