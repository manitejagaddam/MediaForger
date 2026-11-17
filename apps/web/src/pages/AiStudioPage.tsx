import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Cpu,
  Download,
  Trash2,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Upload,
  ArrowRight,
  Copy,
  Check,
  FolderOpen,
  Pipette,
  Palette,
  Wand2,
  Image as ImageIcon,
  Sun,
  Layers,
  AlertCircle,
  X,
  Target,
  Maximize2,
  Eye,
  SlidersHorizontal,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';
import {
  AIEngine,
  REGISTERED_AI_MODELS,
  AIModelMeta,
  AIProcessResult,
  BackgroundReplacementMode,
} from '@mediaforge/ai-engine';
import { db, StoredModelCacheEntry } from '@mediaforge/database';
import { ObjectUrlManager } from '@mediaforge/storage';
import { FileInspector, ExportManager } from '@mediaforge/core';
import { InspectionResult } from '@mediaforge/shared-types';
import { ForgeAiIcon } from '../components/icons/StudioIcons';
import { ImageComparisonSlider } from '../components/ImageComparisonSlider';

interface AiStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
  onSendToImageStudio?: (file: File) => void;
}

type PointerTool = 'inspect' | 'pin-fg' | 'eyedropper-bg';
type ViewMode = 'split' | 'composite' | 'original' | 'matte';

