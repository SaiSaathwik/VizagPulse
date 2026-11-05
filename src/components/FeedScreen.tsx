import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, FeedFilter } from '../types';
import { formatTimeAgo } from '../utils/timeAgo';
import { isIssueDisputed } from '../utils/storage';
import {
  MapPin,
  ThumbsUp,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface FeedScreenProps {
  issues: Issue[];
  votedPlusOnes: Record<string, boolean>;
  onTogglePlusOne: (issueId: string) => void;
  onSelectIssue: (issue: Issue) => void;
  onNavigateToReport: () => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  issues,
  votedPlusOnes,
  onTogglePlusOne,
  onSelectIssue,
  onNavigateToReport,
}) => {
  const [filter, setFilter] = useState<FeedFilter>('all');

  // Filter issues
  const filtered = issues.filter((issue) => {
    if (filter === 'open') return issue.status === 'open';
    if (filter === 'fixed') return issue.status === 'fixed';
    return true;
  });

  // Sort: highest (severity + plusOnes) first, then oldest first
  const sorted = [...filtered].sort((a, b) => {
    const scoreA = (a.aiSeverity ?? 0) + a.plusOnes;
    const scoreB = (b.aiSeverity ?? 0) + b.plusOnes;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return a.createdAt - b.createdAt;
  });

  const openCount = issues.filter((i) => i.status === 'open').length;
  const fixedCount = issues.filter((i) => i.status === 'fixed').length;
  const fixedThisWeek = fixedCount; // sample metric
  const completionRate =
    issues.length > 0 ? Math.round((fixedCount / issues.length) * 100) : 0;

  // SVG Progress Ring calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="pb-32 pt-3 px-4 max-w-md mx-auto space-y-5">
      {/* Hero Stat Card ("X issues fixed this week" with small progress ring) */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1 max-w-[68%]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C8F169]"></span>
              <span className="text-[11px] font-bold text-[#C8F169] uppercase tracking-wider">
                Civic Velocity
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#EDEDE8] tracking-tight">
              {fixedThisWeek} issues fixed this week
            </h2>
            <p className="text-xs text-[#94949E] leading-relaxed">
              Audited by citizens in Greater Visakhapatnam.
            </p>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="rgba(230,230,225,0.10)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="#C8F169"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-[#EDEDE8] tnum">
                {completionRate}%
              </span>
              <span className="text-[8px] font-bold text-[#94949E] uppercase">
                rate
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pill Filter Chips */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-[#141417] border border-[rgba(230,230,225,0.18)] p-1 rounded-full space-x-1">
          {(
            [
              { key: 'all', label: 'All', count: issues.length },
              { key: 'open', label: 'Open', count: openCount },
              { key: 'fixed', label: 'Fixed', count: fixedCount },
            ] as const
          ).map((chip) => {
            const isActive = filter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive ? 'text-[#0B0B0D]' : 'text-[#94949E] hover:text-[#EDEDE8]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="pillActiveIndicator"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="absolute inset-0 bg-[#C8F169] rounded-full shadow-sm"
                  />
                )}
                <span className="relative z-10">
                  {chip.label}{' '}
                  <span className="opacity-75 tnum">({chip.count})</span>
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-semibold text-[#94949E] tracking-tight">
          Priority ranked
        </span>
      </div>

      {/* Issues Feed Cards */}
      {sorted.length === 0 ? (
        <div className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-8 text-center space-y-3">
          <p className="text-sm text-[#94949E]">No issues found in this category.</p>
          <button
            onClick={onNavigateToReport}
            className="px-4 py-2 rounded-full bg-[#C8F169] text-[#0B0B0D] font-extrabold text-xs inline-flex items-center space-x-1.5 shadow"
          >
            <span>Report First Issue</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((issue, index) => {
            const isVoted = !!votedPlusOnes[issue.id];
            const isDisputed = isIssueDisputed(issue);
            const hasMap = issue.latitude !== null && issue.longitude !== null;
            const mapUrl = hasMap
              ? `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`
              : undefined;

            const displayType =
              issue.type === 'Other' && issue.customType
                ? issue.customType
                : issue.type;

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onSelectIssue(issue)}
                className="group bg-[#141417] hover:bg-[#18181E] border border-[rgba(230,230,225,0.18)] hover:border-[rgba(230,230,225,0.30)] rounded-[26px] p-4 transition-all cursor-pointer shadow-md space-y-3.5"
              >
                {/* Image-First Layout */}
                <div className="relative aspect-[16/10] bg-[#0B0B0D] rounded-2xl overflow-hidden border border-[rgba(230,230,225,0.10)]">
                  <img
                    src={issue.photoBefore}
                    alt={displayType}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Type Tag & Status Pill Overlays */}
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#0B0B0D]/85 backdrop-blur-md border border-[rgba(230,230,225,0.18)] text-[#EDEDE8] text-[10px] font-bold tracking-wider uppercase">
                      {displayType}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    {isDisputed ? (
                      <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/85 backdrop-blur-md border border-red-500/40 text-red-300 text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        <span>Disputed</span>
                      </span>
                    ) : issue.status === 'fixed' ? (
                      <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#22C55E]/20 backdrop-blur-md border border-[#22C55E]/40 text-[#22C55E] text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                        <span>Fixed</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/20 backdrop-blur-md border border-[#F59E0B]/40 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                        <span>Open</span>
                      </span>
                    )}
                  </div>

                  {/* AI Severity Badge */}
                  {issue.aiSeverity !== undefined && (
                    <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0B0B0D]/90 backdrop-blur-md border border-[rgba(230,230,225,0.18)] text-xs font-semibold text-[#EDEDE8]">
                      <Sparkles className="w-3.5 h-3.5 text-[#C8F169]" />
                      <span className="text-[11px]">
                        Severity{' '}
                        <strong
                          className={`font-mono font-bold ${
                            issue.aiSeverity >= 8
                              ? 'text-red-400'
                              : issue.aiSeverity >= 5
                              ? 'text-amber-400'
                              : 'text-[#C8F169]'
                          }`}
                        >
                          {issue.aiSeverity}/10
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Before/After tag if fixed */}
                  {issue.status === 'fixed' && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-[#22C55E]/90 text-[#0B0B0D] text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-sm">
                      Compare Fix
                    </div>
                  )}
                </div>

                {/* Details Row: Area, Time Ago, +1 Button */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 text-xs text-[#EDEDE8] font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#C8F169] shrink-0" />
                      <span className="truncate">{issue.areaName || 'Visakhapatnam'}</span>
                      {hasMap && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#94949E] hover:text-[#C8F169] shrink-0"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-[#94949E] line-clamp-1">
                      {issue.aiSituation || issue.aiReason || 'Awaiting municipal inspection.'}
                    </p>

                    <div className="flex items-center space-x-2 text-[11px] text-[#94949E] pt-0.5 tnum">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(issue.createdAt)}</span>
                      {issue.aiDepartment && (
                        <>
                          <span>•</span>
                          <span className="truncate text-[#EDEDE8]/70">
                            {issue.aiDepartment}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* +1 Button with pop animation */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.90 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlusOne(issue.id);
                    }}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl border transition-all text-xs font-bold tnum shrink-0 ${
                      isVoted
                        ? 'bg-[#C8F169] text-[#0B0B0D] border-[#C8F169] shadow-md shadow-[#C8F169]/20'
                        : 'bg-[#1B1B20] hover:bg-[#23232A] text-[#EDEDE8] border-[rgba(230,230,225,0.18)]'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        isVoted ? 'fill-[#0B0B0D] stroke-[#0B0B0D]' : ''
                      }`}
                    />
                    <span>+1</span>
                    <span className="font-extrabold">{issue.plusOnes}</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
