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

export const DocumentStudioPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [inputContent, setInputContent] = useState<string>('');
  const [outputContent, setOutputContent] = useState<string>('');
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [targetFormat, setTargetFormat] = useState<'json' | 'csv' | 'txt'>('json');
  const [delimiter, setDelimiter] = useState(',');
  const [prettyJson, setPrettyJson] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      alert(`Document conversion failed: ${err.message}`);
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
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-gray-900/50"
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Select a Document or Data File</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
            Convert CSV to JSON, JSON to CSV, normalize TXT line breaks. Fast, private, in-browser parsing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Data Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {inspection?.detectedFormat || 'DOC'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-sm">{file.name}</h4>
                    <p className="text-[11px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setOutputBlob(null);
                    setOutputContent('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition"
                >
                  Change File
                </button>
              </div>

              {/* Input text preview */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Source Preview
                </span>
                <pre className="p-4 rounded-xl bg-[#080c14] border border-gray-800/80 text-[11px] font-mono text-gray-300 max-h-48 overflow-auto whitespace-pre-wrap select-all">
                  {inputContent}
                </pre>
              </div>

              {/* Output preview */}
              {outputContent && (
                <div className="space-y-1 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Converted Output Preview
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-gray-900 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 max-h-60 overflow-auto whitespace-pre-wrap select-all">
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
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTargetFormat('json')}
                    className={`p-3 rounded-xl border text-left transition ${
                      targetFormat === 'json'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
                        : 'border-gray-800 bg-gray-900 text-gray-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">JSON</div>
                    <div className="text-[10px] text-gray-400">Structured Objects</div>
                  </button>
                  <button
                    onClick={() => setTargetFormat('csv')}
                    className={`p-3 rounded-xl border text-left transition ${
                      targetFormat === 'csv'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
                        : 'border-gray-800 bg-gray-900 text-gray-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">CSV</div>
                    <div className="text-[10px] text-gray-400">Spreadsheet Data</div>
                  </button>
                </div>
              </div>

              {/* Delimiter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  CSV Delimiter
                </label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="&#9;">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              {/* Pretty Print JSON */}
              {targetFormat === 'json' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prettyJson}
                    onChange={(e) => setPrettyJson(e.target.checked)}
                    className="rounded border-gray-700 text-emerald-500"
                  />
                  <span>Format & Indent JSON (Pretty Print)</span>
                </label>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <button
                  disabled={isProcessing}
                  onClick={executeConversion}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Parsing & Converting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>Convert Document</span>
                    </>
                  )}
                </button>

                {outputBlob && (
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
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
