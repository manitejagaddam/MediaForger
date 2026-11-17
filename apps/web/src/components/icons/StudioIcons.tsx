import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * MediaForge Master Brand Mark (AI-Generated High-Res Icon with Vector Fallback)
 */
export const MediaForgeLogo: React.FC<IconProps & { withText?: boolean; textClassName?: string }> = ({
  className = 'w-8 h-8',
  size = 32,
  withText = false,
  textClassName = 'text-sm font-bold text-white tracking-tight',
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {!imgError ? (
        <img
          src="/logo.png"
          alt="MediaForge Logo"
          width={size}
          height={size}
          onError={() => setImgError(true)}
          className={`${className} object-contain rounded-md shadow-sm border border-white/[0.08]`}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <defs>
            <linearGradient id="mf_logo_bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#222227" />
              <stop offset="100%" stopColor="#0c0c0f" />
            </linearGradient>
            <linearGradient id="mf_logo_rim" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#71717a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#27272a" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="mf_facet_left" x1="8" y1="9" x2="15" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#71717a" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
            <linearGradient id="mf_facet_right" x1="24" y1="9" x2="17" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>
            <linearGradient id="mf_facet_cap" x1="16" y1="5" x2="16" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f4f4f5" />
              <stop offset="100%" stopColor="#a1a1aa" />
            </linearGradient>
          </defs>

          {/* Outer Hex-Chamfered Emblem */}
          <rect x="1" y="1" width="30" height="30" rx="7" fill="url(#mf_logo_bg)" stroke="url(#mf_logo_rim)" strokeWidth="1.2" />

          {/* Forge Anvil & Media Monolith Pillars */}
          <path d="M8 22V11.5L12 9V20L8 22Z" fill="url(#mf_facet_left)" />
          <path d="M24 22V11.5L20 9V20L24 22Z" fill="url(#mf_facet_right)" />

          {/* Central Keystone Chevron */}
          <path d="M12 9L16 13.5L20 9L16 5.5L12 9Z" fill="url(#mf_facet_cap)" />

          {/* Forged Center Chisel / Spire */}
          <path d="M16 13.5L18.5 16.5L16 23.5L13.5 16.5L16 13.5Z" fill="#18181b" stroke="#52525b" strokeWidth="0.8" />
          <path d="M16 13.5L18.5 16.5L16 23.5V13.5Z" fill="#27272a" />

          {/* Radiant Diamond Core */}
          <polygon points="16,15.5 17.5,17 16,18.5 14.5,17" fill="#ffffff" />
          <circle cx="16" cy="17" r="2.5" fill="#ffffff" fillOpacity="0.35" />

          {/* Anvil Base Calibration Notch */}
          <line x1="9" y1="22" x2="23" y2="22" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1" strokeLinecap="round" />
          <line x1="12" y1="24" x2="20" y2="24" stroke="#71717a" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      )}

      {withText && (
        <span className={textClassName}>
          MediaForge
        </span>
      )}
    </div>
  );
};

/**
 * Image Studio Icon (Aperture Iris + Optical Focus Prisms)
 */
export const ForgeImageIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Frame Outer Corner Brackets (Precision Crop Guides) */}
    <path d="M3 7V4C3 3.44772 3.44772 3 4 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M17 3H20C20.5523 3 21 3.44772 21 4V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M21 17V20C21 20.5523 20.5523 21 20 21H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M7 21H4C3.44772 21 3 20.5523 3 20V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

    {/* Hexagonal Aperture Blades */}
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
    <path d="M12 4.5L18.5 8.25V15.75L12 19.5L5.5 15.75V8.25L12 4.5Z" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
    
    {/* Interlocking Iris Chords */}
    <line x1="12" y1="4.5" x2="15.5" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="18.5" y1="8.25" x2="13.5" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="18.5" y1="15.75" x2="10.5" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="12" y1="19.5" x2="8.5" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="5.5" y1="15.75" x2="10.5" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="5.5" y1="8.25" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.4" />

    {/* Central Optical Pupil & Specular Highlight */}
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <circle cx="13" cy="11" r="0.8" fill="#ffffff" />
  </svg>
);

