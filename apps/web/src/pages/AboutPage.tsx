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
      <div className="glass-panel rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/[0.12] bg-[#121216]">
            <img
              src="/logo.png?v=3"
              alt="MediaForge"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Local Architecture & Privacy
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
              All media processing occurs inside your local browser or extension sandbox. No files are ever sent to remote servers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="p-3.5 rounded-lg bg-[#121217] border border-white/[0.05] space-y-1 text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Zero Network Egress</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Files are never uploaded to any remote server or cloud service.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#121217] border border-white/[0.05] space-y-1 text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>On-Device Compute</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Decoding and transformation run via WebAssembly, WebCodecs, and WebGPU.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#121217] border border-white/[0.05] space-y-1 text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Private Local Storage</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Cached assets are stored strictly in IndexedDB and Origin Private File System.
            </p>
          </div>
        </div>
      </div>

      {/* Format Support Matrix */}
      <div className="glass-panel rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div>
            <h4 className="text-xs font-semibold text-zinc-100">
              Supported Formats
            </h4>
            <p className="text-[11px] text-zinc-400">
              {allFormats.length} registered formats with decoder and encoder support
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

