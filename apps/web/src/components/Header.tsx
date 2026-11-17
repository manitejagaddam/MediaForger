import React, { useState } from 'react';
import { PageId } from '../types';
import { Package, ChevronDown } from 'lucide-react';

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
  const titles: Record<PageId, { title: string; category?: string }> = {
    dashboard: { title: 'Overview', category: 'Hub' },
    image: { title: 'Images', category: 'Studio' },
    audio: { title: 'Audio', category: 'Studio' },
    video: { title: 'Video', category: 'Studio' },
    document: { title: 'Documents', category: 'Studio' },
    archive: { title: 'Archives', category: 'Studio' },
    ai: { title: 'AI Studio', category: 'Neural' },
    batch: { title: 'Batch Queue', category: 'Workflow' },
    history: { title: 'History', category: 'Analytics' },
    settings: { title: 'Settings', category: 'Config' },
    about: { title: 'System Specs', category: 'Architecture' },
  };

  const current = titles[activePage] || titles.dashboard;

  return (
    <header className="h-14 border-b border-[#1b1b22] bg-[#09090b]/90 backdrop-blur px-6 flex items-center justify-between shrink-0 select-none">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 font-medium">MediaForge</span>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-200 font-semibold">{current.title}</span>
        {current.category && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400 border border-zinc-700/40">
            {current.category}
          </span>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2">
        {/* Sample Fixtures Dropdown */}
        {onLoadDemo && (
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#27272e] text-zinc-300 hover:text-white text-xs font-medium transition active:scale-[0.98]"
              title="Load sample test file"
            >
              <span>Sample Data</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[#111116] border border-[#272730] shadow-2xl py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    onLoadDemo('portrait');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Portrait</span>
                  <span className="text-[10px] text-zinc-500 font-mono">PNG 800px</span>
                </button>
                <button
                  onClick={() => {
                    onLoadDemo('audio');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Audio Track</span>
                  <span className="text-[10px] text-zinc-500 font-mono">WAV 44kHz</span>
                </button>
                <button
                  onClick={() => {
                    onLoadDemo('video');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>Video Clip</span>
                  <span className="text-[10px] text-zinc-500 font-mono">WebM 60fps</span>
                </button>
                <button
                  onClick={() => {
                    onLoadDemo('csv');
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-200 flex items-center justify-between transition"
                >
                  <span>CSV Dataset</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Table</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Client Delivery Packaging Trigger */}
        {onOpenDelivery && (
          <button
            onClick={onOpenDelivery}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#27272e] text-zinc-300 hover:text-white text-xs font-medium transition active:scale-[0.98]"
            title="Create certified deliverable archive with cryptographic manifest"
          >
            <Package className="w-3.5 h-3.5 text-zinc-400" />
            <span>Package Vault</span>
          </button>
        )}

        {/* Minimal Engine Status */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#22222a] text-zinc-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-zinc-400">Local</span>
        </div>
      </div>
    </header>
  );
};
