import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, IssueType } from '../types';
import { formatDaysOpen, formatDaysToFix } from '../utils/timeAgo';
import { compressImage } from '../utils/imageCompressor';
import {
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Loader2,
  X,
  Sparkles,
  BarChart3,
  Building2,
} from 'lucide-react';

interface AuthorityScreenProps {
  issues: Issue[];
  onMarkFixed: (
    issueId: string,
    photoAfter: string,
    aiCheckVerdict?: 'fixed' | 'not_fixed' | 'unsure',
    aiCheckReason?: string
  ) => void;
  onSelectIssue: (issue: Issue) => void;
}

const CATEGORIES: IssueType[] = [
  'Pothole',
  'Drain / Sewage',
  'Garbage',
  'Streetlight',
  'Water leak',
  'Other',
];

export const AuthorityScreen: React.FC<AuthorityScreenProps> = ({
  issues,
  onMarkFixed,
  onSelectIssue,
}) => {
  const [selectedIssueForFix, setSelectedIssueForFix] = useState<Issue | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [aiChecking, setAiChecking] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    verdict: 'fixed' | 'not_fixed' | 'unsure';
    reason: string;
  } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Compute stats
  const openIssues = issues.filter((i) => i.status === 'open');
  const fixedIssues = issues.filter((i) => i.status === 'fixed');

  const totalFixDays = fixedIssues.reduce((acc, curr) => {
    const end = curr.fixedAt || Date.now();
    const days = Math.max(1, Math.round((end - curr.createdAt) / (1000 * 60 * 60 * 24)));
    return acc + days;
  }, 0);

  const avgFixTime =
    fixedIssues.length > 0 ? (totalFixDays / fixedIssues.length).toFixed(1) : '0';

  // Issue counts by type for bar chart
  const countsByType = CATEGORIES.map((cat) => ({
    category: cat,
    count: issues.filter((i) => i.type === cat).length,
  }));
  const maxCategoryCount = Math.max(1, ...countsByType.map((c) => c.count));

  // Sort open issues by priority (severity, +1s, age)
  const sortedOpenIssues = [...openIssues].sort((a, b) => {
    const scoreA = (a.aiSeverity ?? 0) + a.plusOnes;
    const scoreB = (b.aiSeverity ?? 0) + b.plusOnes;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return a.createdAt - b.createdAt;
  });

  const handleOpenFixModal = (issue: Issue) => {
    setSelectedIssueForFix(issue);
    setAfterPhoto(null);
    setAiResult(null);
  };

  const handleAfterPhotoSelected = async (file: File) => {
    if (!selectedIssueForFix) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 0.82);
      setAfterPhoto(compressed);
      setIsCompressing(false);

      // Run AI fix verification
      runAiFixCheck(selectedIssueForFix, compressed);
    } catch (err) {
      console.error('Failed to compress after photo:', err);
      setIsCompressing(false);
    }
  };

  const runAiFixCheck = async (issue: Issue, afterPhotoData: string) => {
    setAiChecking(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai/fix-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBeforeBase64: issue.photoBefore,
          photoAfterBase64: afterPhotoData,
          issueType: issue.type,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.verdict) {
        setAiResult({
          verdict: data.verdict,
          reason: data.reason || 'AI verification complete.',
        });
      }
    } catch (err: any) {
      console.warn('AI fix check failed/skipped silently:', err);
      setAiResult(null);
    } finally {
      setAiChecking(false);
    }
  };

  const handleConfirmFix = () => {
    if (!selectedIssueForFix || !afterPhoto) return;
    onMarkFixed(
      selectedIssueForFix.id,
      afterPhoto,
      aiResult?.verdict,
      aiResult?.reason
    );
    setSelectedIssueForFix(null);
    setAfterPhoto(null);
    setAiResult(null);
  };

  return (
    <div className="pb-36 pt-3 px-4 max-w-md mx-auto space-y-5">
      {/* Header & Authority view (prototype) Badge */}
      <div className="border-b border-[rgba(230,230,225,0.10)] pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#C8F169]" />
              <h1 className="text-2xl font-black tracking-tight text-[#EDEDE8]">
                Authority Hub
              </h1>
            </div>
            <p className="text-xs text-[#94949E] mt-0.5">
              Municipal public works resolution queue
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] text-[#C8F169] text-[10px] font-extrabold uppercase tracking-wider">
            Authority view (prototype)
          </span>
        </div>
      </div>

      {/* 3 Stat Tiles: Open, Fixed, Average Fix Time */}
      <div className="grid grid-cols-3 gap-2.5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-2xl p-3.5 text-center space-y-1 shadow-sm"
        >
          <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider block">
            Open
          </span>
          <span className="text-2xl font-black text-[#F59E0B] tnum">
            {openIssues.length}
          </span>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-2xl p-3.5 text-center space-y-1 shadow-sm"
        >
          <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider block">
            Fixed
          </span>
          <span className="text-2xl font-black text-[#22C55E] tnum">
            {fixedIssues.length}
          </span>
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-2xl p-3.5 text-center space-y-1 shadow-sm"
        >
          <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider block">
            Avg Fix Time
          </span>
          <span className="text-2xl font-black text-[#EDEDE8] tnum">
            {avgFixTime}
            <span className="text-xs font-semibold text-[#94949E] ml-0.5">d</span>
          </span>
        </motion.div>
      </div>

      {/* Small Bar Chart of issues by type */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-[#C8F169]" />
            <h3 className="text-xs font-extrabold text-[#EDEDE8] uppercase tracking-wider">
              Issues by Category
            </h3>
          </div>
          <span className="text-[10px] text-[#94949E] font-semibold">
            Total {issues.length} reports
          </span>
        </div>

        {/* Modern styled horizontal bar chart */}
        <div className="space-y-2.5">
          {countsByType.map(({ category, count }) => {
            const percentage = Math.round((count / maxCategoryCount) * 100);
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-xs font-semibold text-[#EDEDE8]">
                    {category}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#94949E] tnum">
                    {count}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#0B0B0D] rounded-full overflow-hidden p-0.5 border border-[rgba(230,230,225,0.08)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-[#C8F169] rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Priority Work Orders Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#94949E] px-1">
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#EDEDE8]">
            Priority Queue ({sortedOpenIssues.length})
          </span>
          <span className="text-[10px]">Severity &amp; +1s Ranked</span>
        </div>

        {sortedOpenIssues.length === 0 ? (
          <div className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto" />
            <h4 className="text-sm font-extrabold text-[#EDEDE8]">
              All Issues Cleared!
            </h4>
            <p className="text-xs text-[#94949E]">
              Zero pending infrastructure defects in Visakhapatnam.
            </p>
          </div>
        ) : (
          sortedOpenIssues.map((issue) => {
            const displayType =
              issue.type === 'Other' && issue.customType
                ? issue.customType
                : issue.type;

            return (
              <motion.div
                key={issue.id}
                whileTap={{ scale: 0.99 }}
                className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-4 space-y-3 shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-[#1B1B20] text-[#C8F169] border border-[#C8F169]/30">
                    {displayType}
                  </span>
                  <span className="text-xs text-[#94949E] font-medium tnum">
                    {formatDaysOpen(issue.createdAt)}
                  </span>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div
                    onClick={() => onSelectIssue(issue)}
                    className="w-20 h-20 rounded-2xl overflow-hidden bg-[#0B0B0D] border border-[rgba(230,230,225,0.12)] shrink-0 cursor-pointer"
                  >
                    <img
                      src={issue.photoBefore}
                      alt={displayType}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      onClick={() => onSelectIssue(issue)}
                      className="text-xs font-bold text-[#EDEDE8] truncate cursor-pointer hover:underline"
                    >
                      {issue.areaName || 'Visakhapatnam'}
                    </p>
                    <p className="text-[11px] text-[#94949E] line-clamp-1">
                      {issue.aiSituation || issue.aiReason || 'Awaiting municipal inspection.'}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-[#94949E] tnum pt-0.5">
                      <span className="text-[#C8F169] font-bold">
                        Sev {issue.aiSeverity ?? 5}/10
                      </span>
                      <span>•</span>
                      <span>{issue.plusOnes} citizens +1</span>
                    </div>
                  </div>
                </div>

                {/* "Mark as fixed" Action */}
                <div className="pt-2 border-t border-[rgba(230,230,225,0.10)] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenFixModal(issue)}
                    className="px-4 py-2 rounded-full bg-[#EDEDE8] hover:bg-white text-[#0B0B0D] text-xs font-extrabold transition flex items-center space-x-1.5 shadow active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Mark as fixed</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ================= FIX MODAL (After Photo & AI Check) ================= */}
      <AnimatePresence>
        {selectedIssueForFix && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-[#141417] border border-[rgba(230,230,225,0.22)] rounded-[28px] p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[rgba(230,230,225,0.10)] pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#EDEDE8]">
                    Verify &amp; Mark Fixed
                  </h3>
                  <p className="text-xs text-[#94949E]">
                    {selectedIssueForFix.type} • {selectedIssueForFix.areaName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIssueForFix(null)}
                  className="p-1.5 rounded-lg text-[#94949E] hover:text-[#EDEDE8] hover:bg-[#1B1B20]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Before Photo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider">
                  Original Before Photo
                </span>
                <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-[rgba(230,230,225,0.10)]">
                  <img
                    src={selectedIssueForFix.photoBefore}
                    alt="Original issue"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* After Photo Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider block">
                  Take / Upload After Photo *
                </span>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAfterPhotoSelected(file);
                  }}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAfterPhotoSelected(file);
                  }}
                />

                {afterPhoto ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-[#22C55E]/40">
                      <img
                        src={afterPhoto}
                        alt="After repair preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#22C55E] text-[#0B0B0D] text-[10px] font-extrabold uppercase tracking-wider">
                        AFTER PHOTO
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAfterPhoto(null);
                          setAiResult(null);
                        }}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/80 text-white text-[11px] font-semibold border border-white/20"
                      >
                        Change photo
                      </button>
                    </div>

                    {/* AI Fix Check Status */}
                    {aiChecking && (
                      <div className="p-3 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.10)] flex items-center space-x-2 text-xs text-[#94949E]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#C8F169]" />
                        <span>Running AI visual verification...</span>
                      </div>
                    )}

                    {/* AI Fix Check Result */}
                    {aiResult && !aiChecking && (
                      <div className="p-3.5 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <div className="flex items-center space-x-1.5 text-[#EDEDE8]">
                            <Sparkles className="w-3.5 h-3.5 text-[#C8F169]" />
                            <span>AI-assisted check</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#94949E]">
                            Gemini 3.8 Flash
                          </span>
                        </div>

                        {/* Verdict Badge */}
                        <div className="flex items-center space-x-2">
                          {aiResult.verdict === 'fixed' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 border border-[#22C55E] text-[#22C55E] text-xs font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified Fixed</span>
                            </span>
                          )}
                          {aiResult.verdict === 'not_fixed' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500 text-red-300 text-xs font-bold flex items-center space-x-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Warning: Issue Still Detected</span>
                            </span>
                          )}
                          {aiResult.verdict === 'unsure' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-xs font-bold flex items-center space-x-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Unsure: Location or Angle Ambiguous</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#94949E] leading-relaxed">
                          "{aiResult.reason}"
                        </p>

                        {/* Warning if AI says not_fixed (authority still allowed to override) */}
                        {aiResult.verdict === 'not_fixed' && (
                          <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-[11px] text-red-200">
                            ⚠️ <strong>Authority Override:</strong> The AI flagged that the issue may not be resolved. You may still confirm and mark it fixed if you have verified the site in person.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-2xl bg-[#EDEDE8] hover:bg-white text-[#0B0B0D] text-xs font-extrabold flex items-center justify-center space-x-2 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take After Photo (Camera)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-2xl bg-[#1B1B20] hover:bg-[#23232A] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Choose from gallery</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssueForFix(null)}
                  className="flex-1 py-2.5 px-3 rounded-full bg-[#1B1B20] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!afterPhoto || isCompressing || aiChecking}
                  onClick={handleConfirmFix}
                  className={`flex-1 py-2.5 px-3 rounded-full text-xs font-black flex items-center justify-center space-x-1.5 transition ${
                    afterPhoto && !isCompressing && !aiChecking
                      ? 'bg-[#C8F169] hover:bg-[#d6f78a] text-[#0B0B0D] shadow'
                      : 'bg-[#1B1B20] text-[#94949E]/40 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Resolution</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
