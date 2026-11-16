import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Video,
  Camera,
  Download,
  Play,
  Pause,
  Sparkles,
  Layers,
  RefreshCw,
  Film,
  CheckCircle2,
} from 'lucide-react';
import { VideoEngine, VideoMetadata } from '@mediaforge/video-engine';
import { FileInspector, ExportManager } from '@mediaforge/core';
import { InspectionResult } from '@mediaforge/shared-types';
import { ObjectUrlManager } from '@mediaforge/storage';
import { db } from '@mediaforge/database';

export const VideoStudioPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [capturedThumbBlob, setCapturedThumbBlob] = useState<Blob | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) ObjectUrlManager.revoke(videoUrl);
      if (thumbUrl) ObjectUrlManager.revoke(thumbUrl);
    };
  }, []);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setCapturedThumbBlob(null);

    const inspected = await FileInspector.inspect(selectedFile);
    setInspection(inspected);

    try {
      const meta = await VideoEngine.inspectVideo(selectedFile);
      setVideoMeta(meta);

      if (videoUrl) ObjectUrlManager.revoke(videoUrl);
      const url = ObjectUrlManager.create(selectedFile);
      setVideoUrl(url);
    } catch (err: any) {
      alert(`Video loading error: ${err.message}`);
    }
  };

  const handleCaptureThumbnail = async () => {
    if (!file) return;
    setIsCapturing(true);

    try {
      const time = videoRef.current ? videoRef.current.currentTime : 1.0;
      const blob = await VideoEngine.captureThumbnail(file, time, 'jpeg', 0.9);

      if (thumbUrl) ObjectUrlManager.revoke(thumbUrl);
      const newThumbUrl = ObjectUrlManager.create(blob);
      setThumbUrl(newThumbUrl);
      setCapturedThumbBlob(blob);

      // Record to history
      await db.history.put({
        id: `hist_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: `${file.name}_thumb.jpg`,
        category: 'video',
        inputFormat: inspection?.detectedFormat || 'video',
        outputFormat: 'jpeg',
        inputSizeBytes: file.size,
        outputSizeBytes: blob.size,
        durationMs: 150,
        completedAt: Date.now(),
      });
    } catch (err: any) {
      alert(`Thumbnail capture failed: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadThumbnail = () => {
    if (!capturedThumbBlob || !file) return;
    const cleanBase = file.name.replace(/\.[^/.]+$/, '');
    ExportManager.download(capturedThumbBlob, `${cleanBase}_thumbnail.jpg`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel border-2 border-dashed border-gray-700 hover:border-amber-500 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-gray-900/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.webm,.mkv,.mov,.avi"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-600/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Select a Video to Forge</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
            Inspect video streams, scrub frames, capture high-res thumbnails, and manage video assets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Video Player & Scrubbing (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase">
                    {inspection?.detectedFormat || 'VID'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-sm">{file.name}</h4>
                    <p className="text-[11px] text-gray-400">
                      {videoMeta?.width} × {videoMeta?.height} px • {videoMeta?.durationSeconds.toFixed(1)}s •{' '}
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setCapturedThumbBlob(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition"
                >
                  Change Video
                </button>
              </div>

              {/* Video Player */}
              <div className="relative rounded-xl bg-black border border-gray-800 overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl || ''}
                  controls
                  playsInline
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                  className="w-full max-h-[460px] object-contain"
                />
              </div>

              {/* Timestamp scrubber status */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
                <span>Timestamp: {currentTime.toFixed(2)}s</span>
                <span>Duration: {videoMeta?.durationSeconds.toFixed(2)}s</span>
              </div>
            </div>
          </div>

          {/* Video Tools & Frame Extractor (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  Hardware Frame & Thumbnail Capture
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Scrub to any timestamp in the video player and extract a crystal-clear, full-resolution JPEG/PNG snapshot.
                </p>
              </div>

              <button
                disabled={isCapturing}
                onClick={handleCaptureThumbnail}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isCapturing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Capturing Frame...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Capture Frame at {currentTime.toFixed(2)}s</span>
                  </>
                )}
              </button>

              {/* Captured Thumbnail Preview & Download */}
              {capturedThumbBlob && thumbUrl && (
                <div className="p-4 rounded-xl bg-gray-900 border border-amber-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Extracted Thumbnail</span>
                    <span className="font-mono text-amber-400">
                      {(capturedThumbBlob.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <img
                    src={thumbUrl}
                    alt="Captured Thumbnail"
                    className="w-full h-44 object-cover rounded-lg border border-gray-800"
                  />

                  <button
                    onClick={handleDownloadThumbnail}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Thumbnail (JPEG)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
