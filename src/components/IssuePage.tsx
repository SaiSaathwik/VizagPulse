import React from 'react';
import { motion } from 'motion/react';
import { Issue } from '../types';
import { formatTimeAgo, formatDaysOpen, formatDaysToFix } from '../utils/timeAgo';
import { isIssueDisputed } from '../utils/storage';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  ThumbsUp,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface IssuePageProps {
  issue: Issue;
  isVotedPlusOne: boolean;
  onTogglePlusOne: (issueId: string) => void;
  deviceFixVote?: 'yes' | 'no';
  onVoteFix: (issueId: string, vote: 'yes' | 'no') => void;
  onBack: () => void;
}

export const IssuePage: React.FC<IssuePageProps> = ({
  issue,
  isVotedPlusOne,
  onTogglePlusOne,
  deviceFixVote,
  onVoteFix,
  onBack,
}) => {
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
      className="pb-36 pt-3 px-4 max-w-md mx-auto space-y-4"
    >
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[rgba(230,230,225,0.10)] pb-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#141417] hover:bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] text-xs font-bold text-[#EDEDE8] transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#94949E]" />
          <span>Feed</span>
        </button>

        {/* Status Pill */}
        {isDisputed ? (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Disputed by Citizens</span>
          </span>
        ) : issue.status === 'fixed' ? (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span>Fixed &amp; Verified</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            <span>Open Issue</span>
          </span>
        )}
      </div>

      {/* Hero Media Section */}
      <div className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-3 shadow-md">
        {issue.status === 'fixed' && issue.photoAfter ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1 font-bold text-[#94949E]">
              <span className="text-[#EDEDE8]">Interactive Comparative Audit</span>
              <span className="text-[#22C55E] tnum">
                {formatDaysToFix(issue.createdAt, issue.fixedAt)}
              </span>
            </div>
            {/* Smooth Before / After Comparison Slider */}
            <BeforeAfterSlider
              beforeSrc={issue.photoBefore}
              afterSrc={issue.photoAfter}
              beforeLabel="BEFORE"
              afterLabel="AFTER"
            />
          </div>
        ) : (
          <div className="relative aspect-[16/11] bg-[#0B0B0D] rounded-2xl overflow-hidden border border-[rgba(230,230,225,0.10)]">
            <img
              src={issue.photoBefore}
              alt={displayType}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/80 border border-white/20 text-[#EDEDE8] text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-md">
              Incident Photo
            </div>
          </div>
        )}
      </div>

      {/* Primary Details Card */}
      <div className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1B1B20] text-[#C8F169] border border-[#C8F169]/30 text-[10px] font-extrabold tracking-wider uppercase inline-block">
              {displayType}
            </span>
            <h1 className="text-xl font-extrabold text-[#EDEDE8] tracking-tight">
              {issue.areaName || 'Visakhapatnam'}
            </h1>
          </div>

          {/* +1 Button */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => onTogglePlusOne(issue.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl border transition-all text-xs font-bold tnum shrink-0 ${
              isVotedPlusOne
                ? 'bg-[#C8F169] text-[#0B0B0D] border-[#C8F169] shadow-md shadow-[#C8F169]/20'
                : 'bg-[#1B1B20] hover:bg-[#23232A] text-[#EDEDE8] border-[rgba(230,230,225,0.18)]'
            }`}
          >
            <ThumbsUp
              className={`w-4 h-4 ${
                isVotedPlusOne ? 'fill-[#0B0B0D] stroke-[#0B0B0D]' : ''
              }`}
            />
            <span>+1</span>
            <span className="font-black">{issue.plusOnes}</span>
          </motion.button>
        </div>

        {/* Location & Google Maps Link */}
        <div className="p-3.5 rounded-2xl bg-[#0B0B0D] border border-[rgba(230,230,225,0.10)] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 truncate">
            <MapPin className="w-4 h-4 text-[#C8F169] shrink-0" />
            <span className="text-[#94949E] truncate">
              {hasMap
                ? `${issue.latitude?.toFixed(4)}° N, ${issue.longitude?.toFixed(4)}° E`
                : 'Manually specified location'}
            </span>
          </div>
          {hasMap && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-[#C8F169] hover:underline font-bold text-xs shrink-0 ml-2"
            >
              <span>View Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Status Line */}
        <div className="p-3.5 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.10)] text-xs flex items-center space-x-2">
          {issue.status === 'open' ? (
            <>
              <Clock className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <span className="text-[#F59E0B] font-bold">
                Waiting for a fix. {formatDaysOpen(issue.createdAt)}.
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span className="text-[#22C55E] font-bold">
                {formatDaysToFix(issue.createdAt, issue.fixedAt)}.
              </span>
            </>
          )}
        </div>

        {/* Saved AI Analysis Section: situation, severity, hazard, department */}
        <div className="p-4 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.14)] space-y-3">
          <div className="flex items-center justify-between border-b border-[rgba(230,230,225,0.10)] pb-2">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#EDEDE8]">
              <Sparkles className="w-4 h-4 text-[#C8F169]" />
              <span>AI Analysis</span>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#0B0B0D] text-[#C8F169] border border-[#C8F169]/30 uppercase tracking-widest">
              AI-generated
            </span>
          </div>

          {/* Situation Text */}
          <div>
            <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider block mb-1">
              Situation Assessment
            </span>
            <p className="text-xs text-[#EDEDE8] leading-relaxed">
              {issue.aiSituation || issue.aiReason || 'Civic infrastructure defect logged in Visakhapatnam.'}
            </p>
          </div>

          {/* Severity Meter */}
          {issue.aiSeverity !== undefined && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider">
                  Severity Rating
                </span>
                <span className="font-mono font-extrabold text-sm text-[#C8F169] tnum">
                  {issue.aiSeverity}/10
                </span>
              </div>
              <div className="w-full h-2 bg-[#0B0B0D] rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-[#C8F169]"
                  style={{ width: `${(issue.aiSeverity / 10) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Hazard Risk */}
          {issue.aiHazard && (
            <div className="p-2.5 rounded-xl bg-[#0B0B0D] border border-red-500/20 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">
                  Identified Hazard
                </span>
                <p className="text-[#EDEDE8] text-[11px] mt-0.5">
                  {issue.aiHazard}
                </p>
              </div>
            </div>
          )}

          {/* Department */}
          {issue.aiDepartment && (
            <div className="flex items-center space-x-2 text-xs text-[#94949E] pt-1 border-t border-[rgba(230,230,225,0.08)]">
              <Building2 className="w-3.5 h-3.5 text-[#C8F169] shrink-0" />
              <span>Assigned Department:</span>
              <strong className="text-[#EDEDE8] font-bold truncate">
                {issue.aiDepartment}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* ================= FIXED SECTION: "IS IT REALLY FIXED?" ================= */}
      {issue.status === 'fixed' && (
        <div className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#EDEDE8] tracking-tight">
              Is it really fixed?
            </h3>
            <span className="text-[10px] text-[#94949E] uppercase font-bold tracking-wider">
              Citizen Audit
            </span>
          </div>

          <p className="text-xs text-[#94949E] leading-relaxed">
            Verify whether municipal work is complete. If "No" votes exceed "Yes" votes, this report is flagged as <strong className="text-red-400 font-bold">Disputed</strong>.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Yes button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onVoteFix(issue.id, 'yes')}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                deviceFixVote === 'yes'
                  ? 'bg-[#22C55E]/20 border-[#22C55E] text-white ring-2 ring-[#22C55E]/40'
                  : 'bg-[#1B1B20] hover:bg-[#23232A] border-[rgba(230,230,225,0.14)] text-[#EDEDE8]'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#22C55E]">
                <CheckCircle className="w-4 h-4" />
                <span>Yes, it's fixed</span>
              </div>
              <span className="text-base font-mono font-black text-[#EDEDE8] tnum">
                {issue.fixYes}
              </span>
              {deviceFixVote === 'yes' && (
                <span className="text-[10px] text-[#22C55E] font-bold">
                  ✓ Your vote
                </span>
              )}
            </motion.button>

            {/* No button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onVoteFix(issue.id, 'no')}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-1.5 transition ${
                deviceFixVote === 'no'
                  ? 'bg-red-950/40 border-red-500 text-white ring-2 ring-red-500/40'
                  : 'bg-[#1B1B20] hover:bg-[#23232A] border-[rgba(230,230,225,0.14)] text-[#EDEDE8]'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-red-400">
                <XCircle className="w-4 h-4" />
                <span>No, still broken</span>
              </div>
              <span className="text-base font-mono font-black text-[#EDEDE8] tnum">
                {issue.fixNo}
              </span>
              {deviceFixVote === 'no' && (
                <span className="text-[10px] text-red-300 font-bold">
                  ✓ Your vote
                </span>
              )}
            </motion.button>
          </div>

          {/* Disputed Alert */}
          {isDisputed && (
            <div className="mt-2 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-start space-x-2 text-xs text-red-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold">Citizen Disputed Status</p>
                <p className="text-[11px] text-red-200/80 mt-0.5">
                  Citizens report the problem persists despite closure ({issue.fixNo} no vs {issue.fixYes} yes).
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
