import { AudioProcessingOptions } from '@mediaforge/shared-types';

export interface AudioProcessResult {
  blob: Blob;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  sizeBytes: number;
}

export class AudioEngine {
  /**
   * Decodes an audio blob into an AudioBuffer using offline audio context
   */
  static async decodeAudio(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    // OfflineAudioContext can decode without hardware requirements
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
      return await audioCtx.decodeAudioData(arrayBuffer);
    } finally {
      if (audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    }
  }

  /**
   * Generates peak data for waveform rendering
   */
  static generateWaveformPeaks(buffer: AudioBuffer, numPeaks = 100): number[] {
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / numPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }

    return peaks;
  }

  /**
   * Processes audio buffer (trim, normalize, channel adjust, fade) and encodes as WAV
   */
  static async processToWav(
    buffer: AudioBuffer,
    options: AudioProcessingOptions
  ): Promise<AudioProcessResult> {
    const originalRate = buffer.sampleRate;
    const targetChannels = options.channels || (buffer.numberOfChannels > 1 ? 2 : 1);

    const startSec = Math.max(0, options.trimStartSeconds || 0);
    const endSec = Math.min(buffer.duration, options.trimEndSeconds || buffer.duration);
    const duration = Math.max(0.1, endSec - startSec);

    const startSample = Math.floor(startSec * originalRate);
    const endSample = Math.floor(endSec * originalRate);
    const numSamples = endSample - startSample;

    // Render into OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(targetChannels, numSamples, originalRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Gain node for normalization / fade
    const gainNode = offlineCtx.createGain();

    if (options.fadeInSeconds && options.fadeInSeconds > 0) {
      gainNode.gain.setValueAtTime(0, 0);
      gainNode.gain.linearRampToValueAtTime(1, Math.min(duration, options.fadeInSeconds));
    }

    if (options.fadeOutSeconds && options.fadeOutSeconds > 0) {
      const fadeStart = Math.max(0, duration - options.fadeOutSeconds);
      gainNode.gain.setValueAtTime(1, fadeStart);
      gainNode.gain.linearRampToValueAtTime(0, duration);
    }

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    source.start(0, startSec, duration);

    const rendered = await offlineCtx.startRendering();

    // Volume normalization if requested
    if (options.normalizeVolume) {
      let maxPeak = 0;
      for (let c = 0; c < rendered.numberOfChannels; c++) {
        const data = rendered.getChannelData(c);
        for (let i = 0; i < data.length; i++) {
          const val = Math.abs(data[i]);
          if (val > maxPeak) maxPeak = val;
        }
      }
      if (maxPeak > 0 && maxPeak < 0.95) {
        const factor = 0.95 / maxPeak;
        for (let c = 0; c < rendered.numberOfChannels; c++) {
          const data = rendered.getChannelData(c);
          for (let i = 0; i < data.length; i++) {
            data[i] *= factor;
          }
        }
      }
    }

    // Encode to 16-bit PCM WAV
    const wavBlob = this.encodeWav(rendered);

    return {
      blob: wavBlob,
      durationSeconds: rendered.duration,
      sampleRate: rendered.sampleRate,
      channels: rendered.numberOfChannels,
      sizeBytes: wavBlob.size,
    };
  }

  /**
   * Encodes an AudioBuffer into a RIFF/WAVE 16-bit PCM Blob
   */
  private static encodeWav(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const numSamples = audioBuffer.length;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataByteCount = numSamples * blockAlign;
    const bufferLength = 44 + dataByteCount;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataByteCount, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataByteCount, true);

    // Write interleaved 16-bit PCM samples
    let offset = 44;
    const channelData: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channelData.push(audioBuffer.getChannelData(c));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channelData[c][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
