import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Archive,
} from 'lucide-react';
import { ImageEngine } from '@mediaforge/image-engine';
import { ArchiveEngine, ArchiveFileEntry } from '@mediaforge/archive-engine';
import { ExportManager, FileInspector } from '@mediaforge/core';
import { db } from '@mediaforge/database';

interface BatchItem {
  id: string;
  file: File;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  outputBlob?: Blob;
  outputSize?: number;
  error?: string;
}

export const BatchStudioPage: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [outputFormat, setOutputFormat] = useState('webp');
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems: BatchItem[] = Array.from(e.target.files).map((f) => ({
        id: `batch_${Date.now()}_${Math.random()}`,
        file: f,
        status: 'idle',
      }));
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const executeBatch = async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'completed') continue;

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
      );

      try {
        const result = await ImageEngine.processImage(item.file, {
          outputFormat,
          quality,
          stripMetadata: true,
        });

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'completed',
                  outputBlob: result.blob,
                  outputSize: result.sizeBytes,
                }
              : it
          )
        );

        // Record to DB
        await db.history.put({
          id: `hist_${Date.now()}`,
          jobId: `job_${Date.now()}`,
          fileName: item.file.name,
          category: 'image',
          inputFormat: 'image',
          outputFormat,
          inputSizeBytes: item.file.size,
          outputSizeBytes: result.sizeBytes,
          durationMs: 80,
          completedAt: Date.now(),
        });
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'failed', error: err.message } : it
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleDownloadAllAsZip = async () => {
    const completed = items.filter((it) => it.status === 'completed' && it.outputBlob);
    if (completed.length === 0) return;

    const entries: ArchiveFileEntry[] = [];
    for (const it of completed) {
      const buffer = await it.outputBlob!.arrayBuffer();
      const filename = ExportManager.formatOutputFilename(it.file.name, outputFormat);
      entries.push({
        path: filename,
        data: new Uint8Array(buffer),
      });
    }

    const zipBlob = await ArchiveEngine.createZip(entries, 6);
    ExportManager.download(zipBlob, `mediaforge_batch_${outputFormat}.zip`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="glass-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 hover:text-white border border-zinc-700/80 text-xs font-semibold shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-4 h-4 text-zinc-300" />
            <span>Add Batch Images</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleAddFiles}
          />

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Target Format:</span>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono focus:border-zinc-500 outline-none transition"
            >
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="bmp">BMP</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Quality:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="accent-white w-24 h-1.5 bg-zinc-800 rounded cursor-pointer"
            />
            <span className="font-mono text-zinc-100 font-bold">{quality}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {items.some((it) => it.status === 'completed') && (
            <button
              onClick={handleDownloadAllAsZip}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-semibold tracking-wide shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Download ZIP Bundle</span>
            </button>
          )}

          <button
            disabled={isProcessing || items.length === 0}
            onClick={executeBatch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-semibold tracking-wide shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-900" />
                <span>Start Batch ({items.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Items Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h4 className="text-sm font-bold text-zinc-100">Batch Queue ({items.length} Files)</h4>
          {items.length > 0 && (
            <button
              onClick={() => setItems([])}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Clear Queue
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-16 text-center text-xs text-zinc-400 cursor-pointer transition"
          >
            No files in queue. Click "Add Batch Images" to batch convert multiple assets at once.
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-100 truncate max-w-sm">{it.file.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {(it.file.size / 1024).toFixed(1)} KB → {outputFormat.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {it.status === 'idle' && (
                    <span className="text-zinc-500 flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5" /> Queued
                    </span>
                  )}
                  {it.status === 'processing' && (
                    <span className="text-zinc-200 flex items-center gap-1 font-semibold text-[11px]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
                    </span>
                  )}
                  {it.status === 'completed' && it.outputSize && (
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-200 font-mono font-semibold">
                        {(it.outputSize / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={() => {
                          const filename = ExportManager.formatOutputFilename(it.file.name, outputFormat);
                          ExportManager.download(it.outputBlob!, filename);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/60 transition active:scale-95"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-zinc-500 hover:text-zinc-200 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

