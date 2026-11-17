import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { MediaForgeLogo } from './components/StudioIcons';

export const OptionsApp: React.FC = () => {
  const [defaultFormat, setDefaultFormat] = useState('webp');
  const [defaultQuality, setDefaultQuality] = useState(85);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6 text-zinc-100 font-sans bg-[#09090b] min-h-screen">
      <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-sm">
          <MediaForgeLogo className="w-7 h-7" size={28} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100">MediaForge Extension Settings</h1>
          <p className="text-xs text-zinc-400">Configure default context-menu conversion behaviors</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Default Right-Click Image Target Format
          </label>
          <select
            value={defaultFormat}
            onChange={(e) => setDefaultFormat(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-500 outline-none transition"
          >
            <option value="webp">WebP (Recommended)</option>
            <option value="png">PNG (Lossless)</option>
            <option value="jpeg">JPEG</option>
            <option value="bmp">BMP</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-zinc-400">
              Default Compression Quality
            </span>
            <span className="font-mono text-zinc-100 font-bold">{defaultQuality}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={defaultQuality}
            onChange={(e) => setDefaultQuality(Number(e.target.value))}
            className="w-full accent-white h-2 bg-zinc-800 rounded cursor-pointer"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold tracking-wide shadow-sm transition active:scale-[0.98] cursor-pointer"
        >
          {saved ? 'Settings Saved ✓' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
