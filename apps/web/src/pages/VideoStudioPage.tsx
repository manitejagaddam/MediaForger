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
import { ForgeVideoIcon } from '../components/icons/StudioIcons';

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
  const [capturedTime, setCapturedTime] = useState<number>(0);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setCurrentTime(0);
    setCapturedTime(0);
    setIsPlaying(false);
    setErrorMessage(null);

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
      setErrorMessage(`Video loading error: ${err.message}`);
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
    setErrorMessage(null);

    try {
      const time = videoRef.current ? videoRef.current.currentTime : 0;
      setCapturedTime(time);
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
      setErrorMessage(`Thumbnail capture failed: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadThumbnail = () => {
    if (!capturedThumbBlob || !file) return;
    const cleanBase = file.name.replace(/\.[^/.]+$/, '');
    const filename = `${cleanBase}_frame_${capturedTime.toFixed(2)}s.${thumbFormat}`;
    ExportManager.download(capturedThumbBlob, filename);
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
          className="glass-panel border border-dashed border-white/[0.12] hover:border-white/[0.25] rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-[#0f0f14] group"
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
          <div className="w-10 h-10 mx-auto rounded-xl bg-[#141418] border border-white/[0.08] text-zinc-200 flex items-center justify-center mb-3">
            <ForgeVideoIcon className="w-5 h-5 text-zinc-200" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">Drop video to inspect or extract frames</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Playback scrubbing, frame-by-frame inspection, and snapshot extraction
          </p>
          <div className="mt-4">
            <span className="btn-primary">Choose Video</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Video Player & Interactive Scrubbing (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {inspection?.detectedFormat || 'VID'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 truncate max-w-sm">{file.name}</h4>
                    <p className="text-[11px] text-zinc-400">
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
                  className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition active:scale-[0.98]"
                >
                  Change Video
                </button>
              </div>

              {/* Video Player Viewport */}
              <div className="relative rounded-xl bg-black border border-zinc-800 overflow-hidden flex items-center justify-center min-h-[300px]">
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
                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                  <span className="text-zinc-100 font-bold">{currentTime.toFixed(2)}s</span>
                  <span className="text-zinc-500">{duration.toFixed(2)}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.033"
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-white bg-zinc-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Video Control Bar */}
              <div className="p-4 rounded-xl bg-[#09090c] border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                {/* Playback & Seeking Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Rewind 10s */}
                  <button
                    onClick={() => skipRelative(-10)}
                    className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  {/* Rewind 5s */}
                  <button
                    onClick={() => skipRelative(-5)}
                    className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
                    title="Rewind 5s"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  {/* Step 1 frame back */}
                  <button
                    onClick={() => stepFrame(-1)}
                    className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
                    title="Previous Frame (1/30s)"
                  >
                    <StepBack className="w-4 h-4" />
                  </button>

                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  {/* Step 1 frame forward */}
                  <button
                    onClick={() => stepFrame(1)}
                    className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
                    title="Next Frame (1/30s)"
                  >
                    <StepForward className="w-4 h-4" />
                  </button>
                  {/* Fast Forward 5s */}
                  <button
                    onClick={() => skipRelative(5)}
                    className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
                    title="Fast Forward 5s"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                  {/* Fast Forward 10s */}
                  <button
                    onClick={() => skipRelative(10)}
                    className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition active:scale-95"
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
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition active:scale-95 ${
                        playbackRate === rate
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-transparent'
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
                    className="text-zinc-400 hover:text-zinc-100 p-1 transition"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 accent-white bg-zinc-800 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Video Tools & Frame Extractor (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                  <Camera className="w-4 h-4 text-zinc-300" />
                  High-Precision Frame & Thumbnail Capture
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Use the scrubber and frame-stepping buttons on the player to stop on the exact frame, then capture full-resolution output.
                </p>
              </div>

              {/* Snapshot Format & Quality */}
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Snapshot Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setThumbFormat('jpeg')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition active:scale-[0.98] ${
                        thumbFormat === 'jpeg'
                          ? 'border-zinc-300 bg-zinc-800 text-white'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      JPEG Photo
                    </button>
                    <button
                      onClick={() => setThumbFormat('png')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition active:scale-[0.98] ${
                        thumbFormat === 'png'
                          ? 'border-zinc-300 bg-zinc-800 text-white'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      PNG Lossless
                    </button>
                  </div>
                </div>

                {thumbFormat === 'jpeg' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-zinc-400">
                        Image Quality ({thumbQuality}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={thumbQuality}
                      onChange={(e) => setThumbQuality(Number(e.target.value))}
                      className="w-full accent-white bg-zinc-800 h-2 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Capture Frame Button */}
              <button
                disabled={isCapturing}
                onClick={handleCaptureThumbnail}
                className="w-full py-3.5 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                {isCapturing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                    <span>Capturing Frame...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-zinc-900" />
                    <span>Capture Frame at {currentTime.toFixed(2)}s</span>
                  </>
                )}
              </button>

              {/* Captured Thumbnail Preview & Download */}
              {capturedThumbBlob && thumbUrl && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-750 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">Extracted Snapshot</span>
                    <span className="font-mono text-zinc-100">
                      {(capturedThumbBlob.size / 1024).toFixed(1)} KB ({thumbFormat.toUpperCase()})
                    </span>
                  </div>

                  <img
                    src={thumbUrl}
                    alt="Captured Snapshot"
                    className="w-full h-44 object-cover rounded-lg border border-zinc-800"
                  />

                  <button
                    onClick={handleDownloadThumbnail}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white border border-zinc-700 text-xs font-semibold tracking-wide shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
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
