import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Play,
  Pause,
  Download,
  Music,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Clock,
  FastForward,
  Rewind,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { AudioEngine, AudioProcessResult } from '@mediaforge/audio-engine';
import { FileInspector, ExportManager } from '@mediaforge/core';
import { AudioProcessingOptions, InspectionResult } from '@mediaforge/shared-types';
import { ObjectUrlManager } from '@mediaforge/storage';
import { db } from '@mediaforge/database';

interface AudioStudioPageProps {
  initialFile?: File | null;
  onClearFile?: () => void;
}

export const AudioStudioPage: React.FC<AudioStudioPageProps> = ({ initialFile, onClearFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [outputResult, setOutputResult] = useState<AudioProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio options
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState<number>(192);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [fadeIn, setFadeIn] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    } else {
      setFile(null);
      setAudioBuffer(null);
      setOutputResult(null);
    }
  }, [initialFile]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setOutputResult(null);

    const inspected = await FileInspector.inspect(selectedFile);
    setInspection(inspected);

    try {
      const buffer = await AudioEngine.decodeAudio(selectedFile);
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      setTrimEnd(Number(buffer.duration.toFixed(2)));
      setChannels(buffer.numberOfChannels > 1 ? 2 : 1);

      const generatedPeaks = AudioEngine.generateWaveformPeaks(buffer, 100);
      setPeaks(generatedPeaks);

      const url = ObjectUrlManager.create(selectedFile);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.volume = isMuted ? 0 : volume;
      }
    } catch (err: any) {
      alert(`Audio decoding error: ${err.message}`);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (timeSec: number) => {
    const clamped = Math.max(0, Math.min(duration, timeSec));
    setCurrentTime(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const skipRelative = (deltaSeconds: number) => {
    if (!audioRef.current) return;
    handleSeek(audioRef.current.currentTime + deltaSeconds);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(ratio * duration);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const executeConversion = async () => {
    if (!audioBuffer || !file) return;

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      const options: AudioProcessingOptions = {
        outputFormat,
        bitrate: outputFormat === 'mp3' ? bitrate : undefined,
        channels,
        trimStartSeconds: trimStart > 0 ? trimStart : undefined,
        trimEndSeconds: trimEnd < audioBuffer.duration ? trimEnd : undefined,
        normalizeVolume,
        fadeInSeconds: fadeIn > 0 ? fadeIn : undefined,
        fadeOutSeconds: fadeOut > 0 ? fadeOut : undefined,
      };

      const result = await AudioEngine.processAudio(audioBuffer, options);
      setOutputResult(result);

      // Save to database
      await db.history.put({
        id: `hist_${Date.now()}`,
        jobId: `job_${Date.now()}`,
        fileName: file.name,
        category: 'audio',
        inputFormat: inspection?.detectedFormat || 'audio',
        outputFormat: result.format,
        inputSizeBytes: file.size,
        outputSizeBytes: result.sizeBytes,
        durationMs: Math.round(performance.now() - startTime),
        completedAt: Date.now(),
      });
    } catch (err: any) {
      alert(`Audio processing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputResult || !file) return;
    const filename = ExportManager.formatOutputFilename(file.name, outputResult.format);
    ExportManager.download(outputResult.blob, filename);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-gray-900/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.ogg,.opus,.m4a,.aac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600/15 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/10 mb-4">
            <Music className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Select an Audio Track to Forge</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
            Supports MP3, WAV, FLAC, OGG, Opus, AAC, M4A. Fast forward, rewind, waveform seek, normalize, trim, and export to MP3 or WAV.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Waveform & Playback Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs uppercase font-mono">
                    {inspection?.detectedFormat || 'AUD'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-sm">{file.name}</h4>
                    <p className="text-[11px] text-gray-400">
                      {duration.toFixed(1)}s • {audioBuffer?.sampleRate} Hz •{' '}
                      {audioBuffer?.numberOfChannels === 1 ? 'Mono' : 'Stereo'} •{' '}
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setAudioBuffer(null);
                    setOutputResult(null);
                    onClearFile?.();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition"
                >
                  Change Audio
                </button>
              </div>

              {/* Waveform Visualizer with Click-To-Seek */}
              <div className="p-6 rounded-xl bg-[#080c14] border border-gray-800/80 space-y-5 select-none">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Interactive Waveform (Click to Seek)</span>
                  <span className="font-mono text-violet-400 font-semibold">
                    {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                  </span>
                </div>

                <div
                  onClick={handleWaveformClick}
                  className="h-28 flex items-center gap-1 cursor-pointer group relative py-2"
                  title="Click to jump to timestamp"
                >
                  {peaks.map((peak, idx) => {
                    const isPlayed = duration > 0 && (idx / peaks.length) * duration <= currentTime;
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-full transition-all duration-75 group-hover:opacity-90"
                        style={{
                          height: `${Math.max(8, peak * 100)}%`,
                          backgroundColor: isPlayed ? '#8B5CF6' : '#374151',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Scrubber Progress Slider */}
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-violet-500 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />

                {/* Player Controls Bar (Rewind, Play/Pause, Fast Forward, Speed, Volume) */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    {/* Rewind 10s */}
                    <button
                      onClick={() => skipRelative(-10)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                      title="Rewind 10 seconds"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {/* Rewind 5s */}
                    <button
                      onClick={() => skipRelative(-5)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                      title="Rewind 5 seconds"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>

                    {/* Play / Pause */}
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 transition cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    {/* Fast Forward 5s */}
                    <button
                      onClick={() => skipRelative(5)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                      title="Fast Forward 5 seconds"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>
                    {/* Fast Forward 10s */}
                    <button
                      onClick={() => skipRelative(10)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                      title="Fast Forward 10 seconds"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400 text-[10px]">Speed:</span>
                    {[0.5, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition ${
                          playbackRate === rate
                            ? 'bg-violet-600 text-white'
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
                      title={isMuted ? 'Unmute' : 'Mute'}
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
                      className="w-20 accent-violet-500 bg-gray-800 h-1.5 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Output Result Card */}
              {outputResult && (
                <div className="p-4 rounded-xl bg-gray-900/90 border border-violet-500/40 flex items-center justify-between text-xs animate-fadeIn">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Conversion Complete ({outputResult.format.toUpperCase()})
                    </span>
                    <div className="text-white font-mono mt-1">
                      Duration: {outputResult.durationSeconds.toFixed(1)}s •{' '}
                      {outputResult.channels === 1 ? 'Mono' : 'Stereo'} • {outputResult.sampleRate} Hz
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-violet-400 font-mono font-bold text-sm">
                      {(outputResult.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {Math.max(
                        0,
                        Math.round(((file.size - outputResult.sizeBytes) / file.size) * 100)
                      )}
                      % Saved
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              {/* Output Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Target Audio Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOutputFormat('mp3')}
                    className={`p-3 rounded-xl border text-left transition ${
                      outputFormat === 'mp3'
                        ? 'border-violet-500 bg-violet-500/10 text-white font-semibold'
                        : 'border-gray-800 bg-gray-900 text-gray-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">MP3</div>
                    <div className="text-[10px] text-gray-400">LAME Encoded Audio</div>
                  </button>
                  <button
                    onClick={() => setOutputFormat('wav')}
                    className={`p-3 rounded-xl border text-left transition ${
                      outputFormat === 'wav'
                        ? 'border-violet-500 bg-violet-500/10 text-white font-semibold'
                        : 'border-gray-800 bg-gray-900 text-gray-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">WAV</div>
                    <div className="text-[10px] text-gray-400">Lossless 16-bit PCM</div>
                  </button>
                </div>
              </div>

              {/* Bitrate Selector for MP3 */}
              {outputFormat === 'mp3' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-gray-400">
                      MP3 Bitrate
                    </span>
                    <span className="font-mono text-violet-400 font-bold">{bitrate} kbps</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[128, 192, 256, 320].map((br) => (
                      <button
                        key={br}
                        onClick={() => setBitrate(br)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-semibold transition ${
                          bitrate === br
                            ? 'border-violet-500 bg-violet-500/15 text-violet-400'
                            : 'border-gray-800 bg-gray-900 text-gray-400'
                        }`}
                      >
                        {br}k
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trimming Controls */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  Trim Audio (Seconds)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Start (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={duration}
                      value={trimStart}
                      onChange={(e) => setTrimStart(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">End (sec)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={duration}
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Channel & Volume Options */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Channels & Dynamics
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setChannels(2)}
                    className={`py-2 rounded-xl border text-xs font-medium transition ${
                      channels === 2
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-gray-800 bg-gray-900 text-gray-400'
                    }`}
                  >
                    Stereo (2 Ch)
                  </button>
                  <button
                    onClick={() => setChannels(1)}
                    className={`py-2 rounded-xl border text-xs font-medium transition ${
                      channels === 1
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-gray-800 bg-gray-900 text-gray-400'
                    }`}
                  >
                    Mono (1 Ch)
                  </button>
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={normalizeVolume}
                    onChange={(e) => setNormalizeVolume(e.target.checked)}
                    className="rounded border-gray-700 text-violet-500"
                  />
                  <span>Normalize Peak Volume to -0.5 dB</span>
                </label>

                {/* Fade in / Fade out */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Fade In (s)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={fadeIn}
                      onChange={(e) => setFadeIn(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Fade Out (s)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={fadeOut}
                      onChange={(e) => setFadeOut(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <button
                  disabled={isProcessing}
                  onClick={executeConversion}
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Encoding to {outputFormat.toUpperCase()}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Convert to {outputFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>

                {outputResult && (
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {outputResult.format.toUpperCase()} ({(outputResult.sizeBytes / 1024).toFixed(1)} KB)</span>
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
