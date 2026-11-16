import React, { useState, useEffect } from 'react';
import {
  Upload,
  ArrowRight,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Archive,
  Sparkles,
  Layers,
  History,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Zap,
} from 'lucide-react';
import { PageId } from '../types';
import { FileInspector, CapabilityDetector, FormatRegistry } from '@mediaforge/core';
import { InspectionResult, SystemCapabilities } from '@mediaforge/shared-types';
import { db, ConversionHistoryItem } from '@mediaforge/database';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onSelectFile: (file: File, targetStudio: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectFile,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [recentHistory, setRecentHistory] = useState<ConversionHistoryItem[]>([]);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);

  useEffect(() => {
    // Load capabilities
    CapabilityDetector.detect().then(setCapabilities);

    // Load recent conversions
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

    // Direct redirection: hand off file directly to target studio and navigate
    onSelectFile(file, targetStudio);
  };

  const studios = [
    {
      id: 'image' as PageId,
      name: 'Image Studio',
      icon: ImageIcon,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Native & WASM',
      desc: 'Transcode, compress, resize, crop, and strip metadata from JPEG, PNG, WebP, AVIF, BMP, SVG.',
      formats: ['JPG', 'PNG', 'WebP', 'AVIF', 'BMP', 'SVG'],
    },
    {
      id: 'audio' as PageId,
      name: 'Audio Studio',
      icon: Music,
      color: 'from-violet-500 to-purple-500',
      badge: 'Web Audio Engine',
      desc: 'Convert formats, trim start/end, adjust sample rates, normalize volume, and preview waveforms.',
      formats: ['WAV', 'MP3', 'FLAC', 'OGG', 'OPUS', 'AAC'],
    },
    {
      id: 'video' as PageId,
      name: 'Video Studio',
      icon: Video,
      color: 'from-amber-500 to-orange-500',
      badge: 'WebCodecs & Canvas',
      desc: 'Extract hardware video frames, inspect codec streams, transcode, and generate animated GIFs.',
      formats: ['MP4', 'WebM', 'MKV', 'MOV', 'GIF'],
    },
    {
      id: 'document' as PageId,
      name: 'Document Studio',
      icon: FileText,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Local Parser',
      desc: 'Convert CSV to JSON, JSON to CSV, normalize text files, and export formatted structures.',
      formats: ['CSV', 'JSON', 'TXT', 'PDF'],
    },
    {
      id: 'archive' as PageId,
      name: 'Archive Studio',
      icon: Archive,
      color: 'from-rose-500 to-pink-500',
      badge: 'Protected ZIP',
      desc: 'Create and extract ZIP archives with zip-slip path traversal and archive bomb protection.',
      formats: ['ZIP'],
    },
    {
      id: 'ai' as PageId,
      name: 'AI Studio',
      icon: Sparkles,
      color: 'from-fuchsia-500 to-indigo-500',
      badge: 'Local ONNX',
      desc: 'Run neural super-resolution upscaling and neural background removal right on your GPU.',
      formats: ['Real-ESRGAN', 'RMBG-1.4'],
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
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10 shadow-xl shadow-blue-500/10'
            : 'border-gray-800 bg-[#111827]/70 hover:border-gray-700'
        }`}
      >
        <div className="max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Drop any media file here for instant local inspection
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Images, audio, videos, documents, or archives. Files are processed 100% on your device with zero data upload.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-blue-600/25 transition-all">
            <FileCode className="w-4 h-4" />
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

      {/* Studios Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Specialized Processing Studios
          </h3>
          <span className="text-xs text-gray-400">6 Local Engines Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {studios.map((studio) => {
            const Icon = studio.icon;
            return (
              <div
                key={studio.id}
                onClick={() => onNavigate(studio.id)}
                className="glass-card rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${studio.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                      {studio.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {studio.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {studio.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {studio.formats.slice(0, 4).map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800"
                      >
                        {fmt}
                      </span>
                    ))}
                    {studio.formats.length > 4 && (
                      <span className="text-[10px] text-gray-400">+{studio.formats.length - 4}</span>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
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
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Device Engine Capabilities
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-gray-400">WebCodecs Hardware Accel</span>
              <span className={capabilities?.webCodecs ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {capabilities?.webCodecs ? 'Supported' : 'WASM Fallback'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-gray-400">WebGPU (Neural Acceleration)</span>
              <span className={capabilities?.webGPU ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                {capabilities?.webGPU ? 'Available' : 'CPU WASM Fallback'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-gray-400">Origin Private FS (OPFS)</span>
              <span className={capabilities?.opfs ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                {capabilities?.opfs ? 'Active (Direct I/O)' : 'Memory Buffers'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/60 border border-gray-800">
              <span className="text-gray-400">Logical CPU Cores</span>
              <span className="text-blue-400 font-mono font-semibold">
                {capabilities?.hardwareConcurrency || 4} Threads
              </span>
            </div>
          </div>
        </div>

        {/* Recent History Card */}
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Recent Conversions
              </h4>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              View Full History →
            </button>
          </div>

          {recentHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-800 rounded-xl">
              No conversions recorded yet. Try converting an image or document above!
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-[10px] font-bold uppercase">
                      {item.outputFormat}
                    </span>
                    <div>
                      <p className="font-semibold text-white truncate max-w-xs">{item.fileName}</p>
                      <p className="text-[11px] text-gray-400">
                        {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()} in {item.durationMs}ms
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-semibold">
                      {(item.outputSizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <p className="text-[10px] text-gray-400">
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

