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

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);

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
      alert(`Conversion error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-[#0b0f19] text-gray-100 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow">
            MF
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-tight">MediaForge Quick</h1>
            <p className="text-[10px] text-gray-400">100% Local Conversion</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <Shield className="w-3 h-3 text-emerald-400" />
          Offline
        </span>
      </div>

      {/* File Drop / Select */}
      <div className="space-y-3">
        {!file ? (
          <label className="border border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-900/40 hover:bg-gray-900/80">
            <Upload className="w-6 h-6 text-blue-400 mb-2" />
            <span className="text-xs font-semibold text-white">Select image to convert</span>
            <span className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WebP, BMP</span>
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
          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs">
            <div className="truncate max-w-[200px]">
              <p className="font-semibold text-white truncate">{file.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
              }}
              className="text-[11px] text-gray-400 hover:text-white"
            >
              Remove
            </button>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-medium">Target Format</span>
            <div className="flex items-center gap-1 font-mono">
              {['webp', 'png', 'jpeg'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition ${
                    format === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {format !== 'png' && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 font-medium">Quality ({quality}%)</span>
              <input
                type="range"
                min="20"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-28 accent-blue-500 h-1 bg-gray-800 rounded"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          disabled={!file || isProcessing}
          onClick={handleConvert}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white text-xs font-bold uppercase tracking-wider shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Convert & Download</span>
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
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
