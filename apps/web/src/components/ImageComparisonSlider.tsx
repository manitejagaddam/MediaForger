import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SlidersHorizontal, Eye, Maximize2 } from 'lucide-react';

export interface ImageComparisonSliderProps {
  originalSrc: string;
  processedSrc: string;
  originalLabel?: string;
  processedLabel?: string;
  initialPosition?: number; // 0 to 100, default 50
  position?: number;
  onPositionChange?: (pos: number) => void;
  className?: string;
  heightClass?: string; // e.g. 'h-[440px]'
  onImageClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  isInteractiveToolActive?: boolean; // When eyedropper or pin is active
  cursorClass?: string;
  showPresets?: boolean;
  showBottomBar?: boolean;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalSrc,
  processedSrc,
  originalLabel = 'Original Input',
  processedLabel = 'Processed Output',
  initialPosition = 50,
  position: controlledPosition,
  onPositionChange,
  className = '',
  heightClass = 'h-[440px]',
  onImageClick,
  isInteractiveToolActive = false,
  cursorClass = '',
  showPresets = true,
  showBottomBar = true,
}) => {
  const [internalPos, setInternalPos] = useState<number>(initialPosition);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineHitRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const currentPos = controlledPosition !== undefined ? controlledPosition : internalPos;

  const updatePositionFromClientX = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0) return;
      const x = clientX - rect.left;
      const rawPct = (x / rect.width) * 100;
      const clampedPct = Math.max(0, Math.min(100, rawPct));
      const rounded = Math.round(clampedPct * 10) / 10;

      setInternalPos(rounded);
      onPositionChange?.(rounded);
    },
    [onPositionChange]
  );

  // Pointer Down on the container or line
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If an interactive tool (eyedropper/pin) is active and not clicking the handle/line directly,
    // let image click handle it
    if (isInteractiveToolActive) return;

    // Prevent default touch scrolling/gestures
    e.preventDefault();
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture fails
    }

    updatePositionFromClientX(e.clientX);
  };

  // Specific Pointer Down on the Line/Handle (always works, even with active eyedropper)
  const handleLinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    updatePositionFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    updatePositionFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  // Window-level safety cleanup for drag release outside window
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) setIsDragging(false);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging]);

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    let newPos = currentPos;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newPos = Math.max(0, currentPos - step);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newPos = Math.min(100, currentPos + step);
      e.preventDefault();
    } else if (e.key === 'Home') {
      newPos = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      newPos = 100;
      e.preventDefault();
    } else if (e.key === 'PageDown') {
      newPos = Math.max(0, currentPos - 20);
      e.preventDefault();
    } else if (e.key === 'PageUp') {
      newPos = Math.min(100, currentPos + 20);
      e.preventDefault();
    } else {
      return;
    }

    const rounded = Math.round(newPos * 10) / 10;
    setInternalPos(rounded);
    onPositionChange?.(rounded);
  };

  const setPreset = (pos: number) => {
    setInternalPos(pos);
    onPositionChange?.(pos);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#09090c] border border-zinc-800 select-none flex items-center justify-center touch-none group ${
          isInteractiveToolActive
            ? cursorClass || 'cursor-crosshair'
            : isDragging
            ? 'cursor-col-resize'
            : 'cursor-default'
        }`}
      >
        {/* Transparency checkerboard */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#71717a 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Processed (After) Image - Full width underneath */}
        <img
          src={processedSrc}
          alt="Processed Output"
          className="absolute max-h-full max-w-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Original (Before) Image - Clipped on the left */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            clipPath: `polygon(0 0, ${currentPos}% 0, ${currentPos}% 100%, 0 100%)`,
          }}
        >
          <img
            src={originalSrc}
            alt="Original Input"
            onClick={onImageClick}
            className={`max-h-full max-w-full object-contain ${
              isInteractiveToolActive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
            }`}
            draggable={false}
          />
        </div>

        {/* Interactive Draggable Split Divider Line & Handle */}
        <div
          ref={lineHitRef}
          onPointerDown={handleLinePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute top-0 bottom-0 z-30 cursor-col-resize touch-none"
          style={{
            left: `${currentPos}%`,
            width: '40px',
            transform: 'translateX(-50%)',
          }}
          title="Drag left or right to compare"
        >
          {/* Visible Divider Hairline (2px) */}
          <div
            className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] transition-colors ${
              isDragging
                ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]'
                : 'bg-white/80 group-hover:bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]'
            }`}
          />

          {/* Central Circular Drag Handle */}
          <div
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label="Image comparison split position"
            aria-valuenow={Math.round(currentPos)}
            aria-valuemin={0}
            aria-valuemax={100}
            onKeyDown={handleKeyDown}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-950 border-2 transition-all duration-150 flex items-center justify-center shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              isDragging
                ? 'border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,0.8)]'
                : 'border-white/90 hover:border-white hover:scale-110'
            }`}
          >
            <span className="text-[10px] font-bold text-white select-none pointer-events-none tracking-tight">
              ↔
            </span>
          </div>
        </div>

        {/* Labels Overlay */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur border border-zinc-850 text-[10px] font-mono text-zinc-300 pointer-events-none shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span>{originalLabel}</span>
        </div>
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur border border-zinc-850 text-[10px] font-mono text-zinc-300 pointer-events-none shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{processedLabel}</span>
        </div>

        {/* Floating Percentage Indicator during Drag */}
        {isDragging && (
          <div
            className="absolute bottom-4 z-20 -translate-x-1/2 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-white/20 text-white font-mono text-xs shadow-lg pointer-events-none animate-fadeIn"
            style={{ left: `${currentPos}%` }}
          >
            {Math.round(currentPos)}%
          </div>
        )}
      </div>

      {/* Accessible Presets & Scrub Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        {/* Quick Position Presets */}
        {showPresets && (
          <div className="flex items-center gap-1.5 bg-[#121216] border border-white/[0.06] rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setPreset(0)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentPos === 0 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Output
            </button>
            <button
              type="button"
              onClick={() => setPreset(25)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentPos === 25 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setPreset(50)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentPos === 50 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Split (50%)
            </button>
            <button
              type="button"
              onClick={() => setPreset(75)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentPos === 75 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setPreset(100)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentPos === 100 ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Original
            </button>
          </div>
        )}

        {/* Scrub Bar & Percentage Display */}
        {showBottomBar && (
          <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[200px]">
            <span className="text-[11px] font-mono text-zinc-500 shrink-0">Split:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={currentPos}
              onChange={(e) => {
                const val = Number(e.target.value);
                setInternalPos(val);
                onPositionChange?.(val);
              }}
              aria-label="Comparison split scrub range"
              className="w-full accent-white cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-[11px] font-mono text-zinc-300 w-9 text-right shrink-0">
              {Math.round(currentPos)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
