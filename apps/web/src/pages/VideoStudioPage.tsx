import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Video,
  Camera,
  Download,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Film,
  RotateCcw,
  RotateCw,
  FastForward,
  Rewind,
  StepForward,
  StepBack,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { VideoEngine, VideoMetadata } from '@mediaforge/video-engine';
import { FileInspector, ExportManager } from '@mediaforge/core';
import { InspectionResult } from '@mediaforge/shared-types';
import { ObjectUrlManager } from '@mediaforge/storage';
import { db } from '@mediaforge/database';

interface VideoStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
}

export const VideoStudioPage: React.FC<VideoStudioPageProps> = ({ initialFile, onClearFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [capturedThumbBlob, setCapturedThumbBlob] = useState<Blob | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Snapshot options
  const [thumbFormat, setThumbFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [thumbQuality, setThumbQuality] = useState(90);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    } else {
      setFile(null);
      setCapturedThumbBlob(null);
      setVideoMeta(null);
      setInspection(null);
      if (videoUrl) {
        ObjectUrlManager.revoke(videoUrl);
        setVideoUrl(null);
      }
      if (thumbUrl) {
        ObjectUrlManager.revoke(thumbUrl);
        setThumbUrl(null);
      }
    }
  }, [initialFile]);

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
      setDuration(meta.durationSeconds);

      if (videoUrl) ObjectUrlManager.revoke(videoUrl);
      const url = ObjectUrlManager.create(selectedFile);
      setVideoUrl(url);
    } catch (err: any) {
      alert(`Video loading error: ${err.message}`);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (timeSec: number) => {
    const clamped = Math.max(0, Math.min(duration, timeSec));
    setCurrentTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const skipRelative = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    handleSeek(videoRef.current.currentTime + deltaSeconds);
  };

  const stepFrame = (frames: number) => {
    // 30 fps approximation for frame stepping
    const frameDuration = 1 / 30;
    skipRelative(frames * frameDuration);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleCaptureThumbnail = async () => {
    if (!file) return;
    setIsCapturing(true);

    try {
      const time = videoRef.current ? videoRef.current.currentTime : 1.0;
      const blob = await VideoEngine.captureThumbnail(file, time, thumbFormat, thumbQuality / 100);

      if (thumbUrl) ObjectUrlManager.revoke(thumbUrl);
      const newThumbUrl = ObjectUrlManager.create(blob);
      setThumbUrl(newThumbUrl);
      setCapturedThumbBlob(blob);

      // Record to history
      await db.history.put({
        id: `hist_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: `${file.name}_frame_${time.toFixed(2)}s.${thumbFormat}`,
        category: 'video',
        inputFormat: inspection?.detectedFormat || 'video',
        outputFormat: thumbFormat,
        inputSizeBytes: file.size,
        outputSizeBytes: blob.size,
        durationMs: 80,
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
    const filename = `${cleanBase}_frame_${currentTime.toFixed(2)}s.${thumbFormat}`;
    ExportManager.download(capturedThumbBlob, filename);
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
            Inspect video streams, scrub, fast-forward, step frames, and extract crystal-clear full-resolution snapshots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Video Player & Interactive Scrubbing (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {inspection?.detectedFormat || 'VID'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-sm">{file.name}</h4>
                    <p className="text-[11px] text-gray-400">
                      {videoMeta?.width} × {videoMeta?.height} px • {duration.toFixed(1)}s •{' '}
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setCapturedThumbBlob(null);
                    if (videoUrl) {
                      ObjectUrlManager.revoke(videoUrl);
                      setVideoUrl(null);
                    }
                    if (thumbUrl) {
                      ObjectUrlManager.revoke(thumbUrl);
                      setThumbUrl(null);
                    }
                    onClearFile?.();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition"
                >
                  Change Video
                </button>
              </div>

              {/* Video Player Viewport */}
              <div className="relative rounded-xl bg-black border border-gray-800 overflow-hidden flex items-center justify-center min-h-[300px]">
                <video
                  ref={videoRef}
                  src={videoUrl || ''}
                  playsInline
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full max-h-[440px] object-contain"
                />
              </div>

              {/* Interactive Timeline Progress Scrubber */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                  <span className="text-amber-400 font-bold">{currentTime.toFixed(2)}s</span>
                  <span className="text-gray-400">{duration.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.033"
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Video Control Bar */}
              <div className="p-4 rounded-xl bg-[#080c14] border border-gray-800 flex flex-wrap items-center justify-between gap-4">
                {/* Playback & Seeking Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Rewind 10s */}
                  <button
                    onClick={() => skipRelative(-10)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  {/* Rewind 5s */}
                  <button
                    onClick={() => skipRelative(-5)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    title="Rewind 5s"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  {/* Step 1 frame back */}
                  <button
                    onClick={() => stepFrame(-1)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    title="Previous Frame (1/30s)"
                  >
                    <StepBack className="w-4 h-4" />
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 transition cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  {/* Step 1 frame forward */}
                  <button
                    onClick={() => stepFrame(1)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    title="Next Frame (1/30s)"
                  >
                    <StepForward className="w-4 h-4" />
                  </button>
                  {/* Fast Forward 5s */}
                  <button
                    onClick={() => skipRelative(5)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    title="Fast Forward 5s"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                  {/* Fast Forward 10s */}
                  <button
                    onClick={() => skipRelative(10)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                    title="Fast Forward 10s"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 text-xs">
                  {[0.5, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition ${
                        playbackRate === rate
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 accent-amber-500 bg-gray-800 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Video Tools & Frame Extractor (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  High-Precision Frame & Thumbnail Capture
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Use the scrubber and frame-stepping buttons on the player to stop on the exact frame, then capture full-resolution output.
                </p>
              </div>

              {/* Snapshot Format & Quality */}
              <div className="space-y-4 pt-2 border-t border-gray-800">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Snapshot Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setThumbFormat('jpeg')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                        thumbFormat === 'jpeg'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-gray-800 bg-gray-900 text-gray-400'
                      }`}
                    >
                      JPEG Photo
                    </button>
                    <button
                      onClick={() => setThumbFormat('png')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                        thumbFormat === 'png'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-gray-800 bg-gray-900 text-gray-400'
                      }`}
                    >
                      PNG Lossless
                    </button>
                  </div>
                </div>

                {thumbFormat === 'jpeg' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-gray-400">
                        Image Quality ({thumbQuality}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={thumbQuality}
                      onChange={(e) => setThumbQuality(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-gray-800 h-2 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Capture Frame Button */}
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
                    <span className="font-semibold text-white">Extracted Snapshot</span>
                    <span className="font-mono text-amber-400">
                      {(capturedThumbBlob.size / 1024).toFixed(1)} KB ({thumbFormat.toUpperCase()})
                    </span>
                  </div>

                  <img
                    src={thumbUrl}
                    alt="Captured Snapshot"
                    className="w-full h-44 object-cover rounded-lg border border-gray-800"
                  />

                  <button
                    onClick={handleDownloadThumbnail}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Snapshot ({thumbFormat.toUpperCase()})</span>
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
