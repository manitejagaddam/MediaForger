import React from 'react';
import {
  Cpu,
  Layers,
  Lock,
} from 'lucide-react';
import { FormatRegistry } from '@mediaforge/core';
import { MediaForgeLogo } from '../components/icons/StudioIcons';

export const AboutPage: React.FC = () => {
  const allFormats = FormatRegistry.getAll();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Privacy Manifesto Hero */}
      <div className="glass-panel rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 flex items-center justify-center shadow-md">
            <MediaForgeLogo className="w-10 h-10" size={40} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Privacy-First Zero-Egress Architecture
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              MediaForge is built on a fundamental requirement: all media files belong strictly to you.
              Processing occurs 100% inside your browser environment or local browser extension.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 text-xs hover:border-zinc-700 transition">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
              <Lock className="w-4 h-4 text-zinc-400" />
              <span>Zero Server Uploads</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              User files are never transferred over HTTP/WebSockets to any backend server or cloud API.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 text-xs hover:border-zinc-700 transition">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
              <Cpu className="w-4 h-4 text-zinc-400" />
              <span>Client-Side Web Workers</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Computation executes locally via OffscreenCanvas, Web Audio API, WebAssembly, and WebGPU.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 text-xs hover:border-zinc-700 transition">
            <div className="flex items-center gap-2 text-zinc-200 font-bold">
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Isolated Local Storage</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Files and history are persisted locally in browser IndexedDB and Origin Private File System (OPFS).
            </p>
          </div>
        </div>
      </div>

      {/* Format Support Matrix */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Comprehensive Format Support Matrix
            </h4>
            <p className="text-xs text-zinc-400">
              {allFormats.length} registered formats with separate decoder/encoder capabilities
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400">
                <th className="pb-3 pl-2">Format</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Extensions</th>
                <th className="pb-3">MIME Type</th>
                <th className="pb-3 text-center">Decode</th>
                <th className="pb-3 text-center">Encode</th>
                <th className="pb-3 text-center">Engine Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {allFormats.map((fmt) => (
                <tr key={fmt.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-2.5 pl-2 font-bold text-white uppercase">{fmt.id}</td>
                  <td className="py-2.5 capitalize text-zinc-400">{fmt.category}</td>
                  <td className="py-2.5 text-zinc-300 font-semibold">.{fmt.extensions.join(', .')}</td>
                  <td className="py-2.5 text-zinc-500 text-[11px]">{fmt.mimeTypes[0]}</td>
                  <td className="py-2.5 text-center">
                    {fmt.supportsDecoding ? (
                      <span className="text-zinc-100 font-bold">✓</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    {fmt.supportsEncoding ? (
                      <span className="text-zinc-100 font-bold">✓</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-sans uppercase font-semibold ${
                        fmt.requiredTier === 'level1-native'
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/80'
                          : 'bg-zinc-850 text-zinc-200 border border-zinc-700'
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

