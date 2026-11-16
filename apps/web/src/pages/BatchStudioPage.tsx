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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
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
            <span className="text-gray-400">Target Format:</span>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-white font-mono outline-none"
            >
              <option value="webp">WebP</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="bmp">BMP</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Quality:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="accent-blue-500 w-24 h-1.5 bg-gray-800 rounded"
            />
            <span className="font-mono text-blue-400">{quality}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {items.some((it) => it.status === 'completed') && (
            <button
              onClick={handleDownloadAllAsZip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Download ZIP Bundle</span>
            </button>
          )}

          <button
            disabled={isProcessing || items.length === 0}
            onClick={executeBatch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white text-xs font-bold uppercase tracking-wider shadow transition cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Batch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Batch ({items.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Items Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h4 className="text-sm font-bold text-white">Batch Queue ({items.length} Files)</h4>
          {items.length > 0 && (
            <button
              onClick={() => setItems([])}
              className="text-xs text-gray-400 hover:text-red-400 transition"
            >
              Clear Queue
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-800 rounded-xl p-16 text-center text-xs text-gray-400 cursor-pointer"
          >
            No files in queue. Click "Add Batch Images" to batch convert multiple assets at once.
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-auto">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-900 border border-gray-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-gray-800 text-gray-300 font-mono text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-white truncate max-w-sm">{it.file.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {(it.file.size / 1024).toFixed(1)} KB → {outputFormat.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {it.status === 'idle' && (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Queued
                    </span>
                  )}
                  {it.status === 'processing' && (
                    <span className="text-blue-400 flex items-center gap-1 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
                    </span>
                  )}
                  {it.status === 'completed' && it.outputSize && (
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {(it.outputSize / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={() => {
                          const filename = ExportManager.formatOutputFilename(it.file.name, outputFormat);
                          ExportManager.download(it.outputBlob!, filename);
                        }}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-gray-500 hover:text-red-400 p-1"
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

