import React from 'react';
import { Info, ShieldAlert, Cpu, CheckCircle2, MapPin, Sparkles, Smartphone } from 'lucide-react';

interface InfoScreenProps {
  onResetDemo: () => void;
}

export const InfoScreen: React.FC<InfoScreenProps> = ({ onResetDemo }) => {
  return (
    <div className="pb-32 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Top Banner */}
      <div className="border-b border-white/[0.08] pb-3">
        <div className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-[#ffc174]" />
          <h1 className="text-xl font-bold tracking-tight text-[#F9FAFB]">
            About Apex
          </h1>
        </div>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Civic issue accountability system for Visakhapatnam (Vizag)
        </p>
      </div>

      {/* Prototype Notice Box */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#ffc174]">
          <ShieldAlert className="w-4 h-4 text-[#F59E0B]" />
          <span>Independent Civic Prototype</span>
        </div>
        <p className="text-xs text-[#d8c3ad] leading-relaxed">
          Apex is a concept prototype designed to streamline civic issue reporting
          and transparent fix verification in Visakhapatnam.
        </p>
        <p className="text-[11px] text-[#94A3B8] font-medium border-t border-white/[0.08] pt-2">
          <strong>Notice:</strong> This application is an independent technological prototype.
          It is not affiliated with, endorsed by, or connected to the Greater Visakhapatnam
          Municipal Corporation (GVMC) or any government agency.
        </p>
      </div>

      {/* How It Works Bento Grid */}
      <div className="bg-[#131822] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <h2 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
          Core Architecture &amp; Features
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-4 h-4 text-[#ffc174] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Mobile-First Instant Reporting</p>
              <p className="text-[#94A3B8] text-[11px] mt-0.5">
                No passwords or login required. Camera capture with automatic client-side
                image compression (~800px JPEG) ensures swift operation on 4G networks.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-[#6bd8cb] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Precise Geolocation &amp; Manual Fallback</p>
              <p className="text-[#94A3B8] text-[11px] mt-0.5">
                Automatically detects device coordinates with direct Google Maps verification links.
                Includes manual landmark typing if GPS permissions are denied.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-[#ffc174] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Multimodal AI (Gemini 3.8 Flash)</p>
              <p className="text-[#94A3B8] text-[11px] mt-0.5">
                Evaluates photo severity (1-10) upon reporting. When an issue is marked fixed,
                Gemini compares before and after photos to flag incomplete or superficial repairs.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Citizen Fix Auditing &amp; Dispute State</p>
              <p className="text-[#94A3B8] text-[11px] mt-0.5">
                Interactive Before/After slider lets citizens inspect repairs. Community votes
                determine if an issue is verified or marked as "Disputed".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage and Reset */}
      <div className="bg-[#131822] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <h2 className="text-xs font-bold text-[#F9FAFB] uppercase tracking-wider">
          Local Persistence
        </h2>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          All reports, +1 endorsements, and verification votes are stored locally on your device
          using <code className="text-[#ffc174] font-mono">localStorage</code>.
        </p>
        <button
          onClick={onResetDemo}
          className="w-full py-2.5 px-3 rounded-xl bg-[#1B2230] hover:bg-[#252f42] text-[#e0e2ea] border border-white/10 text-xs font-semibold transition"
        >
          Reset Demo Data to Initial State
        </button>
      </div>
    </div>
  );
};
