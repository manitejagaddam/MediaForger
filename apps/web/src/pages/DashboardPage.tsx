import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Package,
} from 'lucide-react';
import { PageId } from '../types';
import { FileInspector, CapabilityDetector } from '@mediaforge/core';
import { SystemCapabilities } from '@mediaforge/shared-types';
import { db, ConversionHistoryItem } from '@mediaforge/database';
import {
  MediaForgeLogo,
  ForgeImageIcon,
  ForgeAudioIcon,
  ForgeVideoIcon,
  ForgeDocumentIcon,
  ForgeArchiveIcon,
  ForgeAiIcon,
  ForgeHistoryIcon,
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
    db.history.orderBy('completedAt').reverse().limit(6).toArray().then(setRecentHistory);
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
      name: 'Images',
      icon: ForgeImageIcon,
      desc: 'Transcode, compress, crop, and resize with native and WASM decoders.',
      formats: ['WEBP', 'PNG', 'JPG', 'AVIF', 'BMP'],
    },
    {
      id: 'audio' as PageId,
      name: 'Audio',
      icon: ForgeAudioIcon,
      desc: 'Convert formats, export MP3/WAV, trim, and inspect interactive waveforms.',
      formats: ['MP3', 'WAV', 'OGG', 'AAC', 'FLAC'],
    },
    {
      id: 'video' as PageId,
      name: 'Video',
      icon: ForgeVideoIcon,
      desc: 'Extract full-res frames, inspect stream metadata, and transcode.',
      formats: ['MP4', 'WEBM', 'MKV', 'GIF'],
    },
    {
      id: 'document' as PageId,
      name: 'Documents',
      icon: ForgeDocumentIcon,
      desc: 'Parse and convert tabular CSV ↔ JSON and formatted structured data.',
      formats: ['CSV', 'JSON', 'TXT'],
    },
    {
      id: 'archive' as PageId,
      name: 'Archives',
      icon: ForgeArchiveIcon,
      desc: 'Create and extract ZIP packages with built-in path-traversal safety.',
      formats: ['ZIP'],
    },
    {
      id: 'ai' as PageId,
      name: 'AI Studio',
      icon: ForgeAiIcon,
      desc: 'Local neural background removal and 2x/4x super-resolution upscaling.',
      formats: ['IS-NET', 'ESRGAN', 'ONNX'],
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Workspace Drag & Drop Canvas */}
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
        className={`relative rounded-2xl border border-dashed transition-all duration-200 p-10 text-center ${
          dragOver
            ? 'border-zinc-300 bg-[#16161c]'
            : 'border-[#26262f] bg-[#0c0c10] hover:border-[#383844] hover:bg-[#0f0f14]'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3.5">
          <div className="w-10 h-10 mx-auto rounded-xl bg-[#141418] border border-white/[0.08] flex items-center justify-center">
            <MediaForgeLogo className="w-5 h-5 text-white" size={20} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Drop media anywhere to open in studio
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Photos, audio, video, datasets, or archives. Processed 100% locally.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-center gap-2">
            <label className="btn-primary">
              <span>Choose File</span>
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

          {/* Discreet Inline Sample Loaders */}
          {onLoadDemo && (
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <span className="text-zinc-500">Quick samples:</span>
              <button
                onClick={() => onLoadDemo('portrait')}
                className="px-2 py-0.5 rounded hover:bg-[#1a1a22] text-zinc-300 hover:text-white transition"
              >
                Portrait
              </button>
              <span className="text-zinc-600">·</span>
              <button
                onClick={() => onLoadDemo('audio')}
                className="px-2 py-0.5 rounded hover:bg-[#1a1a22] text-zinc-300 hover:text-white transition"
              >
                Audio
              </button>
              <span className="text-zinc-600">·</span>
              <button
                onClick={() => onLoadDemo('video')}
                className="px-2 py-0.5 rounded hover:bg-[#1a1a22] text-zinc-300 hover:text-white transition"
              >
                Video
              </button>
              <span className="text-zinc-600">·</span>
              <button
                onClick={() => onLoadDemo('csv')}
                className="px-2 py-0.5 rounded hover:bg-[#1a1a22] text-zinc-300 hover:text-white transition"
              >
                Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Studio Tool Tiles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium tracking-wider uppercase text-[11px] text-zinc-400">Studios</span>
          <span className="font-mono text-zinc-400 text-[11px]">6 engines active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {studios.map((studio) => {
            const Icon = studio.icon;
            return (
              <div
                key={studio.id}
                onClick={() => onNavigate(studio.id)}
                className="glass-card rounded-xl p-4 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[#16161c] border border-white/[0.08] flex items-center justify-center text-zinc-200 group-hover:border-white/[0.18] transition-colors">
                      <Icon className="w-4 h-4 text-zinc-200" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-white transition-colors">
                      {studio.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {studio.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center gap-1.5 flex-wrap">
                  {studio.formats.map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.05]"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity & System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Recent Activity */}
        <div className="glass-panel rounded-xl p-4 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <ForgeHistoryIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-200">Recent Activity</span>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View all →
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No recent files. Open any studio above to begin.
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#121217] border border-white/[0.05] text-xs hover:border-white/[0.1] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded bg-[#181820] text-zinc-300 flex items-center justify-center font-mono text-[9px] font-bold uppercase shrink-0">
                      {item.outputFormat}
                    </span>
                    <div className="truncate">
                      <p className="font-medium text-zinc-200 truncate max-w-xs">{item.fileName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()} • {item.durationMs}ms
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-zinc-300 font-mono text-[11px]">
                      {(item.outputSizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      {Math.round(((item.inputSizeBytes - item.outputSizeBytes) / item.inputSizeBytes) * 100)}% saved
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Engine Telemetry */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <span className="text-xs font-semibold text-zinc-200">System Engine</span>
            <span className="text-[10px] font-mono text-zinc-400">Active</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121217] border border-white/[0.04]">
              <span className="text-zinc-400">Worker Threads</span>
              <span className="text-zinc-200">{capabilities?.hardwareConcurrency || 4}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121217] border border-white/[0.04]">
              <span className="text-zinc-400">Video Pipeline</span>
              <span className="text-zinc-200">{capabilities?.webCodecs ? 'WebCodecs HW' : 'WASM'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121217] border border-white/[0.04]">
              <span className="text-zinc-400">Neural Acceleration</span>
              <span className="text-zinc-200">{capabilities?.webGPU ? 'WebGPU' : 'WASM SIMD'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#121217] border border-white/[0.04]">
              <span className="text-zinc-400">Storage FS</span>
              <span className="text-zinc-200">{capabilities?.opfs ? 'OPFS Direct' : 'IndexedDB'}</span>
            </div>
          </div>

          {onOpenDelivery && (
            <div className="pt-1">
              <button
                onClick={onOpenDelivery}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#16161c] hover:bg-[#1c1c24] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium transition active:scale-[0.98]"
              >
                <Package className="w-3.5 h-3.5 text-zinc-400" />
                <span>Package Delivery Vault</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
