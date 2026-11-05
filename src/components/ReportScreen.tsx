import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, IssueType, AiAnalysisResult } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ExternalLink,
  Sparkles,
  Loader2,
  RefreshCw,
  Send,
  AlertTriangle,
  Building2,
  ShieldAlert,
} from 'lucide-react';

interface ReportScreenProps {
  onIssueCreated: (newIssue: Issue) => void;
  onCancel: () => void;
}

const ISSUE_OPTIONS: IssueType[] = [
  'Pothole',
  'Drain / Sewage',
  'Garbage',
  'Streetlight',
  'Water leak',
  'Other',
];

export const ReportScreen: React.FC<ReportScreenProps> = ({
  onIssueCreated,
  onCancel,
}) => {
  // Step 1: Photo
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Location
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'locating' | 'success' | 'denied'
  >('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualArea, setManualArea] = useState<string>('');

  // Step 3: Issue Type
  const [selectedType, setSelectedType] = useState<IssueType | null>(null);
  const [customType, setCustomType] = useState<string>('');

  // Step 4: AI Analysis State
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Success "Good Job" Screen State
  const [showSuccessCard, setShowSuccessCard] = useState<boolean>(false);
  const [createdIssueHolder, setCreatedIssueHolder] = useState<Issue | null>(null);

  // Geolocation auto-request on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      (error) => {
        console.warn('Geolocation denied or error:', error.message);
        setLocationStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Photo processing
  const handlePhotoFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 0.82);
      setPhotoData(compressed);
      setIsCompressing(false);

      // Trigger Gemini analysis automatically
      triggerAiAnalysis(compressed);
    } catch (err: any) {
      console.error('Image compression failed:', err);
      setIsCompressing(false);
      alert('Unable to process photo. Please choose another image.');
    }
  };

  // Automatic Gemini call via server proxy
  const triggerAiAnalysis = async (base64Img: string) => {
    setAiLoading(true);
    setAiError(null);

    const callApi = async () => {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64Img }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    };

    try {
      let data: AiAnalysisResult;
      try {
        data = await callApi();
      } catch (err) {
        console.warn('First AI call failed, retrying once...', err);
        data = await callApi();
      }

      setAiResult(data);

      // Automatically pre-select suggested type, but user can change it
      if (data.suggestedType && ISSUE_OPTIONS.includes(data.suggestedType)) {
        setSelectedType(data.suggestedType);
      }
    } catch (err: any) {
      console.warn('AI analysis failed:', err);
      setAiError('AI analysis could not complete. You can still select the issue type and post normally.');
    } finally {
      setAiLoading(false);
    }
  };

  // Validation
  const hasPhoto = Boolean(photoData);
  const hasLocation =
    (locationStatus === 'success' && coords !== null) ||
    manualArea.trim().length > 0;
  const hasType =
    selectedType !== null &&
    (selectedType !== 'Other' || customType.trim().length > 0);

  const canPost = hasPhoto && hasLocation && hasType && !isCompressing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost || !photoData || !selectedType) return;

    let areaDescription = manualArea.trim();
    if (!areaDescription && coords) {
      areaDescription = `Vizag (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    }

    const newIssue: Issue = {
      id: `vizag-${Date.now()}`,
      photoBefore: photoData,
      type: selectedType,
      customType: selectedType === 'Other' ? customType.trim() : undefined,
      latitude: coords ? coords.lat : null,
      longitude: coords ? coords.lng : null,
      areaName: areaDescription || 'Visakhapatnam, Andhra Pradesh',
      plusOnes: 1,
      status: 'open',
      createdAt: Date.now(),
      fixYes: 0,
      fixNo: 0,
      aiSeverity: aiResult?.severity,
      aiReason: aiResult?.severityReason,
      aiSituation: aiResult?.situation,
      aiHazard: aiResult?.hazard,
      aiDepartment: aiResult?.department,
    };

    setCreatedIssueHolder(newIssue);
    setShowSuccessCard(true);

    // After brief celebration animation, post to feed
    setTimeout(() => {
      onIssueCreated(newIssue);
    }, 1800);
  };

  return (
    <div className="pb-36 pt-3 px-4 max-w-md mx-auto space-y-5">
      {/* Full-screen "Good Job" Success Card Animation */}
      <AnimatePresence>
        {showSuccessCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B0B0D]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220 }}
              className="w-24 h-24 rounded-full bg-[#C8F169] text-[#0B0B0D] flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(200,241,105,0.4)]"
            >
              <CheckCircle2 className="w-14 h-14 stroke-[2.5]" />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-black text-[#EDEDE8] tracking-tight mb-2"
            >
              Good Job!
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-[#94949E] max-w-xs leading-relaxed"
            >
              Your civic report has been lodged into the VizagPulse audit feed.
            </motion.p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-6 px-4 py-2 rounded-full bg-[#141417] border border-[rgba(230,230,225,0.18)] text-xs font-semibold text-[#C8F169]"
            >
              Redirecting to Live Feed...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Title */}
      <div className="flex items-center justify-between border-b border-[rgba(230,230,225,0.10)] pb-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#EDEDE8]">
            Report Issue
          </h1>
          <p className="text-xs text-[#94949E] mt-0.5">
            Log an infrastructure hazard in Visakhapatnam
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-full bg-[#141417] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] font-semibold transition"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ================= STEP 1: CAPTURE PHOTO ================= */}
        <section className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#C8F169] text-[#0B0B0D] text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-[#EDEDE8]">Capture Photo</h2>
            </div>
            {photoData && (
              <span className="text-[10px] text-[#22C55E] font-bold tracking-wider flex items-center space-x-1 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Photo Ready</span>
              </span>
            )}
          </div>

          {photoData ? (
            <div className="space-y-4">
              <div className="relative aspect-[16/10] bg-[#0B0B0D] rounded-2xl overflow-hidden border border-[rgba(230,230,225,0.10)]">
                <img
                  src={photoData}
                  alt="Captured civic issue"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoData(null);
                    setAiResult(null);
                    setAiError(null);
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[#0B0B0D]/90 text-white text-xs font-semibold border border-white/20 backdrop-blur-md flex items-center space-x-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>

              {/* Shimmering Skeleton while AI loads */}
              {aiLoading && (
                <div className="bg-[#1B1B20] border border-[rgba(230,230,225,0.14)] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#C8F169] animate-spin" />
                      <span className="text-xs font-bold text-[#EDEDE8]">
                        Analyzing scene with Gemini...
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[#94949E] uppercase">
                      Multimodal
                    </span>
                  </div>
                  {/* Shimmer lines */}
                  <div className="space-y-2 pt-1">
                    <div className="h-3 rounded-full animate-shimmer w-full"></div>
                    <div className="h-3 rounded-full animate-shimmer w-4/5"></div>
                    <div className="h-3 rounded-full animate-shimmer w-3/5"></div>
                  </div>
                  <div className="pt-2 flex items-center space-x-2">
                    <div className="h-6 w-24 rounded-full animate-shimmer"></div>
                    <div className="h-6 w-32 rounded-full animate-shimmer"></div>
                  </div>
                </div>
              )}

              {/* AI Analysis Result Card */}
              {aiResult && !aiLoading && (
                <div className="bg-[#1B1B20] border border-[rgba(230,230,225,0.18)] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[rgba(230,230,225,0.10)] pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#C8F169]" />
                      <h3 className="text-xs font-extrabold text-[#EDEDE8] tracking-tight">
                        AI Analysis
                      </h3>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#0B0B0D] text-[#C8F169] border border-[#C8F169]/30 uppercase tracking-widest">
                      AI-generated
                    </span>
                  </div>

                  {/* Situation Text First (2-3 sentences) */}
                  <div>
                    <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider block mb-1">
                      Observed Situation
                    </span>
                    <p className="text-xs text-[#EDEDE8] leading-relaxed">
                      {aiResult.situation}
                    </p>
                  </div>

                  {/* Severity with visual bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-[#94949E] uppercase tracking-wider">
                        Assessed Severity
                      </span>
                      <span className="font-mono font-extrabold text-sm text-[#C8F169] tnum">
                        {aiResult.severity}
                        <span className="text-[10px] text-[#94949E]">/10</span>
                      </span>
                    </div>

                    {/* Visual Severity Bar */}
                    <div className="w-full h-2.5 bg-[#0B0B0D] rounded-full overflow-hidden p-0.5 border border-[rgba(230,230,225,0.10)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          aiResult.severity >= 8
                            ? 'bg-gradient-to-r from-amber-400 to-red-500'
                            : aiResult.severity >= 5
                            ? 'bg-gradient-to-r from-[#C8F169] to-amber-400'
                            : 'bg-[#C8F169]'
                        }`}
                        style={{ width: `${(aiResult.severity / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#94949E] italic">
                      "{aiResult.severityReason}"
                    </p>
                  </div>

                  {/* Hazard Risk */}
                  <div className="p-2.5 rounded-xl bg-[#0B0B0D] border border-red-500/20 flex items-start space-x-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">
                        Direct Public Hazard
                      </span>
                      <p className="text-[#EDEDE8] text-[11px] mt-0.5">
                        {aiResult.hazard}
                      </p>
                    </div>
                  </div>

                  {/* Responsible Department */}
                  <div className="flex items-center space-x-2 text-xs text-[#94949E] pt-1 border-t border-[rgba(230,230,225,0.10)]">
                    <Building2 className="w-3.5 h-3.5 text-[#C8F169] shrink-0" />
                    <span>Routing:</span>
                    <strong className="text-[#EDEDE8] font-semibold truncate">
                      {aiResult.department}
                    </strong>
                  </div>
                </div>
              )}

              {/* Error fallback with Try Again button */}
              {aiError && !aiLoading && (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="flex items-start space-x-2 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{aiError}</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        You can still fill in the details below and post normally.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerAiAnalysis(photoData)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                }}
              />

              <button
                type="button"
                disabled={isCompressing}
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 px-4 rounded-2xl bg-[#EDEDE8] hover:bg-white text-[#0B0B0D] font-extrabold text-sm flex items-center justify-center space-x-2.5 shadow active:scale-98 transition"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Optimizing photo...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 stroke-[2.5]" />
                    <span>Take Photo with Camera</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isCompressing}
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#1B1B20] hover:bg-[#23232A] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] text-xs font-bold flex items-center justify-center space-x-2 transition"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Or select from gallery</span>
              </button>
            </div>
          )}
        </section>

        {/* ================= STEP 2: LOCATION VERIFICATION ================= */}
        <section className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#C8F169] text-[#0B0B0D] text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-[#EDEDE8]">Location</h2>
            </div>
            {hasLocation && (
              <span className="text-[10px] text-[#22C55E] font-bold tracking-wider flex items-center space-x-1 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Location Set</span>
              </span>
            )}
          </div>

          {locationStatus === 'locating' && (
            <div className="p-3 rounded-2xl bg-[#1B1B20] border border-[rgba(230,230,225,0.10)] flex items-center space-x-2 text-xs text-[#94949E]">
              <Loader2 className="w-4 h-4 animate-spin text-[#C8F169]" />
              <span>Locating GPS in Visakhapatnam...</span>
            </div>
          )}

          {locationStatus === 'success' && coords && (
            <div className="p-3.5 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#22C55E]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Location captured</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-[#C8F169] hover:underline font-bold"
                >
                  <span>View on map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] font-mono text-[#94949E]">
                {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E
              </p>
              <input
                type="text"
                placeholder="Optional area name (e.g. Rushikonda, MVP Colony, Gajuwaka)"
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[#0B0B0D] border border-[rgba(230,230,225,0.18)] text-xs text-[#EDEDE8] placeholder-[#94949E]/60 focus:border-[#C8F169] focus:outline-none"
              />
            </div>
          )}

          {locationStatus === 'denied' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start space-x-2 text-xs text-[#F59E0B]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">GPS permission unavailable or denied.</p>
                  <p className="text-[11px] text-[#94949E] mt-0.5">
                    Type your Visakhapatnam area or landmark below to continue.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#94949E] mb-1">
                  Area / Landmark Name *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-[#C8F169]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madhurawada, Dwaraka Nagar, PM Palem"
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0B0B0D] border border-[rgba(230,230,225,0.18)] text-xs text-[#EDEDE8] placeholder-[#94949E]/60 focus:border-[#C8F169] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={requestLocation}
                className="text-[11px] text-[#C8F169] hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry GPS</span>
              </button>
            </div>
          )}
        </section>

        {/* ================= STEP 3: WHAT'S THE ISSUE? ================= */}
        <section className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#C8F169] text-[#0B0B0D] text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-bold text-[#EDEDE8]">
                What's the issue?
              </h2>
            </div>
            {hasType && (
              <span className="text-[10px] text-[#22C55E] font-bold tracking-wider flex items-center space-x-1 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selected</span>
              </span>
            )}
          </div>

          {/* Big Tappable Buttons with auto-preselect support */}
          <div className="grid grid-cols-2 gap-2.5">
            {ISSUE_OPTIONS.map((type) => {
              const isSelected = selectedType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`py-3.5 px-3.5 rounded-2xl border text-xs font-bold text-left transition flex items-center justify-between active:scale-98 ${
                    isSelected
                      ? 'bg-[#C8F169] text-[#0B0B0D] border-[#C8F169] shadow-md shadow-[#C8F169]/20'
                      : 'bg-[#1B1B20] text-[#EDEDE8] border-[rgba(230,230,225,0.12)] hover:border-[rgba(230,230,225,0.25)]'
                  }`}
                >
                  <span>{type}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#0B0B0D]"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* If "Other" is tapped */}
          {selectedType === 'Other' && (
            <div className="pt-2">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-[#94949E] mb-1">
                Describe problem in a word or two *
              </label>
              <input
                type="text"
                required
                maxLength={45}
                placeholder="e.g. Open utility trench, Broken sidewalk slab"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0D] border border-[rgba(230,230,225,0.18)] text-xs text-[#EDEDE8] placeholder-[#94949E]/60 focus:border-[#C8F169] focus:outline-none"
              />
            </div>
          )}
        </section>

        {/* ================= STEP 4: BIG ACCENT POST BUTTON ================= */}
        <section className="space-y-2 pt-1">
          <button
            type="submit"
            disabled={!canPost}
            className={`w-full py-4 px-6 rounded-full font-extrabold text-sm tracking-wide flex items-center justify-center space-x-2 transition shadow-xl active:scale-98 ${
              canPost
                ? 'bg-[#C8F169] hover:bg-[#d6f78a] text-[#0B0B0D] cursor-pointer shadow-[#C8F169]/30 ring-4 ring-[#C8F169]/20'
                : 'bg-[#141417] text-[#94949E]/50 border border-[rgba(230,230,225,0.10)] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>Post to VizagPulse Feed</span>
          </button>

          {!canPost && (
            <p className="text-center text-[11px] text-[#94949E]">
              {!hasPhoto
                ? '• Take or choose a photo to continue'
                : !hasLocation
                ? '• Set or type the location to continue'
                : !hasType
                ? '• Choose the issue category to continue'
                : 'Complete required steps'}
            </p>
          )}
        </section>
      </form>
    </div>
  );
};
