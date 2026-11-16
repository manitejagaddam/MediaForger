import React from 'react';
import { PageId } from '../types';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activePage: PageId;
}

export const Header: React.FC<HeaderProps> = ({ activePage }) => {
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
      title: 'AI Studio (Local ONNX)',
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
    <header className="h-16 border-b border-gray-800 bg-[#0d121f]/90 backdrop-blur px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">{current.title}</h2>
        <p className="text-xs text-gray-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Private & Offline</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Web Workers Active</span>
        </div>
      </div>
    </header>
  );
};

