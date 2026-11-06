import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, IssueType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { findNearbyDuplicateIssue } from '../utils/geo';
import { DuplicateWarningSheet } from './DuplicateWarningSheet';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';

interface ReportScreenProps {
  existingIssues: Issue[];
  onIssueCreated: (newIssue: Issue) => void;
  onUpvoteExisting: (existingIssue: Issue) => void;
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
  existingIssues,
  onIssueCreated,
  onUpvoteExisting,
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

  // Duplicate Detection State
  const [duplicateMatch, setDuplicateMatch] = useState<{
    issue: Issue;
    distanceMetres: number;
  } | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);

  // Success "Good Job" Animation Screen State
  const [showSuccessCard, setShowSuccessCard] = useState<boolean>(false);
  const [pendingNewIssue, setPendingNewIssue] = useState<Issue | null>(null);

  // Request location automatically on mount
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

  // Compress photo down to ~1024px JPEG
  const handlePhotoFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 1024, 0.82);
      setPhotoData(compressed);
    } catch (err: any) {
      console.error('Image compression failed:', err);
      alert('Unable to process photo. Please choose another image.');
    } finally {
      setIsCompressing(false);
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

  const canPost = hasPhoto && hasLocation && hasType && !isCompressing && !isCheckingDuplicate;

  // Finalizes submission
  const finalizePost = (issue: Issue) => {
    setPendingNewIssue(issue);
    setShowSuccessCard(true);

    setTimeout(() => {
      onIssueCreated(issue);
    }, 1800);
  };

  const handlePostClick = async (e: React.FormEvent) => {
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
      plusOnes: 1, // User's initial device +1
      status: 'open',
      createdAt: Date.now(),
      fixYes: 0,
      fixNo: 0,
    };

    // Feature 3: Check duplicates within 150m if coords are present
    if (coords) {
      const match = findNearbyDuplicateIssue(
        existingIssues,
        selectedType,
        coords.lat,
        coords.lng,
        150
      );

      if (match) {
        setIsCheckingDuplicate(true);
        // Optional quick AI check with 8-second timeout
        try {
          const res = await fetch('/api/ai/duplicate-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              existingPhotoBase64: match.issue.photoBefore,
              newPhotoBase64: photoData,
              issueType: selectedType,
            }),
          });
          const text = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }

          // If AI confirms with certainty it's NOT the same issue, skip warning
          if (data && data.sameIssue === false) {
            setIsCheckingDuplicate(false);
            finalizePost(newIssue);
            return;
          }
        } catch {
          // If AI fails/times out, still show warning based on location match
        }

        setIsCheckingDuplicate(false);
        setDuplicateMatch(match);
        setPendingNewIssue(newIssue);
        return;
      }
    }

    // No duplicate found, proceed immediately
    finalizePost(newIssue);
  };

  return (
    <div className="pb-36 pt-3 px-4 max-w-md mx-auto space-y-5">
      {/* Full-screen "Good Job" Success Screen */}
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
              Your civic report has been added to the VizagPulse audit feed.
            </motion.p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-6 px-4 py-2 rounded-full bg-[#141417] border border-[rgba(230,230,225,0.18)] text-xs font-semibold text-[#C8F169]"
            >
              Returning to Live Feed...
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
            Log an infrastructure problem in Visakhapatnam
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3.5 py-1.5 rounded-full bg-[#141417] text-[#94949E] hover:text-[#EDEDE8] border border-[rgba(230,230,225,0.18)] font-semibold transition"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handlePostClick} className="space-y-5">
        {/* ================= STEP 1: CAPTURE PHOTO ================= */}
        <section className="bg-[#141417] border border-[rgba(230,230,225,0.18)] rounded-[26px] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-[#C8F169] text-[#0B0B0D] text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-[#EDEDE8]">Take Photo</h2>
            </div>
            {photoData && (
              <span className="text-[10px] text-[#22C55E] font-bold tracking-wider flex items-center space-x-1 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Photo Ready</span>
              </span>
            )}
          </div>

          {photoData ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/10] bg-[#0B0B0D] rounded-2xl overflow-hidden border border-[rgba(230,230,225,0.10)]">
                <img
                  src={photoData}
                  alt="Captured civic issue"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoData(null)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-[#0B0B0D]/90 text-white text-xs font-semibold border border-white/20 backdrop-blur-md flex items-center space-x-1.5 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>
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
                    <span>Compressing image...</span>
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

        {/* ================= STEP 2: LOCATION ================= */}
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
              <span>Locating GPS coordinates in Visakhapatnam...</span>
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
                placeholder="Optional area name (e.g. Madhurawada, Rushikonda, MVP Colony)"
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

        {/* ================= STEP 4: POST BUTTON ================= */}
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
            {isCheckingDuplicate ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0B0B0D]" />
                <span>Checking nearby issues...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Post</span>
              </>
            )}
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

      {/* Feature 3: Duplicate Detection Bottom Sheet */}
      <DuplicateWarningSheet
        isOpen={duplicateMatch !== null}
        duplicateMatch={duplicateMatch}
        onUpvoteExisting={(existingIssue) => {
          setDuplicateMatch(null);
          onUpvoteExisting(existingIssue);
        }}
        onReportAnyway={() => {
          const toPost = pendingNewIssue;
          setDuplicateMatch(null);
          if (toPost) {
            finalizePost(toPost);
          }
        }}
        onCancel={() => {
          setDuplicateMatch(null);
        }}
      />
    </div>
  );
};