export const AiStudioPage: React.FC<AiStudioPageProps> = ({
  initialFile,
  onClearFile,
  onSendToImageStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'models'>('workspace');
  const [provider, setProvider] = useState<'webgpu' | 'wasm'>('wasm');
  const [cachedModels, setCachedModels] = useState<StoredModelCacheEntry[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('rmbg-1.4');

  // Input file state
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<AIProcessResult | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [matteUrl, setMatteUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedBase64, setCopiedBase64] = useState(false);
  const [splitSliderPos, setSplitSliderPos] = useState(50); // 0 to 100%
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [pointerTool, setPointerTool] = useState<PointerTool>('inspect');

  // Upscale parameters
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [unsharpStrength, setUnsharpStrength] = useState<number>(60);
  const [denoise, setDenoise] = useState<boolean>(true);

  // Background Removal & Replacement Studio State
  const [bgMode, setBgMode] = useState<BackgroundReplacementMode>('transparent');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [bgGradientPreset, setBgGradientPreset] = useState<number>(0);
  const [bgGradientAngle, setBgGradientAngle] = useState<number>(135);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [bgBlurRadius, setBgBlurRadius] = useState<number>(25);

  // Minute Edge & Segmentation Tuning
  const [bgThreshold, setBgThreshold] = useState<number>(50); // 1 to 100
  const [bgFeather, setBgFeather] = useState<number>(3); // 0 to 20 px
  const [bgEdgeShift, setBgEdgeShift] = useState<number>(-2); // -10 to +10 px
  const [invertMask, setInvertMask] = useState<boolean>(false);
  const [defringe, setDefringe] = useState<boolean>(true);

  // Subject Targeting Points (Interactive Canvas Sampling)
  const [sampleFgPoint, setSampleFgPoint] = useState<[number, number] | null>(null); // [normalizedX, normalizedY]
  const [sampleFgColor, setSampleFgColor] = useState<[number, number, number] | null>(null);
  const [sampleBgPoint, setSampleBgPoint] = useState<[number, number] | null>(null);
  const [sampleKeyColor, setSampleKeyColor] = useState<[number, number, number] | null>(null);

  // Drop Shadow for Compositing
  const [enableShadow, setEnableShadow] = useState<boolean>(false);
  const [shadowOpacity, setShadowOpacity] = useState<number>(40);
  const [shadowBlur, setShadowBlur] = useState<number>(20);
  const [shadowOffsetY, setShadowOffsetY] = useState<number>(10);

  // Output export options
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [outputQuality, setOutputQuality] = useState<number>(92);

  // Clarity / Enhancement parameters
  const [clarity, setClarity] = useState<number>(50);
  const [vibrance, setVibrance] = useState<number>(40);
  const [hdrBoost, setHdrBoost] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  // Download / import refs
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [customModelTask, setCustomModelTask] = useState<
    'upscale' | 'background-removal' | 'enhancement' | 'custom'
  >('custom');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const customModelInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);

  // Studio Solid Swatches (Professional neutral lighting palette)
  const SOLID_SWATCHES = [
    { label: 'Clean White', color: '#ffffff' },
    { label: 'Studio Charcoal', color: '#18181b' },
    { label: 'Obsidian Black', color: '#09090b' },
    { label: 'Pure Black', color: '#000000' },
    { label: 'Neutral Gray', color: '#71717a' },
    { label: 'Deep Navy', color: '#0f172a' },
    { label: 'Slate Muted', color: '#334155' },
    { label: 'Silver Highkey', color: '#e4e4e7' },
    { label: 'Chroma Green', color: '#00ff00' },
    { label: 'Chroma Blue', color: '#0000ff' },
  ];

  // Monochromatic Studio Lighting Gradients
  const GRADIENT_PRESETS = [
    { name: 'Dark Vignette', colors: ['#18181b', '#09090b'] },
    { name: 'Studio Spotlight', colors: ['#27272a', '#141418'] },
    { name: 'Slate Ambient', colors: ['#1e293b', '#0f172a'] },
    { name: 'Monochrome Soft', colors: ['#3f3f46', '#18181b'] },
    { name: 'Studio Highkey', colors: ['#f4f4f5', '#d4d4d8'] },
    { name: 'Warm Amber', colors: ['#292524', '#0c0a09'] },
  ];

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
      if (matteUrl) ObjectUrlManager.revoke(matteUrl);
      setInputUrl(null);
      setOutputUrl(null);
      setMatteUrl(null);
    }
  }, [initialFile]);

  useEffect(() => {
    return () => {
      if (inputUrl) ObjectUrlManager.revoke(inputUrl);
      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
      if (matteUrl) ObjectUrlManager.revoke(matteUrl);
      if (bgImageUrl) ObjectUrlManager.revoke(bgImageUrl);
    };
  }, []);

  const loadCachedModels = async () => {
    const list = await db.modelCache.toArray();
    setCachedModels(list);
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setSampleKeyColor(null);
    setSampleFgColor(null);
    setSampleFgPoint(null);
    setSampleBgPoint(null);
    setPointerTool('inspect');
    setViewMode('split');

    if (outputUrl) {
      ObjectUrlManager.revoke(outputUrl);
      setOutputUrl(null);
    }
    if (matteUrl) {
      ObjectUrlManager.revoke(matteUrl);
      setMatteUrl(null);
    }

    const inspected = await FileInspector.inspect(selectedFile);
    setInspection(inspected);

    if (inputUrl) ObjectUrlManager.revoke(inputUrl);
    const url = ObjectUrlManager.create(selectedFile);
    setInputUrl(url);
  };

  const handleBgImageSelected = (selectedFile: File) => {
    setBgImageFile(selectedFile);
    if (bgImageUrl) ObjectUrlManager.revoke(bgImageUrl);
    const url = ObjectUrlManager.create(selectedFile);
    setBgImageUrl(url);
  };

  const handleDownloadModel = async (model: AIModelMeta) => {
    setDownloadingModelId(model.id);
    setError(null);
    try {
      await AIEngine.installModel(model);
      await loadCachedModels();
    } catch (err: any) {
      setError(`Model cache error: ${err.message}`);
    } finally {
      setDownloadingModelId(null);
    }
  };

  const handleImportCustomModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const customFile = e.target.files[0];
      setError(null);
      try {
        const entry = await AIEngine.importCustomModel(customFile, customModelTask);
        await loadCachedModels();
        setSelectedModelId(entry.modelId);
        setActiveTab('workspace');
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    await AIEngine.deleteModel(modelId);
    await loadCachedModels();
  };

  const handleSelectAndUseModel = (modelId: string) => {
    setSelectedModelId(modelId);
    // Find task
    const model =
      REGISTERED_AI_MODELS.find((m) => m.id === modelId) ||
      cachedModels.find((m) => m.modelId === modelId);
    if (model && 'task' in model) {
      if (model.task === 'upscale') {
        if (modelId.includes('x4')) setUpscaleFactor(4);
        else setUpscaleFactor(2);
      }
    }
    setActiveTab('workspace');
  };

  const activeModel =
    REGISTERED_AI_MODELS.find((m) => m.id === selectedModelId) ||
    cachedModels.find((m) => m.modelId === selectedModelId);

  const activeTask =
    activeModel && 'task' in activeModel && activeModel.task
      ? activeModel.task
      : selectedModelId.includes('rmbg') || selectedModelId.includes('bg')
      ? 'background-removal'
      : selectedModelId.includes('clarity') || selectedModelId.includes('enhance')
      ? 'enhancement'
      : 'upscale';

  const isSelectedModelCached = cachedModels.some((m) => m.modelId === selectedModelId);

  // Interactive Canvas Click Handler
  const handlePreviewClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (pointerTool === 'inspect' || !file || !previewImgRef.current) return;

    const img = previewImgRef.current;
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const naturalWidth = img.naturalWidth || inspection?.width || 100;
    const naturalHeight = img.naturalHeight || inspection?.height || 100;

    // Account for object-contain letterboxing
    const elemRatio = rect.width / rect.height;
    const naturalRatio = naturalWidth / naturalHeight;

    let contentW = rect.width;
    let contentH = rect.height;
    let contentLeft = 0;
    let contentTop = 0;

    if (elemRatio > naturalRatio) {
      // Letterbox on left and right
      contentW = rect.height * naturalRatio;
      contentLeft = (rect.width - contentW) / 2;
    } else {
      // Letterbox on top and bottom
      contentH = rect.width / naturalRatio;
      contentTop = (rect.height - contentH) / 2;
    }

    const relX = clickX - contentLeft;
    const relY = clickY - contentTop;

    if (relX < 0 || relX > contentW || relY < 0 || relY > contentH) {
      return; // Clicked on letterbox padding
    }

    const normX = Math.max(0, Math.min(1, relX / contentW));
    const normY = Math.max(0, Math.min(1, relY / contentH));

    const pixelX = Math.floor(normX * naturalWidth);
    const pixelY = Math.floor(normY * naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const pixel = ctx.getImageData(
      Math.max(0, Math.min(naturalWidth - 1, pixelX)),
      Math.max(0, Math.min(naturalHeight - 1, pixelY)),
      1,
      1
    ).data;

    const sampledRgb: [number, number, number] = [pixel[0], pixel[1], pixel[2]];

    if (pointerTool === 'pin-fg') {
      setSampleFgPoint([normX, normY]);
      setSampleFgColor(sampledRgb);
      setPointerTool('inspect');
    } else if (pointerTool === 'eyedropper-bg') {
      setSampleBgPoint([normX, normY]);
      setSampleKeyColor(sampledRgb);
      setPointerTool('inspect');
    }
  };

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
    setError(null);
    try {
      let res: AIProcessResult;

      if (activeTask === 'background-removal') {
        const gradientConfig = {
          colors: GRADIENT_PRESETS[bgGradientPreset]?.colors || ['#18181b', '#09090b'],
          angle: bgGradientAngle,
        };

        const shadowConfig = {
          enabled: enableShadow,
          opacity: shadowOpacity / 100,
          blur: shadowBlur,
          offsetY: shadowOffsetY,
          offsetX: 0,
        };

        res = await AIEngine.removeBackground(file, {
          modelId: selectedModelId,
          threshold: bgThreshold,
          featherRadius: bgFeather,
          edgeShift: bgEdgeShift,
          invertMask,
          defringe,
          sampleKeyColor,
          sampleFgColor,
          sampleFgPoint,
          sampleBgPoint,
          mode: bgMode,
          backgroundColor: bgColor,
          gradient: gradientConfig,
          backgroundImage: bgImageFile,
          blurRadius: bgBlurRadius,
          shadow: shadowConfig,
          outputFormat: bgMode === 'transparent' ? 'png' : outputFormat,
          outputQuality,
        });

        if (res.matteBlob) {
          if (matteUrl) ObjectUrlManager.revoke(matteUrl);
          setMatteUrl(ObjectUrlManager.create(res.matteBlob));
        }
      } else if (activeTask === 'enhancement') {
        res = await AIEngine.enhanceImage(file, {
          modelId: selectedModelId,
          clarity,
          vibrance,
          hdrBoost,
        });
      } else {
        res = await AIEngine.upscaleImage(file, {
          modelId: selectedModelId,
          scale: upscaleFactor,
          unsharpStrength: unsharpStrength / 100,
          denoise,
        });
      }

      setResult(res);
      if (outputUrl) ObjectUrlManager.revoke(outputUrl);
      const newUrl = ObjectUrlManager.create(res.blob);
      setOutputUrl(newUrl);

      const ext = bgMode === 'transparent' ? 'png' : outputFormat;
      const outputName = `${file.name.replace(/\.[^/.]+$/, '')}_ai_${res.modelUsed.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
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
      setError(`AI Execution error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!result || !file) return;
    const ext = bgMode === 'transparent' ? 'png' : outputFormat;
    const outputName = `${file.name.replace(/\.[^/.]+$/, '')}_ai_${result.modelUsed.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
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
      <div className="glass-panel rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#141418] border border-white/[0.08] text-zinc-200 flex items-center justify-center shrink-0">
            <ForgeAiIcon className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              AI Neural Studio
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {provider.toUpperCase()} SIMD
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Deep neural segmentation, sub-pixel matting, background replacement, and 2x/4x super-resolution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Model Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121216] border border-white/[0.08] text-xs">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 text-[11px]">Active:</span>
            <span className="text-zinc-200 font-medium text-[11px] truncate max-w-[150px]">
              {activeModel?.name || selectedModelId}
            </span>
            {isSelectedModelCached ? (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                CACHED
              </span>
            ) : (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                READY
              </span>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-[#121216] border border-white/[0.06] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3 py-1.5 rounded-md text-xs transition ${
                activeTab === 'workspace'
                  ? 'bg-[#181820] text-white font-medium border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1.5 rounded-md text-xs transition flex items-center gap-1.5 ${
                activeTab === 'models'
                  ? 'bg-[#181820] text-white font-medium border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3 h-3 text-zinc-400" />
              <span>Models ({cachedModels.length})</span>
            </button>
          </div>

          <label className="btn-secondary">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import ONNX</span>
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

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/50 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded hover:bg-red-900/40 text-red-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeTab === 'workspace' ? (
        /* Workspace Tab */
        <div className="space-y-6">
          {!file ? (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="glass-panel border border-dashed border-white/[0.12] hover:border-white/[0.25] hover:bg-[#0f0f14] rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 group"
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
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#141418] border border-white/[0.08] text-zinc-200 flex items-center justify-center mb-3">
                <ForgeAiIcon className="w-6 h-6 text-zinc-200" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Drop image to process with AI Neural Studio
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Subject cutout, portrait bokeh blur, studio lighting backdrops, and 2x/4x super-resolution
              </p>
              <div className="mt-4">
                <span className="btn-primary">Choose Image</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Interactive Visual Canvas (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel rounded-2xl p-5 space-y-4">
                  {/* Image Header & View Mode Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222227] pb-3 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-200 flex items-center justify-center font-mono font-bold text-xs uppercase">
                        {inspection?.detectedFormat || 'IMG'}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</h4>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {inspection?.width} × {inspection?.height} px • {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    {/* View Mode Buttons */}
                    <div className="flex items-center gap-1.5 bg-[#121216] border border-white/[0.06] rounded-lg p-0.5 text-xs">
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
                        onClick={() => setViewMode('composite')}
                        className={`px-2.5 py-1 rounded text-xs transition ${
                          viewMode === 'composite' ? 'bg-[#181820] text-white font-medium' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="View Final Composite Output"
                      >
                        Output
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-2.5 py-1 rounded text-xs transition ${
                          viewMode === 'original' ? 'bg-[#181820] text-white font-medium' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="View Original Input"
                      >
                        Original
                      </button>
                      {matteUrl && (
                        <button
                          onClick={() => setViewMode('matte')}
                          className={`px-2.5 py-1 rounded text-xs transition ${
                            viewMode === 'matte' ? 'bg-[#181820] text-white font-medium' : 'text-zinc-400 hover:text-white'
                          }`}
                          title="View High-Contrast Alpha Matte Mask"
                        >
                          Matte
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interactive Sampling Tools Bar (For Subject & Background Targeting) */}
                  {activeTask === 'background-removal' && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#101014] border border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 pl-1">
                          Canvas Tools:
                        </span>

                        <button
                          type="button"
                          onClick={() => setPointerTool(pointerTool === 'pin-fg' ? 'inspect' : 'pin-fg')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            pointerTool === 'pin-fg'
                              ? 'bg-purple-600 text-white font-semibold shadow-md'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/80'
                          }`}
                          title="Click on the subject (face/clothing) on the image to lock foreground"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>{pointerTool === 'pin-fg' ? 'Click Subject on Image' : 'Target Subject (Pin)'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPointerTool(pointerTool === 'eyedropper-bg' ? 'inspect' : 'eyedropper-bg')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            pointerTool === 'eyedropper-bg'
                              ? 'bg-white text-zinc-950 font-semibold shadow-md'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/80'
                          }`}
                          title="Click on the background to sample and eliminate that color"
                        >
                          <Pipette className="w-3.5 h-3.5" />
                          <span>{pointerTool === 'eyedropper-bg' ? 'Click Background on Image' : 'Eyedropper (BG)'}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setFile(null);
                          setResult(null);
                          onClearFile?.();
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-white transition"
                      >
                        Change Image
                      </button>
                    </div>
                  )}

                  {/* Active Tool Guidance Banner */}
                  {pointerTool !== 'inspect' && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        {pointerTool === 'pin-fg' ? (
                          <>
                            <Target className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span>Click anywhere on the primary person or object to lock foreground subject.</span>
                          </>
                        ) : (
                          <>
                            <Pipette className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span>Click anywhere on the background to sample target color to eliminate.</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => setPointerTool('inspect')}
                        className="text-[11px] font-semibold text-purple-300 hover:text-white underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Interactive Viewport Canvas */}
                  <div className="relative rounded-xl bg-[#09090b] border border-[#222227] overflow-hidden min-h-[380px] p-2 flex flex-col items-center justify-center select-none">
                    {/* Checkerboard background for transparency preview */}
                    <div
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(#71717a 1px, transparent 1px)`,
                        backgroundSize: '16px 16px',
                      }}
                    />

                    {/* Mode 1: Interactive Draggable Split-View Slider */}
                    {viewMode === 'split' && result && outputUrl && inputUrl ? (
                      <div className="w-full">
                        <ImageComparisonSlider
                          originalSrc={inputUrl}
                          processedSrc={outputUrl}
                          originalLabel="Original Input"
                          processedLabel={bgMode === 'transparent' ? 'Alpha Cutout' : `Replaced (${bgMode})`}
                          position={splitSliderPos}
                          onPositionChange={setSplitSliderPos}
                          heightClass="h-[440px]"
                          onImageClick={handlePreviewClick}
                          isInteractiveToolActive={pointerTool !== 'inspect'}
                          cursorClass={pointerTool !== 'inspect' ? 'cursor-crosshair' : undefined}
                          showPresets={true}
                          showBottomBar={true}
                        />
                      </div>
                    ) : viewMode === 'matte' && matteUrl ? (
                      /* Mode 2: Alpha Matte Mask View */
                      <div className="relative p-2 flex items-center justify-center max-h-[440px]">
                        <img
                          src={matteUrl}
                          alt="Alpha Matte Mask"
                          className="max-h-[400px] max-w-full object-contain rounded-lg"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-zinc-900/90 backdrop-blur text-[10px] font-mono text-zinc-300 border border-zinc-800">
                          Alpha Silhouette Mask
                        </div>
                      </div>
                    ) : viewMode === 'composite' && outputUrl ? (
                      /* Mode 3: Clean Composite Output Only */
                      <div className="relative p-2 flex items-center justify-center max-h-[440px]">
                        <img
                          src={outputUrl}
                          alt="AI Output Composite"
                          className="max-h-[400px] max-w-full object-contain rounded-lg"
                        />
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-zinc-900/90 backdrop-blur text-[10px] font-mono text-zinc-300 border border-zinc-800">
                          {result?.modelUsed}
                        </div>
                      </div>
                    ) : (
                      /* Mode 4: Original Input Preview with Interactive Click Sampling */
                      inputUrl && (
                        <div className="relative p-2 flex items-center justify-center max-h-[440px]">
                          <div className="relative inline-flex items-center justify-center max-h-[400px] max-w-full">
                            <img
                              ref={previewImgRef}
                              src={inputUrl}
                              alt="Input Preview"
                              onClick={handlePreviewClick}
                              className={`max-h-[400px] max-w-full object-contain rounded-lg ${
                                pointerTool !== 'inspect' ? 'cursor-crosshair ring-2 ring-purple-400' : ''
                              }`}
                            />

                            {/* Pinned Subject Marker */}
                            {sampleFgPoint && (
                              <div
                                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-purple-600 shadow-lg pointer-events-none flex items-center justify-center animate-bounce z-20"
                                style={{
                                  left: `${sampleFgPoint[0] * 100}%`,
                                  top: `${sampleFgPoint[1] * 100}%`,
                                }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            )}

                            {/* Eyedropper Sampled Background Marker */}
                            {sampleBgPoint && (
                              <div
                                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-lg pointer-events-none flex items-center justify-center z-20"
                                style={{
                                  left: `${sampleBgPoint[0] * 100}%`,
                                  top: `${sampleBgPoint[1] * 100}%`,
                                }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Sampling Badges & Reset Controls */}
                  {(sampleFgPoint || sampleKeyColor) && (
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4 flex-wrap">
                        {sampleFgPoint && (
                          <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-zinc-400">Target Subject:</span>
                            {sampleFgColor && (
                              <div
                                className="w-4 h-4 rounded border border-zinc-700"
                                style={{
                                  backgroundColor: `rgb(${sampleFgColor[0]}, ${sampleFgColor[1]}, ${sampleFgColor[2]})`,
                                }}
                              />
                            )}
                            <span className="text-zinc-200 font-mono text-[11px]">
                              ({Math.round(sampleFgPoint[0] * 100)}%, {Math.round(sampleFgPoint[1] * 100)}%)
                            </span>
                            <button
                              onClick={() => {
                                setSampleFgPoint(null);
                                setSampleFgColor(null);
                              }}
                              className="text-zinc-500 hover:text-red-400 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {sampleKeyColor && (
                          <div className="flex items-center gap-2">
                            <Pipette className="w-3.5 h-3.5 text-zinc-300" />
                            <span className="text-zinc-400">Sampled BG Key:</span>
                            <div
                              className="w-4 h-4 rounded border border-zinc-700"
                              style={{
                                backgroundColor: `rgb(${sampleKeyColor[0]}, ${sampleKeyColor[1]}, ${sampleKeyColor[2]})`,
                              }}
                            />
                            <span className="text-zinc-200 font-mono text-[11px]">
                              RGB({sampleKeyColor[0]}, {sampleKeyColor[1]}, {sampleKeyColor[2]})
                            </span>
                            <button
                              onClick={() => {
                                setSampleBgPoint(null);
                                setSampleKeyColor(null);
                              }}
                              className="text-zinc-500 hover:text-red-400 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSampleFgPoint(null);
                          setSampleFgColor(null);
                          setSampleBgPoint(null);
                          setSampleKeyColor(null);
                        }}
                        className="text-xs text-zinc-400 hover:text-white underline transition"
                      >
                        Reset All Samples
                      </button>
                    </div>
                  )}

                  {/* Result Stats Strip */}
                  {result && (
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">Dimensions:</span>
                        <span className="text-zinc-200 font-semibold">
                          {inspection?.width} × {inspection?.height}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-white font-bold">
                          {result.outputWidth} × {result.outputHeight} px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">Time:</span>
                        <span className="text-zinc-200 font-semibold">{result.durationMs}ms</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-emerald-400 font-medium">{result.modelUsed}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {result && (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button onClick={handleCopyBase64} className="btn-secondary">
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
                            className="btn-secondary"
                          >
                            Open in Image Studio
                          </button>
                        )}
                        <button onClick={handleDownloadResult} className="btn-primary">
                          <Download className="w-4 h-4 text-zinc-950" />
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
                  <div className="border-b border-[#222227] pb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-zinc-300" />
                      <span>Pipeline & Parameters</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/80 uppercase">
                      {activeTask}
                    </span>
                  </div>

                  {/* Model Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Neural Engine Model</span>
                      {isSelectedModelCached && (
                        <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Cached Locally
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => handleSelectAndUseModel(e.target.value)}
                      className="w-full bg-[#0e0e11] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
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

                    <p className="text-[11px] text-zinc-400 mt-1">
                      {activeModel && 'description' in activeModel ? activeModel.description : ''}
                    </p>
                  </div>

                  {/* Background Removal & Replacement Studio */}
                  {activeTask === 'background-removal' && (
                    <div className="space-y-5 pt-2 border-t border-[#222227]">
                      {/* Background Mode Selector */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-zinc-300" />
                          <span>Background Mode</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setBgMode('transparent')}
                            className={`py-2 px-1 rounded-xl text-xs transition ${
                              bgMode === 'transparent'
                                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                                : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Transparent
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgMode('color')}
                            className={`py-2 px-1 rounded-xl text-xs transition ${
                              bgMode === 'color'
                                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                                : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Solid Color
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgMode('gradient')}
                            className={`py-2 px-1 rounded-xl text-xs transition ${
                              bgMode === 'gradient'
                                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                                : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Studio Gradient
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => setBgMode('blur')}
                            className={`py-2 px-2 rounded-xl text-xs transition ${
                              bgMode === 'blur'
                                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                                : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Bokeh Blur (DSLR)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgMode('image')}
                            className={`py-2 px-2 rounded-xl text-xs transition ${
                              bgMode === 'image'
                                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                                : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Custom Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgMode('matte')}
                            className={`py-2 px-2 rounded-xl text-xs transition ${
                              bgMode === 'matte'
                                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                                : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Alpha Mask
                          </button>
                        </div>
                      </div>

                      {/* Mode-Specific Customization Options */}
                      {bgMode === 'color' && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-300">Choose Solid Backdrop</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <input
                                type="text"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-20 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-white font-mono text-[11px]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {SOLID_SWATCHES.map((swatch) => (
                              <button
                                key={swatch.color}
                                type="button"
                                onClick={() => setBgColor(swatch.color)}
                                className={`w-6 h-6 rounded-lg border transition ${
                                  bgColor.toLowerCase() === swatch.color.toLowerCase()
                                    ? 'ring-2 ring-white scale-110'
                                    : 'border-zinc-700 hover:scale-105'
                                }`}
                                style={{ backgroundColor: swatch.color }}
                                title={swatch.label}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {bgMode === 'gradient' && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-fadeIn">
                          <span className="text-[11px] font-semibold text-zinc-300">Studio Ambient Lighting</span>
                          <div className="grid grid-cols-3 gap-2">
                            {GRADIENT_PRESETS.map((preset, idx) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => setBgGradientPreset(idx)}
                                className={`h-10 rounded-xl border flex items-end p-1.5 transition ${
                                  bgGradientPreset === idx
                                    ? 'ring-2 ring-white border-white'
                                    : 'border-zinc-800 hover:border-zinc-700'
                                }`}
                                style={{
                                  background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                                }}
                              >
                                <span className="text-[9px] font-semibold text-white drop-shadow truncate">
                                  {preset.name}
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-400">Gradient Angle</span>
                              <span className="text-zinc-200 font-mono">{bgGradientAngle}°</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={bgGradientAngle}
                              onChange={(e) => setBgGradientAngle(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

                      {bgMode === 'blur' && (
                        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-fadeIn">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-300 font-semibold">Bokeh Blur Radius (DSLR Depth)</span>
                            <span className="text-zinc-200 font-mono">{bgBlurRadius} px</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="60"
                            value={bgBlurRadius}
                            onChange={(e) => setBgBlurRadius(Number(e.target.value))}
                            className="w-full"
                          />
                          <p className="text-[10px] text-zinc-400">
                            Smoothly softens the original background with realistic optical lens blur while maintaining crisp sub-pixel sharpness on the foreground subject.
                          </p>
                        </div>
                      )}

                      {bgMode === 'image' && (
                        <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-fadeIn">
                          <span className="text-[11px] font-semibold text-zinc-300">Replacement Background Image</span>
                          <input
                            ref={bgImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleBgImageSelected(e.target.files[0]);
                              }
                            }}
                          />
                          {bgImageUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-zinc-700 h-24 flex items-center justify-center">
                              <img src={bgImageUrl} alt="BG" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => bgImageInputRef.current?.click()}
                                className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-[10px] text-white hover:bg-black"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bgImageInputRef.current?.click()}
                              className="w-full py-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition"
                            >
                              <Upload className="w-4 h-4 text-zinc-400" />
                              <span>Select Background Image</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Drop Shadow Compositing */}
                      {bgMode !== 'transparent' && bgMode !== 'matte' && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-white">Subject Contact Drop Shadow</p>
                              <p className="text-[10px] text-zinc-400">Adds realistic grounding against new backdrop</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={enableShadow}
                              onChange={(e) => setEnableShadow(e.target.checked)}
                              className="w-4 h-4 rounded cursor-pointer accent-zinc-200"
                            />
                          </div>

                          {enableShadow && (
                            <div className="space-y-2 pt-2 border-t border-zinc-800">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400">Shadow Opacity</span>
                                <span className="text-zinc-200 font-mono">{shadowOpacity}%</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="90"
                                value={shadowOpacity}
                                onChange={(e) => setShadowOpacity(Number(e.target.value))}
                                className="w-full"
                              />

                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400">Shadow Blur</span>
                                <span className="text-zinc-200 font-mono">{shadowBlur} px</span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="40"
                                value={shadowBlur}
                                onChange={(e) => setShadowBlur(Number(e.target.value))}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Minute Edge & Boundary Controls */}
                      <div className="space-y-3 pt-2">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Edge & Matting Tuning</span>
                        </h5>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Detection Sensitivity (Tolerance)</span>
                            <span className="text-zinc-200 font-mono">{bgThreshold}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="95"
                            value={bgThreshold}
                            onChange={(e) => setBgThreshold(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Edge Shift (Choke / Expand)</span>
                            <span className="text-zinc-200 font-mono">
                              {bgEdgeShift > 0 ? `+${bgEdgeShift}` : bgEdgeShift} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-8"
                            max="8"
                            value={bgEdgeShift}
                            onChange={(e) => setBgEdgeShift(Number(e.target.value))}
                            className="w-full"
                          />
                          <p className="text-[10px] text-zinc-400">
                            Negative values choke mask inward to erase background halos from hair and edges.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Anti-Aliasing Feather Radius</span>
                            <span className="text-zinc-200 font-mono">{bgFeather} px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="15"
                            value={bgFeather}
                            onChange={(e) => setBgFeather(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs font-medium text-white">Color Defringing (Decontaminate)</p>
                            <p className="text-[10px] text-zinc-400">Removes background color spill on hair edges</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={defringe}
                            onChange={(e) => setDefringe(e.target.checked)}
                            className="w-4 h-4 rounded cursor-pointer accent-zinc-200"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs font-medium text-white">Invert Mask</p>
                            <p className="text-[10px] text-zinc-400">Swap subject and background</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={invertMask}
                            onChange={(e) => setInvertMask(e.target.checked)}
                            className="w-4 h-4 rounded cursor-pointer accent-zinc-200"
                          />
                        </div>
                      </div>

                      {/* Export Format Selector */}
                      {bgMode !== 'transparent' && bgMode !== 'matte' && (
                        <div className="space-y-2 pt-2 border-t border-[#222227]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400">Output Format</span>
                            <div className="flex items-center gap-1.5 font-mono">
                              {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => setOutputFormat(fmt)}
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition ${
                                    outputFormat === fmt
                                      ? 'bg-zinc-800 text-white border-zinc-600'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upscale Controls */}
                  {activeTask === 'upscale' && (
                    <div className="space-y-4 pt-2 border-t border-[#222227]">
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-zinc-300">
                          Super-Resolution Scale
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setUpscaleFactor(2);
                              setSelectedModelId('real-esrgan-x2');
                            }}
                            className={`py-2 rounded-xl text-xs font-semibold border transition ${
                              upscaleFactor === 2
                                ? 'bg-zinc-800 border-zinc-600 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
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
                            className={`py-2 rounded-xl text-xs font-semibold border transition ${
                              upscaleFactor === 4
                                ? 'bg-zinc-800 border-zinc-600 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            4x Ultra Scale
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Edge Sharpness</span>
                          <span className="text-zinc-200 font-mono">{unsharpStrength}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={unsharpStrength}
                          onChange={(e) => setUnsharpStrength(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs font-medium text-white">Bilateral Denoising</p>
                          <p className="text-[10px] text-zinc-400">
                            Smooth compression artifacts while preserving high-frequency edges
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={denoise}
                          onChange={(e) => setDenoise(e.target.checked)}
                          className="w-4 h-4 rounded cursor-pointer accent-zinc-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Enhancement Controls */}
                  {activeTask === 'enhancement' && (
                    <div className="space-y-4 pt-2 border-t border-[#222227]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Micro-Contrast Clarity</span>
                          <span className="text-zinc-200 font-mono">{clarity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={clarity}
                          onChange={(e) => setClarity(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">HDR Dynamic Range Boost</span>
                          <span className="text-zinc-200 font-mono">{hdrBoost}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={hdrBoost}
                          onChange={(e) => setHdrBoost(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Color Vibrance Restoration</span>
                          <span className="text-zinc-200 font-mono">{vibrance}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={vibrance}
                          onChange={(e) => setVibrance(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary Run Button */}
                  <div className="pt-4 border-t border-[#222227]">
                    <button
                      disabled={isProcessing}
                      onClick={handleExecuteAI}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                          <span>Computing Neural Inference...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-zinc-950" />
                          <span>
                            {activeTask === 'upscale'
                              ? `Upscale ${upscaleFactor}x (${(inspection?.width || 0) * upscaleFactor} × ${(inspection?.height || 0) * upscaleFactor}px)`
                              : activeTask === 'background-removal'
                              ? bgMode === 'transparent'
                                ? 'Extract Transparent Cutout'
                                : `Replace Background (${bgMode.toUpperCase()})`
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              On-Device Neural Model Inventory
            </h4>

            <div className="text-xs text-zinc-500 font-mono">
              Total Storage:{' '}
              {(
                cachedModels.reduce((acc, m) => acc + m.sizeBytes, 0) /
                (1024 * 1024)
              ).toFixed(1)}{' '}
              MB
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REGISTERED_AI_MODELS.map((model) => {
              const isCached = cachedModels.some((m) => m.modelId === model.id);
              const isDownloading = downloadingModelId === model.id;
              const isCurrentlyActive = selectedModelId === model.id;

              return (
                <div
                  key={model.id}
                  className={`glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 transition ${
                    isCurrentlyActive ? 'ring-2 ring-white/[0.2] bg-[#141418]' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-700/80 uppercase">
                          {model.task}
                        </span>
                        {isCurrentlyActive && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50">
                            ACTIVE IN STUDIO
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {(model.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {model.precision.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-white">{model.name}</h5>
                      <p className="text-xs text-zinc-400 mt-1">{model.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#222227] flex items-center justify-between">
                    {isCached ? (
                      <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Ready in Local Storage</span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">Available to Cache</div>
                    )}

                    <div className="flex items-center gap-2">
                      {isCached ? (
                        <>
                          <button
                            onClick={() => handleSelectAndUseModel(model.id)}
                            className={`btn-primary ${isCurrentlyActive ? 'ring-2 ring-white' : ''}`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                            <span>{isCurrentlyActive ? 'Active in Studio' : 'Use in Studio'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="btn-secondary hover:text-red-400 hover:border-red-800/40"
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
                          className="btn-primary"
                        >
                          {isDownloading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                              <span>Caching Model...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-zinc-950" />
                              <span>Download & Cache</span>
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
              .map((customModel) => {
                const isCurrentlyActive = selectedModelId === customModel.modelId;

                return (
                  <div
                    key={customModel.modelId}
                    className={`glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border-l-2 border-zinc-400 ${
                      isCurrentlyActive ? 'ring-2 ring-white/[0.2] bg-[#141418]' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-700/80 uppercase">
                            {customModel.task || 'custom'}
                          </span>
                          {isCurrentlyActive && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/50">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-zinc-500">
                          {(customModel.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-white">{customModel.name}</h5>
                        <p className="text-xs text-zinc-400 mt-1">
                          Locally imported ONNX neural model file.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#222227] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Ready in Local Storage</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectAndUseModel(customModel.modelId)}
                          className="btn-primary"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                          <span>Use in Studio</span>
                        </button>
                        <button
                          onClick={() => handleDeleteModel(customModel.modelId)}
                          className="btn-secondary hover:text-red-400 hover:border-red-800/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
