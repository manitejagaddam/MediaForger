import React, { useState } from 'react';
import { PageId } from '../types';
import { CheckCircle2, Package, Sparkles, ChevronDown } from 'lucide-react';
import { ForgeShieldIcon } from './icons/StudioIcons';

interface HeaderProps {
  activePage: PageId;
  onOpenDelivery?: () => void;
  onLoadDemo?: (type: 'portrait' | 'audio' | 'video' | 'csv') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onOpenDelivery,
  onLoadDemo,
}) => {
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const titles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'MediaForge Workspace',
      subtitle: 'Universal client-side media conversion, compression, and editing hub',
    },
    image: {
      title: 'Image Studio',
      subtitle: 'Native Canvas 2D & WASM image transcoding, resize, crop, filters, and compression',
    },
    audio: {
      title: 'Audio Studio',
      subtitle: 'Client-side Web Audio transcoding, trimming, normalization, and waveform preview',
    },
    video: {
      title: 'Video Studio',
      subtitle: 'Video inspection, hardware thumbnail extraction, and WebCodecs transcoding',
    },
    document: {
      title: 'Document Studio',
      subtitle: 'In-browser CSV ↔ JSON parsing, text conversion, and document processing',
    },
    archive: {
      title: 'Archive Studio',
      subtitle: 'Secure ZIP compression & extraction with path traversal and bomb protection',
    },
    ai: {
      title: 'Neural AI Studio',
      subtitle: 'On-device neural super-resolution and alpha matte background removal',
    },
    batch: {
      title: 'Batch Processing Queue',
      subtitle: 'Multi-file parallel conversion with per-file status and ZIP bundling',
    },
    history: {
      title: 'Conversion History',
      subtitle: 'Persistent local conversion logs and size savings analytics stored in IndexedDB',
    },
    settings: {
      title: 'Settings & Cache',
      subtitle: 'Manage local storage quotas, worker concurrency limits, and offline cache',
    },
    about: {
      title: 'Privacy & System Architecture',
      subtitle: 'Zero-egress guarantees, technical specification, and format support matrix',
    },
  };

  const current = titles[activePage] || titles.dashboard;

  return (
    <header className="h-16 border-b border-[#1e1e24] bg-[#0c0c0f]/95 backdrop-blur px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight">{current.title}</h2>
        <p className="text-xs text-zinc-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Presentation Demo Dropdown */}
        {onLoadDemo && (
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold shadow-sm transition active:scale-[0.98]"
              title="Instantly load sample fixtures for live presentation demo"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>Demo Fixtures</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#111114] border border-[#27272a] shadow-2xl py-2 z-50 text-xs space-y-1">
                <button
                  onClick={() => {
                    onLoadDemo('portrait');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Sample Portrait</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Image / AI</span>
                </button>
                <button
                  onClick={() => {
                    onLoadDemo('audio');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Sample Soundtrack</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Audio WAV</span>
                </button>
                <button
                  onClick={() => {
                    onLoadDemo('video');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Sample 60FPS Video</span>
                  <span className="text-[10px] text-zinc-500 font-mono">WebM Video</span>
                </button>
                <button
                  onClick={() => {
                    onLoadDemo('csv');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Sample Inventory Dataset</span>
                  <span className="text-[10px] text-zinc-500 font-mono">CSV Data</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Client Delivery Packaging Trigger */}
        {onOpenDelivery && (
          <button
            onClick={onOpenDelivery}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-semibold shadow-sm transition active:scale-[0.98]"
            title="Package deliverables into a certified client delivery vault with cryptographic SHA-256 manifest"
          >
            <Package className="w-3.5 h-3.5 text-zinc-300" />
            <span>Client Delivery</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
          <ForgeShieldIcon className="w-3.5 h-3.5 text-zinc-300" />
          <span>Local & Offline</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Workers Ready</span>
        </div>
      </div>
    </header>
  );
};
