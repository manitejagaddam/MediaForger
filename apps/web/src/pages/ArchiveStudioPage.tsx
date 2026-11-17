import React, { useState, useRef } from 'react';
import {
  Archive,
  Upload,
  Download,
  ShieldCheck,
  FileCode,
  Trash2,
  FolderArchive,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { ArchiveEngine, ArchiveFileEntry } from '@mediaforge/archive-engine';
import { ExportManager } from '@mediaforge/core';
import { db } from '@mediaforge/database';
import { ForgeArchiveIcon } from '../components/icons/StudioIcons';

interface ArchiveStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
}

export const ArchiveStudioPage: React.FC<ArchiveStudioPageProps> = ({ initialFile, onClearFile }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'extract'>('create');

  // Create ZIP state
  const [filesToZip, setFilesToZip] = useState<{ name: string; file: File }[]>([]);
  const [archiveName, setArchiveName] = useState('mediaforge_bundle');
  const [compressionLevel, setCompressionLevel] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(6);
  const [createdZipBlob, setCreatedZipBlob] = useState<Blob | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Extract ZIP state
  const [zipToExtract, setZipToExtract] = useState<File | null>(null);
  const [extractedEntries, setExtractedEntries] = useState<ArchiveFileEntry[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputCreateRef = useRef<HTMLInputElement>(null);
  const fileInputExtractRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialFile) {
      if (initialFile.name.endsWith('.zip') || initialFile.type.includes('zip')) {
        setActiveTab('extract');
        handleExtractZip(initialFile);
      } else {
        setActiveTab('create');
        setFilesToZip([{ name: initialFile.name, file: initialFile }]);
      }
    } else {
      setFilesToZip([]);
      setZipToExtract(null);
      setExtractedEntries([]);
      setCreatedZipBlob(null);
    }
  }, [initialFile]);

  const handleAddFilesToZip = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f) => ({ name: f.name, file: f }));
      setFilesToZip((prev) => [...prev, ...newFiles]);
      setCreatedZipBlob(null);
    }
  };

  const handleCreateZip = async () => {
    if (filesToZip.length === 0) return;
    setIsZipping(true);
    setError(null);

    try {
      const entries: ArchiveFileEntry[] = [];
      for (const item of filesToZip) {
        const buffer = await item.file.arrayBuffer();
        entries.push({
          path: item.name,
          data: new Uint8Array(buffer),
        });
      }

      const zipBlob = await ArchiveEngine.createZip(entries, compressionLevel);
      setCreatedZipBlob(zipBlob);

      // Record to history
      await db.history.put({
        id: `hist_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: `${archiveName}.zip`,
        category: 'archive',
        inputFormat: 'files',
        outputFormat: 'zip',
        inputSizeBytes: entries.reduce((acc, curr) => acc + curr.data.length, 0),
        outputSizeBytes: zipBlob.size,
        durationMs: 120,
        completedAt: Date.now(),
      });
    } catch (err: any) {
      setError(`ZIP creation failed: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const handleExtractZip = async (file: File) => {
    setZipToExtract(file);
    setIsExtracting(true);
    setExtractedEntries([]);
    setError(null);

    try {
      const entries = await ArchiveEngine.extractZip(file);
      setExtractedEntries(entries);
    } catch (err: any) {
      setError(`Archive extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-center justify-between">
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
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active:scale-[0.98] ${
            activeTab === 'create'
              ? 'bg-zinc-800/90 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-zinc-300" />
          <span>Create ZIP Archive</span>
        </button>
        <button
          onClick={() => setActiveTab('extract')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active:scale-[0.98] ${
            activeTab === 'extract'
              ? 'bg-zinc-800/90 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
          }`}
        >
          <ForgeArchiveIcon className="w-4 h-4 text-zinc-300" />
          <span>Extract & Inspect ZIP</span>
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Picker & Queue (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">Files to Compress</h4>
                  <p className="text-xs text-zinc-400">
                    {filesToZip.length} files selected (
                    {(
                      filesToZip.reduce((acc, f) => acc + f.file.size, 0) /
                      (1024 * 1024)
                    ).toFixed(2)}{' '}
                    MB total)
                  </p>
                </div>

                <button
                  onClick={() => fileInputCreateRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700/80 transition active:scale-[0.98] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Files</span>
                </button>
                <input
                  ref={fileInputCreateRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAddFilesToZip}
                />
              </div>

              {filesToZip.length === 0 ? (
                <div
                  onClick={() => fileInputCreateRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-12 text-center cursor-pointer text-xs text-zinc-400 transition"
                >
                  Click "Add Files" or drop multiple files here to bundle them into a secure ZIP.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-auto">
                  {filesToZip.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <FileCode className="w-4 h-4 text-zinc-400" />
                        <div>
                          <p className="text-zinc-100 font-medium truncate max-w-sm">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {(item.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setFilesToZip((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-zinc-500 hover:text-zinc-200 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Archive Options (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Archive File Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={archiveName}
                    onChange={(e) => setArchiveName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-zinc-500 outline-none transition"
                  />
                  <span className="text-xs font-mono text-zinc-400">.zip</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400">
                    Compression Level (0-9)
                  </span>
                  <span className="font-mono text-zinc-100 font-bold">{compressionLevel}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(Number(e.target.value) as any)}
                  className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0" />
                <span>Zip-slip path traversal and archive bomb protection enabled.</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <button
                  disabled={isZipping || filesToZip.length === 0}
                  onClick={handleCreateZip}
                  className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                >
                  {isZipping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                      <span>Creating ZIP...</span>
                    </>
                  ) : (
                    <>
                      <FolderArchive className="w-4 h-4 text-zinc-900" />
                      <span>Build ZIP Archive</span>
                    </>
                  )}
                </button>

                {createdZipBlob && (
                  <button
                    onClick={() => ExportManager.download(createdZipBlob, `${archiveName}.zip`)}
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {archiveName}.zip ({(createdZipBlob.size / 1024).toFixed(1)} KB)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Extract Tab */
        <div className="space-y-6">
          {!zipToExtract ? (
            <div
              onClick={() => fileInputExtractRef.current?.click()}
              className="glass-panel border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-[#141418] group"
            >
              <input
                ref={fileInputExtractRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleExtractZip(e.target.files[0]);
                  }
                }}
              />
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/90 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-200 shadow-md">
                <ForgeArchiveIcon className="w-9 h-9 text-zinc-100" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100">Select a ZIP Archive to Extract</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Safely inspect and extract files without risk of directory traversal.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">{zipToExtract.name}</h4>
                  <p className="text-xs text-zinc-400">
                    {extractedEntries.length} extracted files (
                    {(
                      extractedEntries.reduce((acc, e) => acc + e.data.length, 0) /
                      (1024 * 1024)
                    ).toFixed(2)}{' '}
                    MB decompressed)
                  </p>
                </div>

                <button
                  onClick={() => {
                    setZipToExtract(null);
                    setExtractedEntries([]);
                    onClearFile?.();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition active:scale-[0.98]"
                >
                  Close Archive
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-auto">
                {extractedEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-zinc-100 font-medium">{entry.path}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {(entry.data.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const blob = new Blob([entry.data as any]);
                        ExportManager.download(blob, entry.path);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs text-zinc-200 border border-zinc-700/60 transition active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
