import React, { useState } from 'react';
import {
  Package,
  ShieldCheck,
  Download,
  Copy,
  Check,
  X,
  FileCheck,
  RefreshCw,
  Hash,
} from 'lucide-react';
import { DeliveryEngine, DeliverableFile, DeliveryPackageResult } from '@mediaforge/core';
import { ExportManager } from '@mediaforge/core';
import { ForgeShieldIcon } from './icons/StudioIcons';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFiles?: DeliverableFile[];
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  initialFiles = [],
}) => {
  const [clientName, setClientName] = useState('Acme Global Media');
  const [projectName, setProjectName] = useState('Campaign Master Deliverable');
  const [isPackaging, setIsPackaging] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<DeliveryPackageResult | null>(null);
  const [copiedCert, setCopiedCert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // If no files were provided, create a sample deliverable for demonstration
  const stagedFiles: DeliverableFile[] =
    initialFiles.length > 0
      ? initialFiles
      : [
          {
            name: 'master_visual_4k.webp',
            blob: new Blob(['MEDIAFORGE_DEMO_IMAGE_DATA_4K'], { type: 'image/webp' }),
            category: 'image',
            format: 'webp',
          },
          {
            name: 'soundtrack_320kbps.mp3',
            blob: new Blob(['MEDIAFORGE_DEMO_AUDIO_LAME_ENCODED'], { type: 'audio/mp3' }),
            category: 'audio',
            format: 'mp3',
          },
          {
            name: 'dataset_clean_export.csv',
            blob: new Blob(['id,metric,value\n1,transcoding_speed,60fps\n'], { type: 'text/csv' }),
            category: 'document',
            format: 'csv',
          },
        ];

  const handleSealPackage = async () => {
    setIsPackaging(true);
    setError(null);
    setProgressPercent(10);
    setProgressStage('Initializing delivery vault...');

    try {
      const res = await DeliveryEngine.createDeliveryPackage(
        clientName || 'General Client',
        projectName || 'MediaForge Project',
        stagedFiles,
        (stage, pct) => {
          setProgressStage(stage);
          setProgressPercent(pct);
        }
      );

      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Delivery packaging failed');
    } finally {
      setIsPackaging(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    ExportManager.download(result.bundleBlob, `${result.packageId}.zip`);
  };

  const handleCopyCertificate = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.certificateText);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0e0e12] border border-[#27272a] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#222227] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
              <Package className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Client Delivery & Packaging Hub
                <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                  Certified SHA-256
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Seal finished media assets into a verifiable client delivery vault with cryptographic provenance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs">
              {error}
            </div>
          )}

          {!result ? (
            <div className="space-y-4">
              {/* Form Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Recipient / Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Acme Studio"
                    className="w-full bg-[#141418] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Deliverable Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Summer Commercial 4K"
                    className="w-full bg-[#141418] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Staged Assets List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400">
                    Staged Assets for Delivery ({stagedFiles.length})
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Total:{' '}
                    {(
                      stagedFiles.reduce((acc, curr) => acc + curr.blob.size, 0) / 1024
                    ).toFixed(1)}{' '}
                    KB
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-[#222227] bg-[#111114] p-3">
                  {stagedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-sm">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                          {file.format || 'file'}
                        </span>
                        <span className="text-zinc-200 truncate font-medium">{file.name}</span>
                      </div>
                      <span className="text-zinc-500 font-mono text-[11px]">
                        {(file.blob.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-Egress Guarantee Strip */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-400">
                <ForgeShieldIcon className="w-5 h-5 text-zinc-300 shrink-0" />
                <span>
                  <strong>Zero-Egress Security Seal:</strong> Package will include SHA-256 checksums, JSON provenance manifest, and human-readable delivery receipt with zero cloud transit.
                </span>
              </div>

              {/* Packaging Progress */}
              {isPackaging && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                      <span>{progressStage}</span>
                    </span>
                    <span className="text-white font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result Success View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                    Delivery Package ID
                  </span>
                  <h4 className="text-sm font-bold text-white font-mono mt-0.5">
                    {result.packageId}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400">Sealed Vault Size</span>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {(result.totalSizeBytes / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Certificate Preview Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Cryptographic Delivery Certificate</span>
                  </span>
                  <button
                    onClick={handleCopyCertificate}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition"
                  >
                    {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCert ? 'Copied' : 'Copy Certificate'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-[#09090c] border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56 leading-relaxed select-all">
                  {result.certificateText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#222227] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            {result ? 'Done' : 'Cancel'}
          </button>

          {!result ? (
            <button
              disabled={isPackaging}
              onClick={handleSealPackage}
              className="btn-primary"
            >
              <Package className="w-4 h-4 text-zinc-950" />
              <span>Seal & Dispatch Delivery Vault</span>
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className="btn-primary"
            >
              <Download className="w-4 h-4 text-zinc-950" />
              <span>Download Delivery Package (.zip)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
