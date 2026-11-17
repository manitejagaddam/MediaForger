import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Upload,
  Sparkles,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { ImageEngine } from '@mediaforge/image-engine';
import { ExportManager } from '@mediaforge/core';
import { ImageProcessingOptions } from '@mediaforge/shared-types';

export const PopupApp: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const options: ImageProcessingOptions = {
        outputFormat: format,
        quality,
        stripMetadata: true,
      };

      const result = await ImageEngine.processImage(file, options);

      const filename = ExportManager.formatOutputFilename(file.name, format);
      ExportManager.download(result.blob, filename);
    } catch (err: any) {
      setErrorMessage(err.message || 'Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-[#09090b] text-zinc-100 font-sans border border-zinc-800 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0 border border-white/[0.14] bg-[#141418]">
            <img src="/logo.png?v=3" alt="MediaForge" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-zinc-100 tracking-tight">MediaForge Quick</h1>
            <p className="text-[10px] text-zinc-400">100% Local Conversion</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] text-zinc-300 font-medium">
          <Shield className="w-3 h-3 text-zinc-400" />
          Offline
        </span>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-750 text-[11px] text-zinc-200 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-zinc-400 hover:text-white px-1">✕</button>
        </div>
      )}

      {/* File Drop / Select */}
      <div className="space-y-3">
        {!file ? (
          <label className="border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-zinc-900/40 hover:bg-zinc-900/80">
            <Upload className="w-6 h-6 text-zinc-400 mb-2" />
            <span className="text-xs font-semibold text-zinc-100">Select image to convert</span>
            <span className="text-[10px] text-zinc-500 mt-0.5">JPEG, PNG, WebP, BMP</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
            />
          </label>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="truncate max-w-[200px]">
              <p className="font-semibold text-zinc-100 truncate">{file.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
              }}
              className="text-[11px] text-zinc-400 hover:text-white transition"
            >
              Remove
            </button>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">Target Format</span>
            <div className="flex items-center gap-1 font-mono">
              {['webp', 'png', 'jpeg', 'bmp'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition active:scale-95 ${
                    format === f
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {format !== 'png' && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Quality ({quality}%)</span>
              <input
                type="range"
                min="20"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-28 accent-white h-1 bg-zinc-800 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          disabled={!file || isProcessing}
          onClick={handleConvert}
          className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-semibold tracking-wide shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-900" />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span>Convert & Download</span>
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
        <span>Right-click any web image to convert</span>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
