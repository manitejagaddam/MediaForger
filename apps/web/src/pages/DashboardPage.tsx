import React, { useState, useEffect } from 'react';
import {
  Upload,
  ArrowRight,
  FileCode,
  Zap,
  Package,
  Sparkles,
} from 'lucide-react';
import { PageId } from '../types';
import { FileInspector, CapabilityDetector, FormatRegistry } from '@mediaforge/core';
import { InspectionResult, SystemCapabilities } from '@mediaforge/shared-types';
import { db, ConversionHistoryItem } from '@mediaforge/database';
import {
  MediaForgeLogo,
  ForgeImageIcon,
  ForgeAudioIcon,
  ForgeVideoIcon,
  ForgeDocumentIcon,
  ForgeArchiveIcon,
  ForgeAiIcon,
  ForgeBatchIcon,
  ForgeHistoryIcon,
  ForgeShieldIcon,
} from '../components/icons/StudioIcons';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onSelectFile: (file: File, targetStudio: PageId) => void;
  onOpenDelivery?: () => void;
  onLoadDemo?: (type: 'portrait' | 'audio' | 'video' | 'csv') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectFile,
  onOpenDelivery,
  onLoadDemo,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [recentHistory, setRecentHistory] = useState<ConversionHistoryItem[]>([]);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);

  useEffect(() => {
    CapabilityDetector.detect().then(setCapabilities);
    db.history.orderBy('completedAt').reverse().limit(5).toArray().then(setRecentHistory);
  }, []);

  const handleFileDrop = async (file: File) => {
    const result = await FileInspector.inspect(file);
    let targetStudio: PageId = 'image';
    if (result.category === 'audio') targetStudio = 'audio';
    else if (result.category === 'video') targetStudio = 'video';
    else if (result.category === 'document') targetStudio = 'document';
    else if (result.category === 'archive') targetStudio = 'archive';
    else if (result.category === 'image') targetStudio = 'image';

    onSelectFile(file, targetStudio);
  };

  const studios = [
    {
      id: 'image' as PageId,
      name: 'Image Studio',
      icon: ForgeImageIcon,
      badge: 'Canvas 2D & WASM',
      desc: 'Transcode, compress, resize, crop, and strip metadata from JPEG, PNG, WebP, AVIF, BMP, SVG.',
      formats: ['JPG', 'PNG', 'WebP', 'AVIF', 'BMP', 'SVG'],
    },
    {
      id: 'audio' as PageId,
      name: 'Audio Studio',
      icon: ForgeAudioIcon,
      badge: 'Web Audio & LAME',
      desc: 'Convert formats, export MP3/WAV, trim, adjust sample rates, normalize volume, and inspect waveforms.',
      formats: ['WAV', 'MP3', 'FLAC', 'OGG', 'OPUS', 'AAC'],
    },
    {
      id: 'video' as PageId,
      name: 'Video Studio',
      icon: ForgeVideoIcon,
      badge: 'WebCodecs & Canvas',
      desc: 'Extract hardware video frames, inspect codec streams, scrub, step frames, and capture full-res snapshots.',
      formats: ['MP4', 'WebM', 'MKV', 'MOV', 'GIF'],
    },
    {
      id: 'document' as PageId,
      name: 'Document Studio',
      icon: ForgeDocumentIcon,
      badge: 'Client-Side Parser',
      desc: 'Convert CSV to JSON, JSON to CSV, normalize text files, and export formatted structures.',
      formats: ['CSV', 'JSON', 'TXT', 'PDF'],
    },
    {
      id: 'archive' as PageId,
      name: 'Archive Studio',
      icon: ForgeArchiveIcon,
      badge: 'Protected ZIP',
      desc: 'Create and extract ZIP archives with zip-slip path traversal and archive bomb protection.',
      formats: ['ZIP'],
    },
    {
      id: 'ai' as PageId,
      name: 'AI Neural Studio',
      icon: ForgeAiIcon,
      badge: 'ONNX WebGPU & WASM',
      desc: 'Run neural super-resolution upscaling (2x/4x) and IS-Net background removal with replacement studio.',
      formats: ['Real-ESRGAN', 'IS-Net', 'ONNX'],
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero Universal Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileDrop(e.dataTransfer.files[0]);
          }
        }}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragOver
            ? 'border-zinc-400 bg-zinc-800/40 shadow-xl'
            : 'border-[#27272a] bg-[#111114] hover:border-zinc-700 hover:bg-[#141418]'
        }`}
      >
        <div className="max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105">
            <MediaForgeLogo className="w-9 h-9" size={36} />
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Drop any media file here for instant local processing
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Images, audio, videos, documents, or archives. Processed 100% on your device with zero data upload.
            </p>
          </div>

          <label className="btn-primary">
            <FileCode className="w-4 h-4 text-zinc-950" />
            <span>Browse Files</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileDrop(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Live Demo Showcase & Client Delivery Dispatcher Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300">
            <Sparkles className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              Live Presentation & Demo Mode
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                1-Click Fixtures
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Instantly test and demonstrate local processing with pre-synthesized media fixtures.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {onLoadDemo && (
            <>
              <button
                onClick={() => onLoadDemo('portrait')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 font-medium transition active:scale-95"
              >
                Demo Portrait (AI/Matte)
              </button>
              <button
                onClick={() => onLoadDemo('audio')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 font-medium transition active:scale-95"
              >
                Demo Audio (LAME MP3)
              </button>
              <button
                onClick={() => onLoadDemo('video')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 font-medium transition active:scale-95"
              >
                Demo Video (60FPS)
              </button>
              <button
                onClick={() => onLoadDemo('csv')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 font-medium transition active:scale-95"
              >
                Demo Dataset (CSV)
              </button>
            </>
          )}

          {onOpenDelivery && (
            <button
              onClick={onOpenDelivery}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 font-bold shadow-sm hover:bg-zinc-100 transition active:scale-95 ml-1"
            >
              <Package className="w-3.5 h-3.5 text-zinc-950" />
              <span>Client Delivery Vault</span>
            </button>
          )}
        </div>
      </div>

      {/* Studios Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Specialized Processing Studios
          </h3>
          <span className="text-xs text-zinc-500 font-mono">6 Local Engines Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studios.map((studio) => {
            const Icon = studio.icon;
            return (
              <div
                key={studio.id}
                onClick={() => onNavigate(studio.id)}
                className="glass-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:border-zinc-500">
                      <Icon className="w-5 h-5 text-zinc-200" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {studio.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors">
                      {studio.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {studio.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#222227] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {studio.formats.slice(0, 4).map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                      >
                        {fmt}
                      </span>
                    ))}
                    {studio.formats.length > 4 && (
                      <span className="text-[10px] text-zinc-500">+{studio.formats.length - 4}</span>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1.5 transition-all duration-200" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Engine Telemetry & Recent History Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#222227] pb-3">
            <Zap className="w-4 h-4 text-zinc-300" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Hardware & Accelerators
            </h4>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">WebCodecs Pipeline</span>
              <span className={capabilities?.webCodecs ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}>
                {capabilities?.webCodecs ? 'Hardware Direct' : 'WASM'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">WebGPU Neural Engine</span>
              <span className={capabilities?.webGPU ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}>
                {capabilities?.webGPU ? 'Active' : 'WASM SIMD'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">Origin Private FS</span>
              <span className={capabilities?.opfs ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}>
                {capabilities?.opfs ? 'Direct I/O' : 'IndexedDB'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              <span className="text-zinc-400">Worker Concurrency</span>
              <span className="text-zinc-200 font-semibold">
                {capabilities?.hardwareConcurrency || 4} Threads
              </span>
            </div>
          </div>
        </div>

        {/* Recent History Card */}
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222227] pb-3">
            <div className="flex items-center gap-2">
              <ForgeHistoryIcon className="w-4 h-4 text-zinc-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Recent Conversions
              </h4>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Full History →
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              No conversions recorded yet. Choose any studio above to begin!
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-200 flex items-center justify-center font-mono text-[10px] font-bold uppercase">
                      {item.outputFormat}
                    </span>
                    <div>
                      <p className="font-semibold text-white truncate max-w-xs">{item.fileName}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()} • {item.durationMs}ms
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-200 font-mono font-semibold">
                      {(item.outputSizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      {Math.round(((item.inputSizeBytes - item.outputSizeBytes) / item.inputSizeBytes) * 100)}% saved
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
