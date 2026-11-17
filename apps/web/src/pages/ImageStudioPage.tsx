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
import { ForgeImageIcon } from '../components/icons/StudioIcons';
import { ImageComparisonSlider } from '../components/ImageComparisonSlider';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'output' | 'original'>('split');
  const [splitPos, setSplitPos] = useState<number>(50);

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
      setErrorMessage(`Image processing error: ${err.message}`);
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
      {errorMessage && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between text-xs text-zinc-200 animate-fadeIn">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Banner / File Selector */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel border border-dashed border-white/[0.12] hover:border-white/[0.25] rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-[#0f0f14] group"
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
          <div className="w-10 h-10 mx-auto rounded-xl bg-[#141418] border border-white/[0.08] text-zinc-200 flex items-center justify-center mb-3">
            <ForgeImageIcon className="w-5 h-5 text-zinc-200" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Drop image to edit or transcode</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            JPEG, PNG, WebP, AVIF, and BMP format conversions with quality optimization
          </p>
          <div className="mt-4">
            <span className="btn-primary">Choose Image</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Visual Preview & Live Comparison (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-mono font-bold text-xs uppercase">
                    {inspection?.detectedFormat || 'IMG'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 truncate max-w-xs">{file.name}</h4>
                    <p className="text-[11px] text-zinc-400">
                      {inspection?.width} × {inspection?.height} px • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {outputUrl && (
                    <div className="flex items-center bg-[#121216] border border-white/[0.06] rounded-lg p-0.5 text-xs mr-1">
                      <button
                        onClick={() => setViewMode('split')}
                        className={`px-2.5 py-1 rounded text-xs transition ${
                          viewMode === 'split' ? 'bg-[#181820] text-white font-medium' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="Interactive Before / After Split Slider"
                      >
                        Split
                      </button>
                      <button
                        onClick={() => setViewMode('output')}
                        className={`px-2.5 py-1 rounded text-xs transition ${
                          viewMode === 'output' ? 'bg-[#181820] text-white font-medium' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="Processed Output Only"
                      >
                        Output
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-2.5 py-1 rounded text-xs transition ${
                          viewMode === 'original' ? 'bg-[#181820] text-white font-medium' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="Original Input Only"
                      >
                        Original
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleCopyBase64}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white border border-zinc-700/60 transition active:scale-[0.98]"
                    title="Copy Base64 Data URL"
                  >
                    {copiedBase64 ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBase64 ? 'Copied' : 'Base64'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setOutputResult(null);
                      onClearFile?.();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition active:scale-[0.98]"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Image Preview Canvas or Interactive Split Slider */}
              {outputUrl && inputUrl && viewMode === 'split' ? (
                <div className="glass-panel p-2 rounded-xl">
                  <ImageComparisonSlider
                    originalSrc={inputUrl}
                    processedSrc={outputUrl}
                    originalLabel="Original Input"
                    processedLabel={`Processed (${outputResult?.format?.toUpperCase() || outputFormat.toUpperCase()})`}
                    position={splitPos}
                    onPositionChange={setSplitPos}
                    heightClass="h-[440px]"
                    showPresets={true}
                    showBottomBar={true}
                  />
                </div>
              ) : (
                <div className="relative min-h-[360px] max-h-[500px] rounded-xl bg-[#09090c] border border-zinc-800/80 flex items-center justify-center overflow-hidden p-4 group">
                  <img
                    src={viewMode === 'original' ? inputUrl || '' : outputUrl || inputUrl || ''}
                    alt="Preview"
                    className="max-h-[460px] max-w-full object-contain rounded-lg transition-all"
                    style={{
                      filter: `grayscale(${grayscale ? 1 : 0}) brightness(${100 + brightness}%) contrast(${100 + contrast}%)`,
                      transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    }}
                  />

                  {outputUrl && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-zinc-800/95 border border-zinc-700 text-zinc-200 text-[11px] font-semibold tracking-wide uppercase shadow">
                      {viewMode === 'original' ? 'Original Input' : 'Processed Output'}
                    </div>
                  )}
                </div>
              )}

              {/* Before/After Size Comparison Card */}
              {outputResult && (
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-between text-xs animate-fadeIn">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Conversion Result
                    </span>
                    <div className="flex items-center gap-3 text-zinc-100 font-mono mt-1">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-white font-bold">
                        {(outputResult.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-100 font-mono font-bold text-sm">
                      {Math.max(
                        0,
                        Math.round(((file.size - outputResult.sizeBytes) / file.size) * 100)
                      )}
                      % Saved
                    </span>
                    <p className="text-[10px] text-zinc-400">
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
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyPreset('img-web-balanced')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white font-medium border border-zinc-750 transition active:scale-[0.98]"
                  >
                    Web Balanced
                  </button>
                  <button
                    onClick={() => applyPreset('img-max-compression')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white font-medium border border-zinc-750 transition active:scale-[0.98]"
                  >
                    Max Compression
                  </button>
                  <button
                    onClick={() => applyPreset('img-social-ig-square')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white font-medium border border-zinc-750 transition active:scale-[0.98]"
                  >
                    Instagram 1:1
                  </button>
                  <button
                    onClick={() => applyPreset('img-social-yt-thumb')}
                    className="px-2.5 py-1 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-white font-medium border border-zinc-750 transition active:scale-[0.98]"
                  >
                    YouTube 16:9
                  </button>
                </div>
              </div>

              {/* Target Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Target Output Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {formats.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setOutputFormat(fmt.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        outputFormat === fmt.id
                          ? 'border-zinc-300 bg-zinc-800/90 text-white font-semibold shadow-sm'
                          : 'border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs uppercase font-mono font-bold">{fmt.id}</div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">{fmt.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compression Quality Slider */}
              {outputFormat !== 'png' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-zinc-400">
                      Compression Quality
                    </span>
                    <span className="font-mono text-zinc-100 font-bold">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Smallest File (10%)</span>
                    <span>Lossless Quality (100%)</span>
                  </div>
                </div>
              )}

              {/* Dimensions Resize */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400">
                    Resize Dimensions
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-400 hover:text-zinc-200 transition">
                    <input
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e) => setMaintainAspect(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-zinc-200 focus:ring-0"
                    />
                    <span>Lock Aspect Ratio</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Width (px)</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-zinc-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Height (px)</label>
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
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-zinc-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Transform & Filter Controls */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Transformations & Filters
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex-1 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white border border-zinc-750 font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate ({rotation}°)</span>
                  </button>
                  <button
                    onClick={() => setFlipH((f) => !f)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
                      flipH
                        ? 'border-zinc-300 bg-zinc-800 text-white'
                        : 'border-zinc-750 bg-zinc-850 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip H</span>
                  </button>
                  <button
                    onClick={() => setFlipV((f) => !f)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] ${
                      flipV
                        ? 'border-zinc-300 bg-zinc-800 text-white'
                        : 'border-zinc-750 bg-zinc-850 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Flip V</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700 transition">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => setGrayscale(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-zinc-200"
                    />
                    <span>Grayscale</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700 transition">
                    <input
                      type="checkbox"
                      checked={stripExif}
                      onChange={(e) => setStripExif(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-zinc-200"
                    />
                    <span>Strip EXIF Privacy</span>
                  </label>
                </div>

                {/* Watermark Input */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Watermark Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. © 2026 MediaForge"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Action Buttons: Convert & Download */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <button
                  disabled={isProcessing}
                  onClick={executeConversion}
                  className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                      <span>Processing ({Math.round(progress * 100)}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-zinc-900" />
                      <span>Forge Image</span>
                    </>
                  )}
                </button>

                {outputResult && (
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
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

