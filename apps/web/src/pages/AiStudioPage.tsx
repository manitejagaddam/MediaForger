import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Cpu,
  Download,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Sliders,
  Upload,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  Copy,
  Check,
  Zap,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';
import {
  AIEngine,
  REGISTERED_AI_MODELS,
  AIModelMeta,
  AIProcessResult,
} from '@mediaforge/ai-engine';
import { db, StoredModelCacheEntry } from '@mediaforge/database';
import { ObjectUrlManager } from '@mediaforge/storage';
import { FileInspector, ExportManager } from '@mediaforge/core';
import { InspectionResult } from '@mediaforge/shared-types';

interface AiStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
  onSendToImageStudio?: (file: File) => void;
}

export const AiStudioPage: React.FC<AiStudioPageProps> = ({
  initialFile,
  onClearFile,
  onSendToImageStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'models'>('workspace');
  const [provider, setProvider] = useState<'webgpu' | 'wasm'>('wasm');
  const [cachedModels, setCachedModels] = useState<StoredModelCacheEntry[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('real-esrgan-x2');

  // Input file state
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<AIProcessResult | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [splitSliderPos, setSplitSliderPos] = useState(50); // 0 to 100%

  // Model parameters
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [unsharpStrength, setUnsharpStrength] = useState<number>(60); // 0 to 100
  const [denoise, setDenoise] = useState<boolean>(true);

  const [bgThreshold, setBgThreshold] = useState<number>(45); // 0 to 100
  const [bgFeather, setBgFeather] = useState<number>(2); // 0 to 10
  const [invertMask, setInvertMask] = useState<boolean>(false);

  const [clarity, setClarity] = useState<number>(50); // 0 to 100
  const [vibrance, setVibrance] = useState<number>(40); // 0 to 100
  const [hdrBoost, setHdrBoost] = useState<number>(30); // 0 to 100

  // Download / import state
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customModelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AIEngine.resolveExecutionProvider().then(setProvider);
    loadCachedModels();
  }, []);

  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    } else {
      setFile(null);
      setResult(null);
      setInspection(null);
      if (inputUrl) ObjectUrlManager.revoke(inputUrl);
      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
      setInputUrl(null);
      setOutputUrl(null);
    }
  }, [initialFile]);

  useEffect(() => {
    return () => {
      if (inputUrl) ObjectUrlManager.revoke(inputUrl);
      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
    };
  }, []);

  const loadCachedModels = async () => {
    const list = await db.modelCache.toArray();
    setCachedModels(list);
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    if (outputUrl) {
      ObjectUrlManager.revoke(outputUrl);
      setOutputUrl(null);
    }

    const inspected = await FileInspector.inspect(selectedFile);
    setInspection(inspected);

    if (inputUrl) ObjectUrlManager.revoke(inputUrl);
    const url = ObjectUrlManager.create(selectedFile);
    setInputUrl(url);
  };

  const handleDownloadModel = async (model: AIModelMeta) => {
    setDownloadingModelId(model.id);
    try {
      await AIEngine.installModel(model);
      await loadCachedModels();
    } catch (err: any) {
      alert(`Model download error: ${err.message}`);
    } finally {
      setDownloadingModelId(null);
    }
  };

  const handleImportCustomModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const customFile = e.target.files[0];
      try {
        const entry = await AIEngine.importCustomModel(customFile);
        await loadCachedModels();
        setSelectedModelId(entry.modelId);
        setActiveTab('workspace');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    await AIEngine.deleteModel(modelId);
    await loadCachedModels();
  };

  const handleSelectAndUseModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setActiveTab('workspace');
  };

  // Determine active task based on selected model
  const activeModel =
    REGISTERED_AI_MODELS.find((m) => m.id === selectedModelId) ||
    cachedModels.find((m) => m.modelId === selectedModelId);
  const activeTask =
    activeModel && 'task' in activeModel && activeModel.task
      ? activeModel.task
      : selectedModelId.includes('rmbg')
      ? 'background-removal'
      : selectedModelId.includes('clarity') || selectedModelId.includes('enhance')
      ? 'enhancement'
      : 'upscale';

  const isSelectedModelCached = cachedModels.some((m) => m.modelId === selectedModelId);

  const handleExecuteAI = async () => {
    if (!file) return;

    // Ensure model is cached
    if (!isSelectedModelCached) {
      const modelMeta = REGISTERED_AI_MODELS.find((m) => m.id === selectedModelId);
      if (modelMeta) {
        await handleDownloadModel(modelMeta);
      }
    }

    setIsProcessing(true);
    try {
      let res: AIProcessResult;

      if (activeTask === 'background-removal') {
        res = await AIEngine.removeBackground(file, {
          threshold: bgThreshold,
          featherRadius: bgFeather,
          invertMask,
        });
      } else if (activeTask === 'enhancement') {
        res = await AIEngine.enhanceImage(file, {
          clarity,
          vibrance,
          hdrBoost,
        });
      } else {
        // Upscaling
        res = await AIEngine.upscaleImage(file, {
          scale: upscaleFactor,
          unsharpStrength: unsharpStrength / 100,
          denoise,
        });
      }

      setResult(res);
      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
      const newUrl = ObjectUrlManager.create(res.blob);
      setOutputUrl(newUrl);

      // Save to conversion history
      const ext = activeTask === 'background-removal' ? 'png' : 'png';
      const outputName = `${file.name.replace(/\.[^/.]+$/, '')}_ai_${res.modelUsed}.${ext}`;
      await db.history.put({
        id: `ai_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: outputName,
        category: 'image',
        inputFormat: inspection?.detectedFormat || 'image',
        outputFormat: ext,
        inputSizeBytes: file.size,
        outputSizeBytes: res.blob.size,
        durationMs: res.durationMs,
        completedAt: Date.now(),
      });
    } catch (err: any) {
      alert(`AI Execution error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!result || !file) return;
    const ext = activeTask === 'background-removal' ? 'png' : 'png';
    const outputName = `${file.name.replace(/\.[^/.]+$/, '')}_ai_${result.modelUsed}.${ext}`;
    ExportManager.download(result.blob, outputName);
  };

  const handleCopyBase64 = async () => {
    if (!result) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      navigator.clipboard.writeText(base64);
      setCopiedBase64(true);
      setTimeout(() => setCopiedBase64(false), 2000);
    };
    reader.readAsDataURL(result.blob);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header & Execution Provider Banner */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-600/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Neural Media Studio
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {provider.toUpperCase()} Acceleration
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Super-resolution upscaling, instant alpha background removal, and HDR clarity enhancement. 100% on-device local execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'workspace'
                  ? 'bg-fuchsia-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Inference Workspace
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'models'
                  ? 'bg-fuchsia-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Models ({cachedModels.length})</span>
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-medium cursor-pointer transition">
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Import .ONNX</span>
            <input
              ref={customModelInputRef}
              type="file"
              accept=".onnx"
              className="hidden"
              onChange={handleImportCustomModel}
            />
          </label>
        </div>
      </div>

      {activeTab === 'workspace' ? (
        /* Workspace Tab */
        <div className="space-y-6">
          {!file ? (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="glass-panel border-2 border-dashed border-gray-700 hover:border-fuchsia-500 rounded-3xl p-16 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />
              <div className="w-16 h-16 mx-auto rounded-2xl bg-fuchsia-600/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/10 mb-4 group-hover:scale-105 transition">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Select an Image for AI Processing
              </h3>
              <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
                Super-resolve 2x/4x, remove complex backgrounds with alpha matting, or apply neural clarity. Runs directly on your device.
              </p>
              <button className="mt-5 px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold shadow-lg shadow-fuchsia-600/25 transition">
                Browse Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Visual Canvas & Before/After Comparison (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-mono font-bold text-xs uppercase">
                        {inspection?.detectedFormat || 'IMG'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-xs">{file.name}</h4>
                        <p className="text-[11px] text-gray-400">
                          {inspection?.width} × {inspection?.height} px • {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFile(null);
                        setResult(null);
                        onClearFile?.();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition"
                    >
                      Change Image
                    </button>
                  </div>

                  {/* Interactive Split-Screen Comparison or Single View */}
                  <div className="relative rounded-xl bg-[#080c14] border border-gray-800/80 overflow-hidden min-h-[340px] flex items-center justify-center select-none">
                    {/* Checkerboard background for transparency preview */}
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `radial-gradient(#4b5563 1px, transparent 1px)`,
                        backgroundSize: '16px 16px',
                      }}
                    />

                    {result && outputUrl && inputUrl ? (
                      /* Before / After Interactive Split-View */
                      <div className="relative w-full h-[400px] overflow-hidden flex items-center justify-center">
                        {/* Processed (After) Image */}
                        <img
                          src={outputUrl}
                          alt="AI Output"
                          className="absolute max-h-full max-w-full object-contain"
                        />

                        {/* Original (Before) Image with clip-path */}
                        <div
                          className="absolute inset-0 flex items-center justify-center overflow-hidden"
                          style={{
                            clipPath: `polygon(0 0, ${splitSliderPos}% 0, ${splitSliderPos}% 100%, 0 100%)`,
                          }}
                        >
                          <img
                            src={inputUrl}
                            alt="Original Input"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Divider Line & Handle */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)] pointer-events-none"
                          style={{ left: `${splitSliderPos}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-fuchsia-600 border-2 border-white flex items-center justify-center shadow-lg text-[9px] font-bold text-white">
                            ↔
                          </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-gray-300 border border-gray-800">
                          Original
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-fuchsia-950/80 backdrop-blur text-[10px] font-mono text-fuchsia-300 border border-fuchsia-800/60">
                          AI Enhanced
                        </div>

                        {/* Scrub Range Slider */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={splitSliderPos}
                          onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                          className="absolute bottom-3 left-6 right-6 accent-fuchsia-500 opacity-70 hover:opacity-100 transition cursor-pointer"
                        />
                      </div>
                    ) : (
                      /* Single Input Preview */
                      inputUrl && (
                        <img
                          src={inputUrl}
                          alt="Input Preview"
                          className="max-h-[380px] max-w-full object-contain p-2"
                        />
                      )
                    )}
                  </div>

                  {/* Result Stats Strip */}
                  {result && (
                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">Dimensions:</span>
                        <span className="text-white font-bold">
                          {inspection?.width} × {inspection?.height}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-fuchsia-400 font-bold">
                          {result.outputWidth} × {result.outputHeight} px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-emerald-400 font-bold">{result.durationMs}ms</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-400 font-bold uppercase">{result.provider}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {result && (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        onClick={handleCopyBase64}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition"
                      >
                        {copiedBase64 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBase64 ? 'Copied' : 'Base64'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {onSendToImageStudio && (
                          <button
                            onClick={() => {
                              const f = new File([result.blob], `${file.name.replace(/\.[^/.]+$/, '')}_ai.png`, {
                                type: 'image/png',
                              });
                              onSendToImageStudio(f);
                            }}
                            className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition"
                          >
                            Open in Image Studio
                          </button>
                        )}
                        <button
                          onClick={handleDownloadResult}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Output</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Model Selection & Parameter Controls (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel rounded-2xl p-6 space-y-5">
                  <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-fuchsia-400" />
                      <span>Pipeline & Parameters</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 uppercase">
                      {activeTask}
                    </span>
                  </div>

                  {/* Model Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Neural Engine Model
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                    >
                      <optgroup label="Built-in Neural Models">
                        {REGISTERED_AI_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.task.toUpperCase()})
                          </option>
                        ))}
                      </optgroup>
                      {cachedModels.filter((m) => m.isCustom).length > 0 && (
                        <optgroup label="Custom Imported Models">
                          {cachedModels
                            .filter((m) => m.isCustom)
                            .map((m) => (
                              <option key={m.modelId} value={m.modelId}>
                                {m.name} (Custom ONNX)
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>

                    <p className="text-[11px] text-gray-400 mt-1">
                      {activeModel && 'description' in activeModel ? activeModel.description : ''}
                    </p>
                  </div>

                  {/* Task Specific Controls */}
                  {activeTask === 'upscale' && (
                    <div className="space-y-4 pt-2 border-t border-gray-800/80">
                      {/* Scale Factor */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-gray-300">
                          Super-Resolution Scale
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setUpscaleFactor(2);
                              setSelectedModelId('real-esrgan-x2');
                            }}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              upscaleFactor === 2
                                ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400'
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            2x Upscale
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUpscaleFactor(4);
                              setSelectedModelId('real-esrgan-x4');
                            }}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              upscaleFactor === 4
                                ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400'
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            4x Ultra Scale
                          </button>
                        </div>
                      </div>

                      {/* Detail Reconstruction Sharpness */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Edge Sharpness</span>
                          <span className="text-white font-mono">{unsharpStrength}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={unsharpStrength}
                          onChange={(e) => setUnsharpStrength(Number(e.target.value))}
                          className="w-full accent-fuchsia-500"
                        />
                      </div>

                      {/* Denoise Toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs font-medium text-white">Bilateral Denoising</p>
                          <p className="text-[10px] text-gray-400">
                            Smooth compression artifacts while preserving edges
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={denoise}
                          onChange={(e) => setDenoise(e.target.checked)}
                          className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {activeTask === 'background-removal' && (
                    <div className="space-y-4 pt-2 border-t border-gray-800/80">
                      {/* Color Distance Threshold */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Matting Sensitivity</span>
                          <span className="text-white font-mono">{bgThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={bgThreshold}
                          onChange={(e) => setBgThreshold(Number(e.target.value))}
                          className="w-full accent-fuchsia-500"
                        />
                      </div>

                      {/* Feather Radius */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Boundary Feathering</span>
                          <span className="text-white font-mono">{bgFeather} px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={bgFeather}
                          onChange={(e) => setBgFeather(Number(e.target.value))}
                          className="w-full accent-fuchsia-500"
                        />
                      </div>

                      {/* Invert Mask */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs font-medium text-white">Invert Mask</p>
                          <p className="text-[10px] text-gray-400">
                            Extract background instead of foreground
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={invertMask}
                          onChange={(e) => setInvertMask(e.target.checked)}
                          className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {activeTask === 'enhancement' && (
                    <div className="space-y-4 pt-2 border-t border-gray-800/80">
                      {/* Clarity */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Micro-Contrast Clarity</span>
                          <span className="text-white font-mono">{clarity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={clarity}
                          onChange={(e) => setClarity(Number(e.target.value))}
                          className="w-full accent-fuchsia-500"
                        />
                      </div>

                      {/* HDR Shadow Lift */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">HDR Shadow Recovery</span>
                          <span className="text-white font-mono">{hdrBoost}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={hdrBoost}
                          onChange={(e) => setHdrBoost(Number(e.target.value))}
                          className="w-full accent-fuchsia-500"
                        />
                      </div>

                      {/* Vibrance */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Color Vibrance</span>
                          <span className="text-white font-mono">{vibrance}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={vibrance}
                          onChange={(e) => setVibrance(Number(e.target.value))}
                          className="w-full accent-fuchsia-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary Run Button */}
                  <div className="pt-4 border-t border-gray-800">
                    <button
                      disabled={isProcessing}
                      onClick={handleExecuteAI}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Computing Neural Inference...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {activeTask === 'upscale'
                              ? `Upscale ${upscaleFactor}x (${(inspection?.width || 0) * upscaleFactor} × ${(inspection?.height || 0) * upscaleFactor}px)`
                              : activeTask === 'background-removal'
                              ? 'Remove Background (Alpha Matte)'
                              : 'Enhance Clarity & HDR'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Neural Models Manager Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              On-Device Neural Model Inventory
            </h4>

            <div className="text-xs text-gray-400">
              Total Storage:{' '}
              {(
                cachedModels.reduce((acc, m) => acc + m.sizeBytes, 0) /
                (1024 * 1024)
              ).toFixed(1)}{' '}
              MB
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {REGISTERED_AI_MODELS.map((model) => {
              const isCached = cachedModels.some((m) => m.modelId === model.id);
              const isDownloading = downloadingModelId === model.id;

              return (
                <div
                  key={model.id}
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                        {model.task}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {(model.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {model.precision.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-base font-bold text-white">{model.name}</h5>
                      <p className="text-xs text-gray-400 mt-1">{model.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    {isCached ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready in Local Storage</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Not Downloaded</div>
                    )}

                    <div className="flex items-center gap-2">
                      {isCached ? (
                        <>
                          <button
                            onClick={() => handleSelectAndUseModel(model.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold shadow transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Use in Studio</span>
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-xs text-gray-400 transition"
                            title="Purge model from local storage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Purge</span>
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={isDownloading}
                          onClick={() => handleDownloadModel(model)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                        >
                          {isDownloading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Installing...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Model</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Imported Models */}
            {cachedModels
              .filter((m) => m.isCustom)
              .map((customModel) => (
                <div
                  key={customModel.modelId}
                  className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border-l-4 border-indigo-500"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                        Custom ONNX
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {(customModel.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>

                    <div>
                      <h5 className="text-base font-bold text-white">{customModel.name}</h5>
                      <p className="text-xs text-gray-400 mt-1">
                        Locally imported user ONNX neural network file.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready in Local Storage</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectAndUseModel(customModel.modelId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Use in Studio</span>
                      </button>
                      <button
                        onClick={() => handleDeleteModel(customModel.modelId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-xs text-gray-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
