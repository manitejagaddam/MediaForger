import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Settings } from 'lucide-react';

export const OptionsApp: React.FC = () => {
  const [defaultFormat, setDefaultFormat] = useState('webp');
  const [defaultQuality, setDefaultQuality] = useState(85);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6 text-gray-100 font-sans">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">MediaForge Extension Settings</h1>
          <p className="text-xs text-gray-400">Configure default context-menu conversion behaviors</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Default Right-Click Image Target Format
          </label>
          <select
            value={defaultFormat}
            onChange={(e) => setDefaultFormat(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-xs text-white outline-none"
          >
            <option value="webp">WebP (Recommended)</option>
            <option value="png">PNG (Lossless)</option>
            <option value="jpeg">JPEG</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-gray-400">
              Default Compression Quality
            </span>
            <span className="font-mono text-blue-400">{defaultQuality}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={defaultQuality}
            onChange={(e) => setDefaultQuality(Number(e.target.value))}
            className="w-full accent-blue-500 h-2 bg-gray-800 rounded"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow transition"
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
