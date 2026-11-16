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
} from 'lucide-react';
import { getStorageQuota } from '@mediaforge/storage';
import { WasmRuntimeManager } from '@mediaforge/wasm-runtime';
import { db } from '@mediaforge/database';

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
      alert(
        persisted
          ? 'Persistent storage granted! Browser will not evict your cached models.'
          : 'Storage persistence was denied by the browser.'
      );
      await loadStorageInfo();
    }
  };

  const handleClearWasmCache = async () => {
    setClearing(true);
    await WasmRuntimeManager.clearCache();
    await loadStorageInfo();
    setClearing(false);
    alert('WASM cache cleared successfully.');
  };

  const handlePurgeOldData = async () => {
    setClearing(true);
    const result = await db.cleanupOldData(retentionDays);
    await loadStorageInfo();
    setClearing(false);
    alert(`Cleaned up ${result.deletedJobs} old jobs and ${result.deletedOutputs} temporary outputs.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Storage & Persistence */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Local Storage Quota & OPFS
            </h4>
          </div>

          <button
            onClick={handleRequestPersistence}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              quota.isPersistent
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
            }`}
          >
            {quota.isPersistent ? 'Storage Persisted ✓' : 'Request Persistence'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-gray-400">Total Quota</span>
            <p className="text-lg font-bold text-white font-mono mt-1">
              {(quota.quotaBytes / (1024 * 1024 * 1024)).toFixed(1)} GB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-gray-400">Current Usage</span>
            <p className="text-lg font-bold text-blue-400 font-mono mt-1">
              {(quota.usageBytes / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
            <span className="text-gray-400">Quota Consumed</span>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {quota.percentUsed.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, Math.min(100, quota.percentUsed))}%` }}
          />
        </div>
      </div>

      {/* Execution & Workers */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Worker Concurrency & Execution Limits
          </h4>
        </div>

        <div className="space-y-4 text-xs max-w-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-medium">Max Web Worker Concurrency</span>
              <span className="font-mono text-indigo-400 font-bold">{concurrency} Threads</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-gray-800 h-2 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-medium">Automatic Retention Cleanup</span>
              <span className="font-mono text-indigo-400 font-bold">{retentionDays} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-gray-800 h-2 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Cache & Maintenance */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Cache Purging & Maintenance
          </h4>
        </div>

        <div className="flex items-center gap-4">
          <button
            disabled={clearing}
            onClick={handleClearWasmCache}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition"
          >
            Clear WASM Binaries Cache
          </button>
          <button
            disabled={clearing}
            onClick={handlePurgeOldData}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-xs font-semibold text-gray-300 transition"
          >
            Purge Expired Database Outputs
          </button>
        </div>
      </div>
    </div>
  );
};