/**
 * Audio Studio Icon (Acoustic Sonic Chamber + Dynamic Frequency Waves)
 */
export const ForgeAudioIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Sound Chamber Outer Baffle */}
    <rect x="2.5" y="3.5" width="19" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />

    {/* Logarithmic Multi-Band Audio Waveform Bars */}
    <line x1="5.5" y1="10" x2="5.5" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    <line x1="8" y1="7.5" x2="8" y2="16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    <line x1="10.5" y1="5" x2="10.5" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="13.5" y1="8" x2="13.5" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="16" y1="6" x2="16" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
    <line x1="18.5" y1="10.5" x2="18.5" y2="13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />

    {/* Decibel Meter Baseline & Peak Markers */}
    <circle cx="10.5" cy="4" r="1" fill="currentColor" />
    <circle cx="16" cy="5" r="1" fill="currentColor" />
  </svg>
);

/**
 * Video Studio Icon (Cinematic Shutter + Celluloid Frame Guides)
 */
export const ForgeVideoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cinematic 16:9 Viewport */}
    <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.4" opacity="0.8" />

    {/* Celluloid Film Sprocket Holes (Top & Bottom Track) */}
    <line x1="5" y1="5" x2="5" y2="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="9" y1="5" x2="9" y2="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="15" y1="5" x2="15" y2="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="19" y1="5" x2="19" y2="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />

    <line x1="5" y1="16.5" x2="5" y2="19" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="9" y1="16.5" x2="9" y2="19" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="15" y1="16.5" x2="15" y2="19" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <line x1="19" y1="16.5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />

    {/* Center Stereoscopic Play Aperture */}
    <path d="M10 9.5L16 12L10 14.5V9.5Z" fill="currentColor" />

    {/* Motion Shutter Indicator Rings */}
    <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 2" opacity="0.4" />
  </svg>
);

/**
 * Document Studio Icon (Isometric Structured Schema Matrix + Stream Converter)
 */
export const ForgeDocumentIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Document Body with Chamfered Folded Corner */}
    <path d="M4 4C4 3.44772 4.44772 3 5 3H14.5L20 8.5V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
    <path d="M14 3V9H20" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />

    {/* Schema JSON / CSV Matrix Rows */}
    <path d="M8 8H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    
    {/* Tabular Column Separators & Key-Value Blocks */}
    <rect x="7.5" y="11.5" width="3.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.4" />
    <rect x="12.5" y="11.5" width="4.5" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.7" />

    <rect x="7.5" y="15.5" width="4.5" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1" opacity="0.7" />
    <rect x="13.5" y="15.5" width="3.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.4" />
  </svg>
);

/**
 * Archive Studio Icon (Armored Compression Vault + Security Crate)
 */
export const ForgeArchiveIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Heavy-Duty Vault Crate Box */}
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
    
    {/* Structural Compression Ribs */}
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />

    {/* Vertical Reinforcement Band */}
    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />

    {/* Center Cryptographic Padlock Plate */}
    <rect x="9.5" y="10.5" width="5" height="4.5" rx="1" fill="currentColor" />
    <path d="M10.5 10.5V9C10.5 8.17157 11.1716 7.5 12 7.5C12.8284 7.5 13.5 8.17157 13.5 9V10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="12" cy="12.5" r="0.6" fill="#09090b" />
  </svg>
);

/**
 * AI Neural Studio Icon (Synaptic Tensor Lattice + Quantum Intelligence Core)
 */
