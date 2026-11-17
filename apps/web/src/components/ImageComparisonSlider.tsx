import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  SlidersHorizontal,
  Eye,
  Maximize2,
  Split,
  Contrast,
  Layers,
  Settings2,
  RotateCcw,
  Sparkles,
  X,
  Check,
  Columns,
  EyeOff,
} from 'lucide-react';

export type ComparisonViewMode = 'split' | 'diff' | 'fade' | 'side-by-side';

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
  defaultMode?: ComparisonViewMode;
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
  defaultMode = 'split',
}) => {
  const [internalPos, setInternalPos] = useState<number>(initialPosition);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragMoved, setDragMoved] = useState<boolean>(false);
  const [startPointerX, setStartPointerX] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ComparisonViewMode>(defaultMode);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isPeekingOriginal, setIsPeekingOriginal] = useState<boolean>(false);
  const [invertSplit, setInvertSplit] = useState<boolean>(false);
  const [diffGain, setDiffGain] = useState<number>(1); // 1x, 2x, 4x contrast boost
  const [diffInverted, setDiffInverted] = useState<boolean>(false);
  const [fadeOpacity, setFadeOpacity] = useState<number>(50); // 0 to 100%

  const containerRef = useRef<HTMLDivElement>(null);
  const lineHitRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentPos = controlledPosition !== undefined ? controlledPosition : internalPos;

  // Sync internal position if controlled
  useEffect(() => {
    if (controlledPosition !== undefined) {
      setInternalPos(controlledPosition);
    }
  }, [controlledPosition]);

  // Close floating menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        handleRef.current &&
        !handleRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

  // Pointer Down on the container
  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isInteractiveToolActive || viewMode !== 'split') return;

    // Check if clicked the menu
    if (menuRef.current?.contains(e.target as Node)) return;

    e.preventDefault();
    setIsDragging(true);
    setDragMoved(false);
    setStartPointerX(e.clientX);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    updatePositionFromClientX(e.clientX);
  };

  // Specific Pointer Down on the Dragger Line / Handle
  const handleLinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMoved(false);
    setStartPointerX(e.clientX);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    if (Math.abs(e.clientX - startPointerX) > 4) {
      setDragMoved(true);
    }

    if (viewMode === 'split') {
      updatePositionFromClientX(e.clientX);
    } else if (viewMode === 'fade') {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setFadeOpacity(Math.round(pct));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      // If the user clicked without dragging (distance < 5px), toggle the Dragger Options Menu!
      if (!dragMoved && viewMode === 'split') {
        setIsMenuOpen((prev) => !prev);
      }
    }
  };

  // Window-level safety cleanup
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      setIsMenuOpen((prev) => !prev);
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

  // Left vs Right source based on invertSplit
  const leftSource = invertSplit ? processedSrc : originalSrc;
  const rightSource = invertSplit ? originalSrc : processedSrc;
  const leftLabel = invertSplit ? processedLabel : originalLabel;
  const rightLabel = invertSplit ? originalLabel : processedLabel;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Mode Selector Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 bg-[#121216] border border-white/[0.08] rounded-lg p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('split');
              setIsMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'split'
                ? 'bg-[#181820] text-white shadow-sm border border-white/[0.08]'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Draggable Split Wipe Slider"
          >
            <Split className="w-3.5 h-3.5 text-zinc-300" />
            <span>Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('diff');
              setIsMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'diff'
                ? 'bg-purple-950/70 text-purple-200 shadow-sm border border-purple-800/60 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Difference Map: Shows exact pixel changes and edges"
          >
            <Contrast className="w-3.5 h-3.5 text-purple-400" />
            <span>Difference (Diff)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('fade');
              setIsMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'fade'
                ? 'bg-[#181820] text-white shadow-sm border border-white/[0.08]'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Opacity Cross-Fade Dissolve"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-300" />
            <span>Opacity Blend</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('side-by-side');
              setIsMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === 'side-by-side'
                ? 'bg-[#181820] text-white shadow-sm border border-white/[0.08]'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Side-by-Side 2-Up View"
          >
            <Columns className="w-3.5 h-3.5 text-zinc-300" />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* Quick Peek / Hold Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onMouseDown={() => setIsPeekingOriginal(true)}
            onMouseUp={() => setIsPeekingOriginal(false)}
            onMouseLeave={() => setIsPeekingOriginal(false)}
            onTouchStart={() => setIsPeekingOriginal(true)}
            onTouchEnd={() => setIsPeekingOriginal(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition select-none ${
              isPeekingOriginal
                ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 ring-2 ring-amber-500/40'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
            title="Hold to temporarily reveal original image"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Hold to Peek Original</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full ${heightClass} overflow-hidden rounded-xl bg-[#09090c] border border-zinc-800 select-none flex items-center justify-center touch-none group ${
          isInteractiveToolActive
            ? cursorClass || 'cursor-crosshair'
            : viewMode === 'split'
            ? isDragging
              ? 'cursor-col-resize'
              : 'cursor-default'
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

        {/* Peek Original Overlay (Triggered by Hold or Space) */}
        {isPeekingOriginal ? (
          <div className="absolute inset-0 flex items-center justify-center p-2 z-20 bg-[#09090c] animate-fadeIn">
            <img
              src={originalSrc}
              alt="Peeking Original"
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
            <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-md bg-amber-950/90 border border-amber-800/80 text-amber-200 text-xs font-semibold shadow-lg flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Peeking Original Image</span>
            </div>
          </div>
        ) : viewMode === 'split' ? (
          /* ========================================================
             MODE 1: DRAGGABLE SPLIT COMPARISON SLIDER
             ======================================================== */
          <>
            {/* Processed (After) Image - Full width underneath */}
            <img
              src={rightSource}
              alt="After Image"
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
                src={leftSource}
                alt="Before Image"
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
                width: '44px',
                transform: 'translateX(-50%)',
              }}
              title="Drag left/right to compare • Click handle for difference options"
            >
              {/* Visible Divider Hairline (2px) */}
              <div
                className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] transition-all duration-150 ${
                  isDragging
                    ? 'bg-white shadow-[0_0_14px_rgba(255,255,255,1)]'
                    : 'bg-white/85 group-hover:bg-white shadow-[0_0_8px_rgba(0,0,0,0.7)]'
                }`}
              />

              {/* Central Circular Drag Handle with Interactive Options Badge */}
              <div
                ref={handleRef}
                tabIndex={0}
                role="slider"
                aria-label="Image comparison split position. Click or press Enter for difference options"
                aria-valuenow={Math.round(currentPos)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={handleKeyDown}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-zinc-950 border-2 transition-all duration-200 flex items-center justify-center shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                  isMenuOpen
                    ? 'border-purple-400 ring-2 ring-purple-500/50 scale-110 shadow-[0_0_16px_rgba(168,85,247,0.6)]'
                    : isDragging
                    ? 'border-white scale-110 shadow-[0_0_16px_rgba(255,255,255,0.8)]'
                    : 'border-white/90 hover:border-white hover:scale-110'
                }`}
              >
                <span className="text-[11px] font-bold text-white select-none pointer-events-none tracking-tight">
                  ↔
                </span>

                {/* Pulsing micro-indicator informing the user it's clickable */}
                {!isMenuOpen && !isDragging && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 border border-zinc-950 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>

            {/* ========================================================
               FLOATING DRAGGER OPTIONS MENU (Anchored directly to handle)
               ======================================================== */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute z-50 p-4 rounded-2xl bg-[#101014]/95 backdrop-blur-xl border border-white/[0.14] shadow-2xl space-y-3 w-80 animate-fadeIn"
                style={{
                  left: `min(calc(100% - 170px), max(170px, ${currentPos}%))`,
                  top: '50%',
                  transform: 'translate(-50%, -125%)',
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      Comparison Options
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mode Selector Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    View Mode
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('split');
                        setIsMenuOpen(false);
                      }}
                      className="p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition bg-purple-950/70 border-purple-800/80 text-white"
                    >
                      <Split className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Split Slider</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('diff');
                        setIsMenuOpen(false);
                      }}
                      className="p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <Contrast className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Difference</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('fade');
                        setIsMenuOpen(false);
                      }}
                      className="p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Opacity Blend</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('side-by-side');
                        setIsMenuOpen(false);
                      }}
                      className="p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <Columns className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Side-by-Side</span>
                    </button>
                  </div>
                </div>

                {/* Quick Split Position Presets */}
                <div className="space-y-1.5 pt-1 border-t border-white/[0.08]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Snap Split Position
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setPreset(0);
                        setIsMenuOpen(false);
                      }}
                      className="py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-800 hover:text-white transition"
                    >
                      Output (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreset(50);
                        setIsMenuOpen(false);
                      }}
                      className="py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-800 hover:text-white font-semibold transition"
                    >
                      Snap 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreset(100);
                        setIsMenuOpen(false);
                      }}
                      className="py-1 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-800 hover:text-white transition"
                    >
                      Input (100%)
                    </button>
                  </div>
                </div>

                {/* Invert Sides Toggle */}
                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-zinc-300 text-[11px]">Swap Left / Right Sides</span>
                  <button
                    type="button"
                    onClick={() => setInvertSplit((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-md text-[11px] border font-medium transition ${
                      invertSplit
                        ? 'bg-purple-900/60 border-purple-700 text-purple-200'
                        : 'bg-zinc-850 border-zinc-750 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {invertSplit ? 'Inverted' : 'Standard'}
                  </button>
                </div>
              </div>
            )}

            {/* Labels Overlay */}
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur border border-zinc-850 text-[10px] font-mono text-zinc-300 pointer-events-none shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>{leftLabel}</span>
            </div>
            <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur border border-zinc-850 text-[10px] font-mono text-zinc-300 pointer-events-none shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{rightLabel}</span>
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
          </>
        ) : viewMode === 'diff' ? (
          /* ========================================================
             MODE 2: DIFFERENCE (DIFF) MAP VIEW
             ======================================================== */
          <div
            className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
              diffInverted ? 'bg-white' : 'bg-black'
            }`}
          >
            {/* Original Input as Base Layer */}
            <img
              src={originalSrc}
              alt="Original Diff Base"
              className="absolute max-h-full max-w-full object-contain pointer-events-none"
            />

            {/* Processed Layer with CSS mix-blend-mode: difference */}
            <img
              src={processedSrc}
              alt="Difference Blend Layer"
              className="absolute max-h-full max-w-full object-contain pointer-events-none"
              style={{
                mixBlendMode: 'difference',
                filter: `${diffGain > 1 ? `contrast(${diffGain * 100}%) brightness(${100 + (diffGain - 1) * 30}%)` : ''} ${
                  diffInverted ? 'invert(1)' : ''
                }`,
              }}
            />

            {/* Difference Mode Controls Overlay */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-zinc-950/90 border border-purple-800/70 text-purple-200 text-xs font-semibold shadow-lg flex items-center gap-2">
                <Contrast className="w-4 h-4 text-purple-400" />
                <span>Pixel Difference Mode</span>
              </div>
            </div>

            <div className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-lg p-1 text-xs">
              <span className="text-[10px] text-zinc-400 font-mono pl-1.5">Gain:</span>
              {[1, 2, 4].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDiffGain(g)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                    diffGain === g ? 'bg-purple-900 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {g}x
                </button>
              ))}

              <button
                type="button"
                onClick={() => setDiffInverted((prev) => !prev)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  diffInverted ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
                title="Invert difference colors"
              >
                Invert
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-medium transition ml-1"
              >
                Back to Split
              </button>
            </div>

            <div className="absolute bottom-3 left-4 right-4 z-20 text-center pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-zinc-950/85 border border-zinc-800 text-[11px] text-zinc-400">
                Black pixels = Identical • Illuminated pixels = Changed / Modified
              </span>
            </div>
          </div>
        ) : viewMode === 'fade' ? (
          /* ========================================================
             MODE 3: OPACITY CROSS-FADE DISSOLVE
             ======================================================== */
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Original Input underneath */}
            <img
              src={originalSrc}
              alt="Original Fade Base"
              className="absolute max-h-full max-w-full object-contain pointer-events-none"
            />

            {/* Processed Layer with variable opacity */}
            <img
              src={processedSrc}
              alt="Processed Fade Layer"
              className="absolute max-h-full max-w-full object-contain pointer-events-none transition-opacity duration-75"
              style={{ opacity: fadeOpacity / 100 }}
            />

            {/* Fade Status Badge */}
            <div className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-zinc-200 text-xs font-semibold shadow-lg flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Cross-Fade: {fadeOpacity}% Processed</span>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition"
            >
              Back to Split
            </button>

            {/* Bottom Floating Fade Scrubber */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-72 p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 backdrop-blur shadow-2xl flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-400 shrink-0">Original</span>
              <input
                type="range"
                min="0"
                max="100"
                value={fadeOpacity}
                onChange={(e) => setFadeOpacity(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              />
              <span className="text-[10px] font-mono text-zinc-400 shrink-0">Processed</span>
            </div>
          </div>
        ) : (
          /* ========================================================
             MODE 4: SIDE-BY-SIDE (2-UP) COMPARISON VIEW
             ======================================================== */
          <div className="relative w-full h-full p-4 flex items-center justify-center gap-4 overflow-hidden">
            {/* Left Box: Original */}
            <div className="relative flex-1 h-full rounded-xl bg-[#0e0e11] border border-zinc-850 p-2 flex flex-col items-center justify-center overflow-hidden">
              <img
                src={originalSrc}
                alt="Original Side"
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                {originalLabel}
              </div>
            </div>

            {/* Right Box: Processed */}
            <div className="relative flex-1 h-full rounded-xl bg-[#0e0e11] border border-zinc-850 p-2 flex flex-col items-center justify-center overflow-hidden">
              <img
                src={processedSrc}
                alt="Processed Side"
                className="max-h-full max-w-full object-contain pointer-events-none"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-emerald-400">
                {processedLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('split')}
              className="absolute top-3 right-6 z-30 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs transition"
            >
              Back to Split
            </button>
          </div>
        )}
      </div>

      {/* Accessible Presets & Scrub Bar (For Split Mode) */}
      {viewMode === 'split' && (
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
                Output (0%)
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
                  currentPos === 50 ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-white'
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
                Original (100%)
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
      )}
    </div>
  );
};
