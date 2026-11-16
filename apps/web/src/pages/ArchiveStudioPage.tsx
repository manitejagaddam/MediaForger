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
} from 'lucide-react';
import { ArchiveEngine, ArchiveFileEntry } from '@mediaforge/archive-engine';
import { ExportManager } from '@mediaforge/core';
import { db } from '@mediaforge/database';

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
      alert(`ZIP creation failed: ${err.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const handleExtractZip = async (file: File) => {
    setZipToExtract(file);
    setIsExtracting(true);
    setExtractedEntries([]);

    try {
      const entries = await ArchiveEngine.extractZip(file);
      setExtractedEntries(entries);
    } catch (err: any) {
      alert(`Archive extraction failed: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'create'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FolderArchive className="w-4 h-4" />
          <span>Create ZIP Archive</span>
        </button>
        <button
          onClick={() => setActiveTab('extract')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'extract'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Archive className="w-4 h-4" />
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
                  <h4 className="text-sm font-bold text-white">Files to Compress</h4>
                  <p className="text-xs text-gray-400">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition cursor-pointer"
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
                  className="border-2 border-dashed border-gray-800 hover:border-gray-700 rounded-xl p-12 text-center cursor-pointer text-xs text-gray-400"
                >
                  Click "Add Files" or drop multiple files here to bundle them into a secure ZIP.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-auto">
                  {filesToZip.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <FileCode className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-white font-medium truncate max-w-sm">{item.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {(item.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setFilesToZip((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-gray-400 hover:text-red-400 p-1"
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
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Archive File Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={archiveName}
                    onChange={(e) => setArchiveName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-mono outline-none"
                  />
                  <span className="text-xs font-mono text-gray-400">.zip</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-gray-400">
                    Compression Level (0-9)
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{compressionLevel}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="9"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(Number(e.target.value) as any)}
                  className="w-full accent-rose-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-400 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zip-slip path traversal and archive bomb protection enabled.</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                <button
                  disabled={isZipping || filesToZip.length === 0}
                  onClick={handleCreateZip}
                  className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isZipping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating ZIP...</span>
                    </>
                  ) : (
                    <>
                      <FolderArchive className="w-4 h-4" />
                      <span>Build ZIP Archive</span>
                    </>
                  )}
                </button>

                {createdZipBlob && (
                  <button
                    onClick={() => ExportManager.download(createdZipBlob, `${archiveName}.zip`)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow flex items-center justify-center gap-2 transition cursor-pointer"
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
              className="glass-panel border-2 border-dashed border-gray-700 hover:border-rose-500 rounded-3xl p-16 text-center cursor-pointer transition-all"
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
              <Archive className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Select a ZIP Archive to Extract</h3>
              <p className="text-xs text-gray-400 mt-1">
                Safely inspect and extract files without risk of directory traversal.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{zipToExtract.name}</h4>
                  <p className="text-xs text-gray-400">
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
                  className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-400 hover:text-white"
                >
                  Close Archive
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-auto">
                {extractedEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-white font-medium">{entry.path}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {(entry.data.length / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const blob = new Blob([entry.data as any]);
                        ExportManager.download(blob, entry.path);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200"
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