export const ForgeAiIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Diamond Lattice Frame */}
    <path d="M12 2L21 12L12 22L3 12L12 2Z" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />

    {/* Synaptic Pathway Lines */}
    <line x1="12" y1="3" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <line x1="12" y1="14.5" x2="12" y2="21" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <line x1="3" y1="12" x2="9.5" y2="12" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    <line x1="14.5" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

    {/* Diagonal Inference Vectors */}
    <line x1="5.5" y1="5.5" x2="10" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
    <line x1="18.5" y1="5.5" x2="14" y2="10" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
    <line x1="5.5" y1="18.5" x2="10" y2="14" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
    <line x1="18.5" y1="18.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />

    {/* Radiant 4-Point Neural Core */}
    <polygon points="12,8.5 14.5,12 12,15.5 9.5,12" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
    
    {/* Peripheral Synaptic Nodes */}
    <circle cx="12" cy="3" r="1.2" fill="currentColor" />
    <circle cx="21" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="21" r="1.2" fill="currentColor" />
    <circle cx="3" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

/**
 * Batch Studio Icon (Cascading Multi-Threaded Process Wafers)
 */
export const ForgeBatchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Bottom Layer Wafer */}
    <path d="M4 14L12 18L20 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />

    {/* Middle Layer Wafer */}
    <path d="M4 10L12 14L20 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />

    {/* Top Active Processing Wafer */}
    <path d="M12 2L20 6L12 10L4 6L12 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Center Pipeline Core */}
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * History Studio Icon (Quantum Timeline Dial + Archival Tick Index)
 */
export const ForgeHistoryIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Circular Chronometer Track */}
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
    
    {/* Rewind Direction Arc with Indicator Head */}
    <path d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
    <path d="M3 8V3H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    {/* Precision Chronometer Hands (Time Pivot) */}
    <line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="15.5" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

/**
 * Privacy & Specs Shield Icon (Zero-Egress Armored Boundary)
 */
export const ForgeShieldIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer Isometric Armor Contour */}
    <path d="M12 2L4 5V11C4 16.5228 7.41176 21.6586 12 23C16.5882 21.6586 20 16.5228 20 11V5L12 2Z" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
    
    {/* Inner Concentric Isolation Ring */}
    <path d="M12 4.5L6 6.75V11C6 15.2 8.5 19.1 12 20.3C15.5 19.1 18 15.2 18 11V6.75L12 4.5Z" stroke="currentColor" strokeWidth="1" opacity="0.3" />

    {/* Local Processing Zero-Egress Lock Glyph */}
    <rect x="9.5" y="11" width="5" height="4" rx="1" fill="currentColor" />
    <path d="M10.5 11V9.5C10.5 8.67157 11.1716 8 12 8C12.8284 8 13.5 8.67157 13.5 9.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="12" cy="13" r="0.6" fill="#09090b" />
  </svg>
);

/**
 * Settings & Hardware Config Icon (Planetary Precision Gears)
 */
export const ForgeSettingsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Primary Calibration Gear */}
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 2V4M12 20V22M4 12H2M22 12H20M6.34 6.34L4.93 4.93M19.07 19.07L17.66 17.66M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
  </svg>
);

/**
 * High-Res AI-Generated Studio Squircle Icon
 * Uses the generated 2x3 studio icon asset sheet with precision CSS sprite mapping
 */
export const StudioTileIcon: React.FC<{
  studio: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'ai';
  className?: string;
}> = ({ studio, className = 'w-9 h-9' }) => {
  const positions: Record<string, string> = {
    image: '0% 0%',
    audio: '50% 0%',
    video: '100% 0%',
    document: '0% 100%',
    archive: '50% 100%',
    ai: '100% 100%',
  };

  return (
    <div
      className={`${className} rounded-xl overflow-hidden border border-white/[0.1] shadow-md bg-[#121217] shrink-0 transition-transform duration-200 group-hover:scale-105`}
      style={{
        backgroundImage: "url('/studio-icons.jpg')",
        backgroundSize: '300% 200%',
        backgroundPosition: positions[studio] || '0% 0%',
        backgroundRepeat: 'no-repeat',
      }}
      title={`${studio.toUpperCase()} Studio`}
    />
  );
};
