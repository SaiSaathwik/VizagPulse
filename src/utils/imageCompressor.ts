/**
 * Compresses an image file or base64 string to ~800px max width JPEG
 * to ensure localStorage stays lean and fast.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    let src = '';
    if (typeof fileOrDataUrl === 'string') {
      src = fileOrDataUrl;
    } else {
      src = URL.createObjectURL(fileOrDataUrl);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (typeof fileOrDataUrl !== 'string') URL.revokeObjectURL(src);
        resolve(src);
        return;
      }

      // Fill with near-black base
      ctx.fillStyle = '#0B0B0D';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      if (typeof fileOrDataUrl !== 'string') {
        URL.revokeObjectURL(src);
      }
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      if (typeof fileOrDataUrl !== 'string') {
        URL.revokeObjectURL(src);
      }
      reject(err);
    };

    img.src = src;
  });
}

/**
 * Creates rich, photorealistic-style vector scenes for each Vizag sample issue
 * so that demo data loads instantly and offline reliably with high visual fidelity.
 */
export function createCivicSceneSvg(config: {
  title: string;
  category: 'Pothole' | 'Drain / Sewage' | 'Garbage' | 'Streetlight' | 'Water leak' | 'Other';
  areaName: string;
  isAfter?: boolean;
  accentColor?: string;
}): string {
  const { title, category, areaName, isAfter } = config;
  const statusColor = isAfter ? '#22C55E' : '#F59E0B';
  const statusText = isAfter ? 'RESOLVED & VERIFIED' : 'ACTIVE CIVIC REPORT';

  // Category specific realistic visual renderings
  let sceneContent = '';

  if (category === 'Pothole') {
    if (isAfter) {
      sceneContent = `
        <!-- Fresh smooth asphalt patch -->
        <rect x="140" y="270" width="520" height="150" rx="20" fill="#18181D" stroke="#22C55E" stroke-width="2" stroke-dasharray="8 6"/>
        <line x1="160" y1="345" x2="640" y2="345" stroke="#C8F169" stroke-width="4" stroke-dasharray="30 20" opacity="0.8"/>
        <circle cx="400" cy="345" r="30" fill="#22C55E" opacity="0.15"/>
        <path d="M 388 345 L 396 353 L 414 335" fill="none" stroke="#C8F169" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="400" y="395" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="700" fill="#22C55E" text-anchor="middle">ASPHALT HOT-MIX RESURFACED</text>
      `;
    } else {
      sceneContent = `
        <!-- Deep jagged pothole crater with asphalt breakdown -->
        <ellipse cx="400" cy="340" rx="190" ry="70" fill="#070709" stroke="#EF4444" stroke-width="2.5"/>
        <ellipse cx="410" cy="345" rx="130" ry="45" fill="#000000"/>
        <!-- Cracks branching out -->
        <path d="M 210 340 L 150 320 M 230 365 L 180 395 M 590 335 L 670 310 M 580 370 L 650 410" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
        <circle cx="410" cy="345" r="8" fill="#EF4444"/>
        <text x="400" y="440" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#F59E0B" text-anchor="middle">CRATER DEPTH ~15CM • IMPACT HAZARD</text>
      `;
    }
  } else if (category === 'Drain / Sewage') {
    if (isAfter) {
      sceneContent = `
        <!-- Restored culvert and desilted channel -->
        <rect x="180" y="270" width="440" height="150" rx="12" fill="#13171B" stroke="#22C55E" stroke-width="2"/>
        <line x1="220" y1="310" x2="580" y2="310" stroke="#38BDF8" stroke-width="2" opacity="0.6"/>
        <line x1="220" y1="350" x2="580" y2="350" stroke="#38BDF8" stroke-width="2" opacity="0.6"/>
        <line x1="220" y1="390" x2="580" y2="390" stroke="#38BDF8" stroke-width="2" opacity="0.6"/>
        <circle cx="400" cy="350" r="26" fill="#22C55E" opacity="0.2"/>
        <path d="M 390 350 L 397 357 L 412 342" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round"/>
        <text x="400" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">DRAIN CLEARED &amp; DESILTED • FREE FLOW</text>
      `;
    } else {
      sceneContent = `
        <!-- Overflowing murky drain and silt buildup -->
        <rect x="160" y="280" width="480" height="130" rx="10" fill="#121815" stroke="#F59E0B" stroke-width="2"/>
        <ellipse cx="400" cy="345" rx="200" ry="40" fill="#1C271E" opacity="0.9"/>
        <path d="M 200 340 Q 300 370 400 340 T 600 350" fill="none" stroke="#22C55E" stroke-width="3" opacity="0.7"/>
        <circle cx="360" cy="335" r="14" fill="#0F1713" stroke="#F59E0B"/>
        <circle cx="440" cy="350" r="18" fill="#0F1713" stroke="#F59E0B"/>
        <text x="400" y="440" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#F59E0B" text-anchor="middle">SEWAGE OVERFLOW • BLOCKED CULVERT</text>
      `;
    }
  } else if (category === 'Streetlight') {
    if (isAfter) {
      sceneContent = `
        <!-- Working bright LED luminaire -->
        <line x1="400" y1="180" x2="400" y2="400" stroke="#475569" stroke-width="8" stroke-linecap="round"/>
        <path d="M 400 190 Q 420 160 470 170" fill="none" stroke="#94A3B8" stroke-width="6"/>
        <polygon points="450,170 490,170 540,360 400,360" fill="url(#lightBeam)" opacity="0.45"/>
        <circle cx="470" cy="170" r="12" fill="#FEF08A"/>
        <circle cx="470" cy="170" r="28" fill="#FEF08A" opacity="0.25"/>
        <text x="400" y="430" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#C8F169" text-anchor="middle">NEW HIGH-LUMEN LED FIXTURE ILLUMINATED</text>
      `;
    } else {
      sceneContent = `
        <!-- Unlit dark streetlight at night -->
        <line x1="400" y1="180" x2="400" y2="400" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
        <path d="M 400 190 Q 420 160 470 170" fill="none" stroke="#475569" stroke-width="6"/>
        <circle cx="470" cy="170" r="10" fill="#1E293B" stroke="#EF4444" stroke-width="2"/>
        <line x1="462" y1="162" x2="478" y2="178" stroke="#EF4444" stroke-width="2"/>
        <text x="400" y="430" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#F59E0B" text-anchor="middle">ZERO ILLUMINATION • BLACKOUT ROTARY</text>
      `;
    }
  } else if (category === 'Water leak') {
    if (isAfter) {
      sceneContent = `
        <!-- Repaired underground valve chamber -->
        <rect x="220" y="270" width="360" height="130" rx="14" fill="#121820" stroke="#22C55E" stroke-width="2"/>
        <line x1="260" y1="335" x2="540" y2="335" stroke="#38BDF8" stroke-width="8" stroke-linecap="round"/>
        <circle cx="400" cy="335" r="22" fill="#0284C7" stroke="#38BDF8" stroke-width="2"/>
        <circle cx="400" cy="335" r="34" fill="#22C55E" opacity="0.2"/>
        <path d="M 390 335 L 397 342 L 412 327" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round"/>
        <text x="400" y="430" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">SLEEVED PIPE JOINT • ZERO PRESSURE LEAK</text>
      `;
    } else {
      sceneContent = `
        <!-- High pressure burst water fountain and road pooling -->
        <ellipse cx="400" cy="360" rx="200" ry="45" fill="#075985" opacity="0.6"/>
        <ellipse cx="400" cy="360" rx="120" ry="25" fill="#38BDF8" opacity="0.8"/>
        <!-- Water plume -->
        <path d="M 400 360 Q 380 230 360 210 Q 400 180 440 210 Q 420 230 400 360" fill="#38BDF8" opacity="0.75"/>
        <circle cx="400" cy="360" r="10" fill="#BAE6FD"/>
        <text x="400" y="440" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">POTABLE SUPPLY LINE BLOWOUT • ROAD WASHOUT</text>
      `;
    }
  } else if (category === 'Garbage') {
    sceneContent = `
      <!-- Solid waste accumulation -->
      <path d="M 220 380 Q 280 270 360 300 Q 420 250 500 290 Q 560 310 590 380 Z" fill="#1C1917" stroke="#F59E0B" stroke-width="2"/>
      <rect x="290" y="320" width="50" height="35" rx="4" fill="#292524" stroke="#A8A29E"/>
      <rect x="420" y="310" width="60" height="40" rx="4" fill="#292524" stroke="#A8A29E"/>
      <circle cx="380" cy="340" r="16" fill="#44403C"/>
      <text x="400" y="435" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#F59E0B" text-anchor="middle">COMMERCIAL DUMP OVERFLOW • 500KG ESTIMATED</text>
    `;
  } else {
    // Other (Trench)
    sceneContent = `
      <!-- Open utility excavation trench -->
      <rect x="180" y="280" width="440" height="110" rx="8" fill="#000000" stroke="#EF4444" stroke-width="2.5"/>
      <line x1="200" y1="280" x2="600" y2="280" stroke="#F59E0B" stroke-width="4" stroke-dasharray="20 15"/>
      <line x1="200" y1="390" x2="600" y2="390" stroke="#F59E0B" stroke-width="4" stroke-dasharray="20 15"/>
      <text x="400" y="340" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#EF4444" text-anchor="middle">UNBARRICADED OPEN TRENCH</text>
      <text x="400" y="435" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="700" fill="#F59E0B" text-anchor="middle">UTILITY CONTRACTOR EXCAVATION • COLLAPSE RISK</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0E0E12"/>
        <stop offset="100%" stop-color="#16161B"/>
      </linearGradient>
      <linearGradient id="lightBeam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#FEF08A" stop-opacity="0.0"/>
      </linearGradient>
      <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" fill="rgba(230, 230, 225, 0.04)"/>
      </pattern>
    </defs>

    <!-- Canvas Base -->
    <rect width="800" height="500" fill="url(#bgGrad)"/>
    <rect width="800" height="500" fill="url(#dotGrid)"/>

    <!-- Distant Vizag Eastern Ghats / Ocean Skyline Horizon -->
    <path d="M 0 250 L 140 205 L 290 235 L 430 185 L 560 220 L 700 175 L 800 215 L 800 290 L 0 290 Z" fill="#0A0A0D" opacity="0.8"/>
    <line x1="0" y1="285" x2="800" y2="285" stroke="rgba(230,230,225,0.08)" stroke-width="1.5"/>

    <!-- Category Scene Content -->
    ${sceneContent}

    <!-- Top HUD Banner -->
    <rect x="25" y="24" width="750" height="66" rx="16" fill="#141417" stroke="rgba(230,230,225,0.18)"/>
    <circle cx="50" cy="57" r="7" fill="${statusColor}"/>
    <text x="68" y="50" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="800" letter-spacing="1.5" fill="#94949E">${statusText}</text>
    <text x="68" y="72" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#EDEDE8">${title}</text>

    <!-- Location Pill Tag -->
    <rect x="525" y="38" width="230" height="38" rx="10" fill="#1B1B20" stroke="rgba(230,230,225,0.12)"/>
    <text x="540" y="54" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="700" letter-spacing="0.5" fill="#94949E">VIZAG DISTRICT</text>
    <text x="540" y="69" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="600" fill="#EDEDE8">${areaName}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
