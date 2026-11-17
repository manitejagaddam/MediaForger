import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * MediaForge Master Brand Mark (Bespoke Crystalline Anvil & Prism)
 */
export const MediaForgeLogo: React.FC<IconProps & { withText?: boolean; textClassName?: string }> = ({
  className = 'w-8 h-8',
  size = 32,
  withText = false,
  textClassName = 'text-sm font-bold text-white tracking-tight',
}) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="ext_mf_logo_bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#222227" />
            <stop offset="100%" stopColor="#0c0c0f" />
          </linearGradient>
          <linearGradient id="ext_mf_logo_rim" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#71717a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#27272a" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="ext_mf_facet_left" x1="8" y1="9" x2="15" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
          <linearGradient id="ext_mf_facet_right" x1="24" y1="9" x2="17" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
          <linearGradient id="ext_mf_facet_cap" x1="16" y1="5" x2="16" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>

        {/* Outer Hex-Chamfered Emblem */}
        <rect x="1" y="1" width="30" height="30" rx="7" fill="url(#ext_mf_logo_bg)" stroke="url(#ext_mf_logo_rim)" strokeWidth="1.2" />

        {/* Forge Anvil & Media Monolith Pillars */}
        <path d="M8 22V11.5L12 9V20L8 22Z" fill="url(#ext_mf_facet_left)" />
        <path d="M24 22V11.5L20 9V20L24 22Z" fill="url(#ext_mf_facet_right)" />

        {/* Central Keystone Chevron */}
        <path d="M12 9L16 13.5L20 9L16 5.5L12 9Z" fill="url(#ext_mf_facet_cap)" />

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

      {withText && (
        <span className={textClassName}>
          MediaForge
        </span>
      )}
    </div>
  );
};

export const ForgeImageIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 7V4C3 3.44772 3.44772 3 4 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M17 3H20C20.5523 3 21 3.44772 21 4V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M21 17V20C21 20.5523 20.5523 21 20 21H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M7 21H4C3.44772 21 3 20.5523 3 20V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
    <path d="M12 4.5L18.5 8.25V15.75L12 19.5L5.5 15.75V8.25L12 4.5Z" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <circle cx="13" cy="11" r="0.8" fill="#ffffff" />
  </svg>
);
