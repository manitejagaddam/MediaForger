import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Lock,
  FileCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { FormatRegistry } from '@mediaforge/core';

export const AboutPage: React.FC = () => {
  const allFormats = FormatRegistry.getAll();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Privacy Manifesto Hero */}
      <div className="glass-panel rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Privacy-First Zero-Egress Architecture
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              MediaForge is built on a fundamental requirement: all media files belong strictly to you.
              Processing occurs 100% inside your browser environment or local browser extension.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>Zero Server Uploads</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              User files are never transferred over HTTP/WebSockets to any backend server or cloud API.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Client-Side Web Workers</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Computation executes locally via OffscreenCanvas, Web Audio API, WebAssembly, and WebGPU.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-violet-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>Isolated Local Storage</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Files and history are persisted locally in browser IndexedDB and Origin Private File System (OPFS).
            </p>
          </div>
        </div>
      </div>

      {/* Format Support Matrix */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Comprehensive Format Support Matrix
            </h4>
            <p className="text-xs text-gray-400">
              {allFormats.length} registered formats with separate decoder/encoder capabilities
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                <th className="pb-3 pl-2">Format</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Extensions</th>
                <th className="pb-3">MIME Type</th>
                <th className="pb-3 text-center">Decode</th>
                <th className="pb-3 text-center">Encode</th>
                <th className="pb-3 text-center">Engine Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-gray-300">
              {allFormats.map((fmt) => (
                <tr key={fmt.id} className="hover:bg-gray-800/30 transition">
                  <td className="py-2.5 pl-2 font-bold text-white uppercase">{fmt.id}</td>
                  <td className="py-2.5 capitalize text-gray-400">{fmt.category}</td>
                  <td className="py-2.5 text-blue-400">.{fmt.extensions.join(', .')}</td>
                  <td className="py-2.5 text-gray-400 text-[11px]">{fmt.mimeTypes[0]}</td>
                  <td className="py-2.5 text-center">
                    {fmt.supportsDecoding ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    {fmt.supportsEncoding ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-sans uppercase font-semibold ${
                        fmt.requiredTier === 'level1-native'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      {fmt.requiredTier === 'level1-native' ? 'Level 1 Native' : 'Level 2 WASM'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

