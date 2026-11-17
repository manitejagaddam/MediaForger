import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Trash2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { getStorageQuota } from '@mediaforge/storage';
import { WasmRuntimeManager } from '@mediaforge/wasm-runtime';
import { db } from '@mediaforge/database';
import { ForgeSettingsIcon } from '../components/icons/StudioIcons';

export const SettingsPage: React.FC = () => {
  const [quota, setQuota] = useState<{
    quotaBytes: number;
    usageBytes: number;
    percentUsed: number;
    isPersistent: boolean;
  }>({
    quotaBytes: 0,
    usageBytes: 0,
    percentUsed: 0,
    isPersistent: false,
  });

  const [concurrency, setConcurrency] = useState(4);
  const [retentionDays, setRetentionDays] = useState(7);
  const [clearing, setClearing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const q = await getStorageQuota();
    setQuota(q);
  };

  const handleRequestPersistence = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const persisted = await navigator.storage.persist();
      setNotification({
        type: persisted ? 'success' : 'error',
        message: persisted
          ? 'Persistent storage granted! Browser will not evict your cached models.'
          : 'Storage persistence was denied by the browser.',
      });
      await loadStorageInfo();
    }
  };

  const handleClearWasmCache = async () => {
    setClearing(true);
    await WasmRuntimeManager.clearCache();
    await loadStorageInfo();
    setClearing(false);
    setNotification({
      type: 'success',
      message: 'WASM cache cleared successfully.',
    });
  };

  const handlePurgeOldData = async () => {
    setClearing(true);
    const result = await db.cleanupOldData(retentionDays);
    await loadStorageInfo();
    setClearing(false);
    setNotification({
      type: 'success',
      message: `Cleaned up ${result.deletedJobs} old jobs and ${result.deletedOutputs} temporary outputs.`,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-red-950/40 border-red-800/60 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Storage & Persistence */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-zinc-300" />
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Local Storage Quota & OPFS
            </h4>
          </div>

          <button
            onClick={handleRequestPersistence}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
              quota.isPersistent
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm'
            }`}
          >
            {quota.isPersistent ? 'Storage Persisted ✓' : 'Request Persistence'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">Total Quota</span>
            <p className="text-lg font-bold text-white font-mono mt-1">
              {(quota.quotaBytes / (1024 * 1024 * 1024)).toFixed(1)} GB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">Current Usage</span>
            <p className="text-lg font-bold text-zinc-100 font-mono mt-1">
              {(quota.usageBytes / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-400">Quota Consumed</span>
            <p className="text-lg font-bold text-zinc-100 font-mono mt-1">
              {quota.percentUsed.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-zinc-200 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, Math.min(100, quota.percentUsed))}%` }}
          />
        </div>
      </div>

      {/* Execution & Workers */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3">
          <Cpu className="w-5 h-5 text-zinc-300" />
          <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Worker Concurrency & Execution Limits
          </h4>
        </div>

        <div className="space-y-4 text-xs max-w-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Max Web Worker Concurrency</span>
              <span className="font-mono text-zinc-100 font-bold">{concurrency} Threads</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full accent-white bg-zinc-800 h-2 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Automatic Retention Cleanup</span>
              <span className="font-mono text-zinc-100 font-bold">{retentionDays} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full accent-white bg-zinc-800 h-2 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Cache & Maintenance */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-3">
          <Trash2 className="w-5 h-5 text-zinc-400" />
          <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Cache Purging & Maintenance
          </h4>
        </div>

        <div className="flex items-center gap-4">
          <button
            disabled={clearing}
            onClick={handleClearWasmCache}
            className="px-4 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-750 transition active:scale-95"
          >
            Clear WASM Binaries Cache
          </button>
          <button
            disabled={clearing}
            onClick={handlePurgeOldData}
            className="px-4 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
          >
            Purge Expired Database Outputs
          </button>
        </div>
      </div>
    </div>
  );
};

