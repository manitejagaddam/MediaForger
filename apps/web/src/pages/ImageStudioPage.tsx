import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Image as ImageIcon,
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  Tag,
  Eye,
} from 'lucide-react';
import { ImageEngine, ImageProcessResult } from '@mediaforge/image-engine';
import { FileInspector, ExportManager, ConversionPipeline } from '@mediaforge/core';
import { InspectionResult, ImageProcessingOptions } from '@mediaforge/shared-types';
import { BUILTIN_PRESETS } from '@mediaforge/presets';
import { ObjectUrlManager } from '@mediaforge/storage';
import { db } from '@mediaforge/database';

interface ImageStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
}

export const ImageStudioPage: React.FC<ImageStudioPageProps> = ({ initialFile, onClearFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const [outputResult, setOutputResult] = useState<ImageProcessResult | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedBase64, setCopiedBase64] = useState(false);

  // Studio Controls State
  const [outputFormat, setOutputFormat] = useState('webp');
  const [quality, setQuality] = useState(85);
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [watermarkText, setWatermarkText] = useState('');
  const [stripExif, setStripExif] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial file if provided from dashboard
  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    } else {
      setFile(null);
      setOutputResult(null);
    }
  }, [initialFile]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (inputUrl) ObjectUrlManager.revoke(inputUrl);
      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
    };
  }, []);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setOutputResult(null);
    if (outputUrl) {
      ObjectUrlManager.revoke(outputUrl);
      setOutputUrl(null);
    }

    const inspected = await FileInspector.inspect(selectedFile);
    setInspection(inspected);

    if (inspected.width) setWidth(inspected.width);
    if (inspected.height) setHeight(inspected.height);

    if (inputUrl) ObjectUrlManager.revoke(inputUrl);
    const url = ObjectUrlManager.create(selectedFile);
    setInputUrl(url);
  };

  const applyPreset = (presetId: string) => {
    const preset = BUILTIN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const opts = preset.options as ImageProcessingOptions;

    if (opts.outputFormat) setOutputFormat(opts.outputFormat);
    if (opts.quality !== undefined) setQuality(opts.quality);
    if (opts.width !== undefined) setWidth(opts.width);
    if (opts.height !== undefined) setHeight(opts.height);
    if (opts.maintainAspectRatio !== undefined) setMaintainAspect(opts.maintainAspectRatio);
    if (opts.stripMetadata !== undefined) setStripExif(opts.stripMetadata);
  };

  const handleDimensionChange = (newW: number | '', newH: number | '') => {
    if (!maintainAspect || !inspection?.width || !inspection?.height) {
      setWidth(newW);
      setHeight(newH);
      return;
    }

    const aspect = inspection.width / inspection.height;
    if (newW !== '' && newW !== width) {
      setWidth(newW);
      setHeight(Math.round(newW / aspect));
    } else if (newH !== '' && newH !== height) {
      setHeight(newH);
      setWidth(Math.round(newH * aspect));
    }
  };

  const executeConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0.1);

    const startTime = performance.now();

    try {
      const options: ImageProcessingOptions = {
        outputFormat,
        quality,
        width: typeof width === 'number' && width > 0 ? width : undefined,
        height: typeof height === 'number' && height > 0 ? height : undefined,
        maintainAspectRatio: maintainAspect,
        rotate: rotation,
        flipHorizontal: flipH,
        flipVertical: flipV,
        grayscale,
        brightness: brightness !== 0 ? brightness : undefined,
        contrast: contrast !== 0 ? contrast : undefined,
        stripMetadata: stripExif,
        watermark: watermarkText.trim() ? { text: watermarkText.trim() } : undefined,
      };

      setProgress(0.5);

      // Perform genuine image conversion
      const result = await ImageEngine.processImage(file, options);
      setProgress(0.9);

      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
      const newOutputUrl = ObjectUrlManager.create(result.blob);
      setOutputUrl(newOutputUrl);
      setOutputResult(result);

      // Persist to database history
      const durationMs = Math.round(performance.now() - startTime);
      await db.history.put({
        id: `hist_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: file.name,
        category: 'image',
        inputFormat: inspection?.detectedFormat || 'image',
        outputFormat: result.format,
        inputSizeBytes: file.size,
        outputSizeBytes: result.sizeBytes,
        durationMs,
        completedAt: Date.now(),
      });

      setProgress(1.0);
    } catch (err: any) {
      alert(`Image processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputResult || !file) return;
    const filename = ExportManager.formatOutputFilename(file.name, outputResult.format);
    ExportManager.download(outputResult.blob, filename);
  };

  const handleCopyBase64 = async () => {
    const targetBlob = outputResult?.blob || file;
    if (!targetBlob) return;

    const base64 = await ImageEngine.blobToBase64(targetBlob);
    await navigator.clipboard.writeText(base64);
    setCopiedBase64(true);
    setTimeout(() => setCopiedBase64(false), 2000);
  };

  const formats = [
    { id: 'webp', name: 'WebP (Modern & Compact)' },
    { id: 'jpeg', name: 'JPEG (Universal Photo)' },
    { id: 'png', name: 'PNG (Lossless & Alpha)' },
    { id: 'bmp', name: 'BMP (Uncompressed Bitmap)' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Upload Banner / File Selector */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-gray-900/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,.svg,.bmp,.tiff"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10 mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Select an Image to Forge</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
            Supports JPEG, PNG, WebP, AVIF, BMP, TIFF, SVG, and animated GIFs. Everything is processed directly in your browser.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Visual Preview & Live Comparison (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs uppercase">
                    {inspection?.detectedFormat || 'IMG'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-xs">{file.name}</h4>
                    <p className="text-[11px] text-gray-400">
                      {inspection?.width} × {inspection?.height} px • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyBase64}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition"
                    title="Copy Base64 Data URL"
                  >
                    {copiedBase64 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBase64 ? 'Copied' : 'Base64'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setOutputResult(null);
                      onClearFile?.();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Image Preview Canvas */}
              <div className="relative min-h-[360px] max-h-[500px] rounded-xl bg-[#080c14] border border-gray-800/80 flex items-center justify-center overflow-hidden p-4 group">
                <img
                  src={outputUrl || inputUrl || ''}
                  alt="Preview"
                  className="max-h-[460px] max-w-full object-contain rounded-lg shadow-2xl transition-all"
                  style={{
                    filter: `grayscale(${grayscale ? 1 : 0}) brightness(${100 + brightness}%) contrast(${100 + contrast}%)`,
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  }}
                />

                {outputUrl && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold tracking-wide uppercase shadow">
                    Processed Output
                  </div>
                )}
              </div>

              {/* Before/After Size Comparison Card */}
              {outputResult && (
                <div className="p-4 rounded-xl bg-gray-900/90 border border-emerald-500/40 flex items-center justify-between text-xs animate-fadeIn">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Conversion Result
                    </span>
                    <div className="flex items-center gap-3 text-white font-mono mt-1">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>→</span>
                      <span className="text-emerald-400 font-bold">
                        {(outputResult.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-sm">
                      {Math.max(
                        0,
                        Math.round(((file.size - outputResult.sizeBytes) / file.size) * 100)
                      )}
                      % Saved
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {outputResult.width} × {outputResult.height} px
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Forge Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              {/* Presets Row */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyPreset('img-web-balanced')}
                    className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] text-gray-300 font-medium transition"
                  >
                    Web Balanced
                  </button>
                  <button
                    onClick={() => applyPreset('img-max-compression')}
                    className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] text-gray-300 font-medium transition"
                  >
                    Max Compression
                  </button>
                  <button
                    onClick={() => applyPreset('img-social-ig-square')}
                    className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] text-gray-300 font-medium transition"
                  >
                    Instagram 1:1
                  </button>
                  <button
                    onClick={() => applyPreset('img-social-yt-thumb')}
                    className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] text-gray-300 font-medium transition"
                  >
                    YouTube 16:9
                  </button>
                </div>
              </div>

              {/* Target Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Target Output Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {formats.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setOutputFormat(fmt.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        outputFormat === fmt.id
                          ? 'border-blue-500 bg-blue-500/10 text-white font-semibold'
                          : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="text-xs uppercase font-mono font-bold">{fmt.id}</div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">{fmt.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compression Quality Slider */}
              {outputFormat !== 'png' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-gray-400">
                      Compression Quality
                    </span>
                    <span className="font-mono text-blue-400 font-bold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-blue-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Smallest File (10%)</span>
                    <span>Lossless Quality (100%)</span>
                  </div>
                </div>
              )}

              {/* Dimensions Resize */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-gray-400">
                    Resize Dimensions
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-400">
                    <input
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e) => setMaintainAspect(e.target.checked)}
                      className="rounded border-gray-700 text-blue-500 focus:ring-0"
                    />
                    <span>Lock Aspect Ratio</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      placeholder={inspection?.width?.toString() || 'Width'}
                      onChange={(e) =>
                        handleDimensionChange(
                          e.target.value ? Number(e.target.value) : '',
                          height
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      placeholder={inspection?.height?.toString() || 'Height'}
                      onChange={(e) =>
                        handleDimensionChange(
                          width,
                          e.target.value ? Number(e.target.value) : ''
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Transform & Filter Controls */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Transformations & Filters
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate ({rotation}°)</span>
                  </button>
                  <button
                    onClick={() => setFlipH((f) => !f)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      flipH
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-800 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>
                  <button
                    onClick={() => setFlipV((f) => !f)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                      flipV
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-800 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => setGrayscale(e.target.checked)}
                      className="rounded border-gray-700 text-blue-500"
                    />
                    <span>Grayscale</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stripExif}
                      onChange={(e) => setStripExif(e.target.checked)}
                      className="rounded border-gray-700 text-blue-500"
                    />
                    <span>Strip EXIF Privacy</span>
                  </label>
                </div>

                {/* Watermark Input */}
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Watermark Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. © 2026 MediaForge"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-600 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons: Convert & Download */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <button
                  disabled={isProcessing}
                  onClick={executeConversion}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing ({Math.round(progress * 100)}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Forge Image</span>
                    </>
                  )}
                </button>

                {outputResult && (
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {outputResult.format.toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

