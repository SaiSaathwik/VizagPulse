import React, { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'BEFORE',
  afterLabel = 'AFTER (REPAIRED)',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setSliderPosition(percent);
    },
    [containerRef]
  );

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden select-none bg-[#090D12] border border-white/10 touch-none cursor-ew-resize group"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Background Image: AFTER (repaired) */}
      <img
        src={afterSrc}
        alt="After repair"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#0D9488]/20 border border-[#0D9488]/40 text-[#6bd8cb] text-[10px] font-bold tracking-widest uppercase">
        {afterLabel}
      </div>

      {/* Clipped Foreground Image: BEFORE */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeSrc}
          alt="Before repair"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
            maxWidth: 'none',
          }}
          draggable={false}
        />
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#ffc174] text-[10px] font-bold tracking-widest uppercase">
          {beforeLabel}
        </div>
      </div>

      {/* Divider Line & Circular Grab Handle */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#131822] border-2 border-white shadow-xl flex items-center justify-center pointer-events-none">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M8 9l-4 3 4 3m8-6l4 3-4 3"
            />
          </svg>
        </div>
      </div>

      {/* Interactive Drag Hint */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[#090D12]/80 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-medium tracking-wide pointer-events-none">
        Drag slider to compare
      </div>
    </div>
  );
};
