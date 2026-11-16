import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  Calendar,
  CheckCircle2,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';
import { db, ConversionHistoryItem } from '@mediaforge/database';
import { ExportManager } from '@mediaforge/core';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const list = await db.history.orderBy('completedAt').reverse().toArray();
    setHistory(list);
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your local conversion history?')) {
      await db.history.clear();
      await loadHistory();
    }
  };

  const filteredHistory =
    filter === 'all' ? history : history.filter((item) => item.category === filter);

  const totalInputMb = history.reduce((acc, h) => acc + h.inputSizeBytes, 0) / (1024 * 1024);
  const totalOutputMb = history.reduce((acc, h) => acc + h.outputSizeBytes, 0) / (1024 * 1024);
  const savedMb = Math.max(0, totalInputMb - totalOutputMb);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total Conversions
          </span>
          <p className="text-2xl font-extrabold text-white mt-1 font-mono">{history.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">Processed 100% locally on this device</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Data Processed
          </span>
          <p className="text-2xl font-extrabold text-blue-400 mt-1 font-mono">
            {totalInputMb.toFixed(1)} MB
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Source file buffer throughput</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Storage Space Saved
          </span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            {savedMb.toFixed(1)} MB
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Via local compression engines</p>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter:</span>
            {['all', 'image', 'audio', 'video', 'document', 'archive'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                  filter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-400 border border-dashed border-gray-800 rounded-xl">
            No conversion records found in local IndexedDB.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs flex items-center justify-center uppercase">
                    {item.outputFormat}
                  </div>
                  <div>
                    <h5 className="font-semibold text-white truncate max-w-sm">{item.fileName}</h5>
                    <p className="text-[11px] text-gray-400">
                      {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()} • {item.durationMs}ms duration
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <p className="text-emerald-400 font-bold">
                    {(item.outputSizeBytes / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-[10px] text-gray-400">
                    from {(item.inputSizeBytes / 1024).toFixed(1)} KB (
                    {new Date(item.completedAt).toLocaleTimeString()})
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
