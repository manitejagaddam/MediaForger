import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AIEngine, REGISTERED_AI_MODELS, AIModelMeta } from '@mediaforge/ai-engine';
import { db, StoredModelCacheEntry } from '@mediaforge/database';

export const AiStudioPage: React.FC = () => {
  const [provider, setProvider] = useState<'webgpu' | 'wasm'>('wasm');
  const [cachedModels, setCachedModels] = useState<StoredModelCacheEntry[]>([]);
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    AIEngine.resolveExecutionProvider().then(setProvider);
    loadCachedModels();
  }, []);

  const loadCachedModels = async () => {
    const list = await db.modelCache.toArray();
    setCachedModels(list);
  };

  const handleSimulateModelDownload = async (model: AIModelMeta) => {
    setDownloadingModelId(model.id);
    setDownloadProgress(0.1);

    // Simulate progress while caching metadata locally into IndexedDB
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 0.9) {
          clearInterval(interval);
          return 0.9;
        }
        return prev + 0.2;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      await db.modelCache.put({
        modelId: model.id,
        name: model.name,
        sizeBytes: model.sizeBytes,
        downloadedAt: Date.now(),
        precision: model.precision,
        cacheKey: `cache_${model.id}`,
      });
      setDownloadProgress(1.0);
      setDownloadingModelId(null);
      await loadCachedModels();
    }, 1500);
  };

  const handleDeleteModel = async (modelId: string) => {
    await db.modelCache.delete(modelId);
    await loadCachedModels();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Execution Provider Card */}
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-600/15 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/10">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Local AI Engine Runtime
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                {provider.toUpperCase()} Active
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Models execute 100% on-device via ONNX Runtime Web. Zero image data is ever sent over the network.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs">
          <HardDrive className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-300">
            {cachedModels.length} models cached (
            {(
              cachedModels.reduce((acc, m) => acc + m.sizeBytes, 0) /
              (1024 * 1024)
            ).toFixed(1)}{' '}
            MB)
          </span>
        </div>
      </div>

      {/* Available Models Registry */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Neural Models Registry
        </h4>

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
                      <span>Ready for Local Inference</span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Not Downloaded</div>
                  )}

                  {isCached ? (
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-xs text-gray-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge</span>
                    </button>
                  ) : (
                    <button
                      disabled={isDownloading}
                      onClick={() => handleSimulateModelDownload(model)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Downloading {Math.round(downloadProgress * 100)}%</span>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

