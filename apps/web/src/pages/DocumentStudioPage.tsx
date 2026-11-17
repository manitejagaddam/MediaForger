import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  ArrowRightLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { DocumentEngine } from '@mediaforge/document-engine';
import { FileInspector, ExportManager } from '@mediaforge/core';
import { InspectionResult } from '@mediaforge/shared-types';
import { db } from '@mediaforge/database';

interface DocumentStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
}

export const DocumentStudioPage: React.FC<DocumentStudioPageProps> = ({ initialFile, onClearFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [inputContent, setInputContent] = useState<string>('');
  const [outputContent, setOutputContent] = useState<string>('');
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [targetFormat, setTargetFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [delimiter, setDelimiter] = useState(',');
  const [prettyJson, setPrettyJson] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    } else {
      setFile(null);
      setOutputBlob(null);
      setOutputContent('');
      setInputContent('');
      setInspection(null);
    }
  }, [initialFile]);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setOutputBlob(null);
    setOutputContent('');

    const inspected = await FileInspector.inspect(selectedFile);
    setInspection(inspected);

    const text = await selectedFile.text();
    setInputContent(text.slice(0, 5000)); // Sample preview

    if (inspected.detectedFormat === 'csv') {
      setTargetFormat('json');
    } else if (inspected.detectedFormat === 'json') {
      setTargetFormat('csv');
    }
  };

  const executeConversion = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const blob = await DocumentEngine.processDocument(file, {
        outputFormat: targetFormat,
        csvDelimiter: delimiter,
        prettyPrintJson: prettyJson,
      });

      const text = await blob.text();
      setOutputContent(text);
      setOutputBlob(blob);

      // Save to history
      await db.history.put({
        id: `hist_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: file.name,
        category: 'document',
        inputFormat: inspection?.detectedFormat || 'doc',
        outputFormat: targetFormat,
        inputSizeBytes: file.size,
        outputSizeBytes: blob.size,
        durationMs: 50,
        completedAt: Date.now(),
      });
    } catch (err: any) {
      setErrorMessage(`Document conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    const filename = ExportManager.formatOutputFilename(file.name, targetFormat);
    ExportManager.download(outputBlob, filename);
  };

  const handleCopy = async () => {
    if (!outputContent) return;
    await navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-between text-xs text-zinc-200 animate-fadeIn">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-white px-2 py-1 rounded transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-[#141418] group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt,text/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800/90 border border-zinc-700 text-zinc-200 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-200">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Select a Document or Data File</h3>
          <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
            Convert CSV to JSON, JSON to CSV, normalize TXT line breaks. Fast, private, in-browser parsing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Data Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {inspection?.detectedFormat || 'DOC'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 truncate max-w-sm">{file.name}</h4>
                    <p className="text-[11px] text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setOutputBlob(null);
                    setOutputContent('');
                    setInputContent('');
                    setInspection(null);
                    onClearFile?.();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition active:scale-[0.98]"
                >
                  Change File
                </button>
              </div>

              {/* Input text preview */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Source Preview
                </span>
                <pre className="p-4 rounded-xl bg-[#09090c] border border-zinc-800/80 text-[11px] font-mono text-zinc-300 max-h-48 overflow-auto whitespace-pre-wrap select-all">
                  {inputContent}
                </pre>
              </div>

              {/* Output preview */}
              {outputContent && (
                <div className="space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                      Converted Output Preview
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#09090c] border border-zinc-700/80 text-[11px] font-mono text-zinc-200 max-h-60 overflow-auto whitespace-pre-wrap select-all">
                    {outputContent}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Settings & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTargetFormat('json')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetFormat === 'json'
                        ? 'border-zinc-300 bg-zinc-800/90 text-white font-semibold shadow-sm'
                        : 'border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">JSON</div>
                    <div className="text-[10px] text-zinc-400">Structured Objects</div>
                  </button>
                  <button
                    onClick={() => setTargetFormat('csv')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetFormat === 'csv'
                        ? 'border-zinc-300 bg-zinc-800/90 text-white font-semibold shadow-sm'
                        : 'border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">CSV</div>
                    <div className="text-[10px] text-zinc-400">Spreadsheet Data</div>
                  </button>
                </div>
              </div>

              {/* Delimiter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  CSV Delimiter
                </label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:border-zinc-500 outline-none transition"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="&#9;">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              {/* Pretty Print JSON */}
              {targetFormat === 'json' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={prettyJson}
                    onChange={(e) => setPrettyJson(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-zinc-200"
                  />
                  <span>Format & Indent JSON (Pretty Print)</span>
                </label>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <button
                  disabled={isProcessing}
                  onClick={executeConversion}
                  className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                      <span>Parsing & Converting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4 text-zinc-900" />
                      <span>Convert Document</span>
                    </>
                  )}
                </button>

                {outputBlob && (
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {targetFormat.toUpperCase()}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

