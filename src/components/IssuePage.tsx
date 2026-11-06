import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue } from '../types';
import { formatTimeAgo, formatDaysOpen, formatDaysToFix } from '../utils/timeAgo';
import { isIssueDisputed } from '../utils/storage';
import { compressImage } from '../utils/imageCompressor';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { PlusOneButton } from './PlusOneButton';
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

interface IssuePageProps {
  issue: Issue;
  isVotedPlusOne: boolean;
  onTogglePlusOne: (issueId: string) => void;
  deviceFixVote?: 'yes' | 'no';
  onVoteFix: (issueId: string, vote: 'yes' | 'no') => void;
  onMarkFixed: (
    issueId: string,
    photoAfter: string,
    aiVerdict?: 'fixed' | 'not_fixed' | 'unsure' | 'manual',
    aiReason?: string
  ) => void;
  onBack: () => void;
}

export const IssuePage: React.FC<IssuePageProps> = ({
  issue,
  isVotedPlusOne,
  onTogglePlusOne,
  deviceFixVote,
  onVoteFix,
  onMarkFixed,
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

  // Feature E: AI Fix Check State on Issue Page
  const [showFixUpload, setShowFixUpload] = useState<boolean>(false);
  const [tempAfterPhoto, setTempAfterPhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isAiChecking, setIsAiChecking] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    verdict: 'fixed' | 'not_fixed' | 'unsure';
    reason: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleAfterPhotoSelected = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 1024, 0.82);
      // Save photo in state - do NOT run AI automatically
      setTempAfterPhoto(compressed);
      setAiResult(null);
      setAiError(null);
      setIsCompressing(false);
    } catch (err) {
      console.error('Failed to compress after photo:', err);
      setIsCompressing(false);
      alert('Unable to process photo. Please choose another image.');
    }
  };

  const handleManualSkipFix = () => {
    if (!tempAfterPhoto) return;
    onMarkFixed(
      issue.id,
      tempAfterPhoto,
      'manual',
      'Fixed (Manually Verified by GVMC)'
    );
    setShowFixUpload(false);
    setTempAfterPhoto(null);
    setAiResult(null);
    setAiError(null);
  };

  const runAiFixCheck = async (photoAfterBase64: string) => {
    setIsAiChecking(true);
    setAiResult(null);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/fix-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBeforeBase64: issue.photoBefore,
          photoAfterBase64,
          issueType: issue.type,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`API endpoint not reachable or returned HTML: ${res.status}`);
      }

      if (data && data.verdict) {
        setAiResult({
          verdict: data.verdict,
          reason: data.reason || 'Verification comparison complete.',
        });

        // If AI confirmed fixed, auto apply
        if (data.verdict === 'fixed') {
          onMarkFixed(issue.id, photoAfterBase64, 'fixed', data.reason);
          setShowFixUpload(false);
        }
      } else {
        throw new Error('Invalid response shape from AI fix check');
      }
    } catch (err: any) {
      console.warn('AI fix check failed or timed out:', err);
      setAiError(err?.message || 'AI check unavailable');
    } finally {
      setIsAiChecking(false);
    }
  };

  const confirmManualFix = () => {
    if (!tempAfterPhoto) return;
    onMarkFixed(
      issue.id,
      tempAfterPhoto,
      'manual',
      'Fixed (Manually Verified by GVMC)'
    );
    setShowFixUpload(false);
    setTempAfterPhoto(null);
    setAiResult(null);
    setAiError(null);
  };

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

          {/* Feature B: +1 Button (idle "+1", active "+N", no thumbs-up icon) */}
          <PlusOneButton
            isVoted={isVotedPlusOne}
            count={issue.plusOnes}
            onToggle={() => onTogglePlusOne(issue.id)}
            size="md"
          />
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
        <div className="p-3.5 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.10)] text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
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

          {issue.priority && issue.status === 'open' && (
            <span className="text-[10px] font-bold text-[#EDEDE8] bg-[#0B0B0D] px-2 py-0.5 rounded-full border border-[rgba(230,230,225,0.12)]">
              Priority {issue.priority}/10
            </span>
          )}
        </div>

        {/* Priority Reason info if open */}
        {issue.status === 'open' && issue.priorityReason && (
          <p className="text-xs text-[#94949E] italic px-1">
            "{issue.priorityReason}"
          </p>
        )}

        {/* If Open: Upload After Photo Button (Feature E on Issue Page) */}
        {issue.status === 'open' && !showFixUpload && (
          <button
            type="button"
            onClick={() => setShowFixUpload(true)}
            className="w-full py-3 px-4 rounded-full bg-[#1B1B20] hover:bg-[#24242C] text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-extrabold flex items-center justify-center space-x-2 transition active:scale-98"
          >
            <Camera className="w-4 h-4 text-[#C8F169]" />
            <span>Upload "After" Photo (Verify Fix)</span>
          </button>
        )}
      </div>

      {/* Feature E: Inline Fix Upload & AI Check on Issue Page */}
      {issue.status === 'open' && showFixUpload && (
        <div className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#EDEDE8]">
              Verify Resolved Fix
            </h3>
            <button
              onClick={() => {
                setShowFixUpload(false);
                setTempAfterPhoto(null);
                setAiResult(null);
              }}
              className="text-xs text-[#94949E] hover:text-[#EDEDE8]"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-[#94949E]">
            Take or upload an after photo of the repaired spot. Gemini will compare before and after.
          </p>

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

          {tempAfterPhoto ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-[#22C55E]/40">
                <img
                  src={tempAfterPhoto}
                  alt="After repair preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#22C55E] text-[#0B0B0D] text-[10px] font-extrabold uppercase">
                  AFTER PHOTO
                </div>
                <button
                  type="button"
                  disabled={isAiChecking}
                  onClick={() => {
                    setTempAfterPhoto(null);
                    setAiResult(null);
                    setAiError(null);
                  }}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/80 hover:bg-black text-white text-[11px] font-semibold border border-white/20 transition"
                >
                  Change photo
                </button>
              </div>

              {/* Step 2 Options: Run AI Verification VS Mark Fixed Manually (Skip AI) */}
              {!isAiChecking && !aiResult && !aiError && (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => runAiFixCheck(tempAfterPhoto)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#C8F169] hover:bg-[#d6f78a] text-[#0B0B0D] text-xs font-black flex items-center justify-center space-x-2 shadow transition active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-[#0B0B0D]" />
                    <span>Run AI Verification &amp; Close</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualSkipFix}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#1B1B20] hover:bg-[#23232A] text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Mark as Fixed Manually (Skip AI)</span>
                  </button>
                </div>
              )}

              {/* Shimmering "Checking with AI..." */}
              {isAiChecking && (
                <div className="p-3.5 rounded-2xl bg-[#1B1B20] border border-[#C8F169]/30 flex items-center space-x-2.5 text-xs text-[#EDEDE8]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C8F169]" />
                  <span>Checking with AI... comparing before &amp; after photos</span>
                </div>
              )}

              {/* AI Result Card */}
              {aiResult && !isAiChecking && (
                <div className="p-3.5 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center space-x-1.5 text-[#EDEDE8]">
                      <Sparkles className="w-3.5 h-3.5 text-[#C8F169]" />
                      <span>AI-assisted check</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0B0B0D] text-[#C8F169] border border-[#C8F169]/30 uppercase">
                      AI
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {aiResult.verdict === 'fixed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 border border-[#22C55E] text-[#22C55E] text-xs font-bold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Verified Fixed</span>
                      </span>
                    )}
                    {aiResult.verdict === 'not_fixed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500 text-red-300 text-xs font-bold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Not Fixed: Issue Remains</span>
                      </span>
                    )}
                    {aiResult.verdict === 'unsure' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-xs font-bold flex items-center space-x-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Unsure: Location or Scene Ambiguous</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#94949E] leading-relaxed">
                    "{aiResult.reason}"
                  </p>

                  {/* Actions for not_fixed or unsure: Prominent Override */}
                  {(aiResult.verdict === 'not_fixed' || aiResult.verdict === 'unsure') && (
                    <div className="pt-1.5 space-y-2">
                      <button
                        type="button"
                        onClick={confirmManualFix}
                        className="w-full py-2.5 px-4 rounded-full bg-[#EDEDE8] hover:bg-white text-[#0B0B0D] text-xs font-black transition shadow flex items-center justify-center space-x-1.5 active:scale-98"
                      >
                        <CheckCircle className="w-4 h-4 text-[#0B0B0D]" />
                        <span>Override &amp; Mark Fixed Anyway</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-full bg-[#1B1B20] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold transition text-center"
                      >
                        Retake photo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Error / Timeout Fallback */}
              {aiError && !isAiChecking && (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center space-x-2 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold">AI Verification Alert</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    {aiError}. You can override and mark this issue as fixed manually without AI.
                  </p>
                  <button
                    type="button"
                    onClick={confirmManualFix}
                    className="w-full py-2.5 px-4 rounded-full bg-[#EDEDE8] hover:bg-white text-[#0B0B0D] text-xs font-black transition shadow flex items-center justify-center space-x-1.5 active:scale-98"
                  >
                    <CheckCircle className="w-4 h-4 text-[#0B0B0D]" />
                    <span>Override &amp; Mark Fixed Anyway</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={isCompressing}
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-full bg-[#EDEDE8] hover:bg-white text-[#0B0B0D] text-xs font-extrabold flex items-center justify-center space-x-2 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Take After Photo (Camera)</span>
              </button>
              <button
                type="button"
                disabled={isCompressing}
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-full bg-[#1B1B20] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold flex items-center justify-center space-x-2 transition"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Choose from gallery</span>
              </button>
            </div>
          )}
        </div>
      )}

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
