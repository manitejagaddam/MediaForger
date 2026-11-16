import { describe, it, expect } from 'vitest';
import { AudioEngine } from '@mediaforge/audio-engine';

describe('AudioEngine Encoding', () => {
  // Synthesize a 1-second 440 Hz test tone
  function createSyntheticAudioBuffer(sampleRate = 44100, duration = 1.0, channels = 2): AudioBuffer {
    const length = Math.floor(sampleRate * duration);
    const channelArrays: Float32Array[] = [];

    for (let c = 0; c < channels; c++) {
      const data = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        // 440 Hz sine wave
        data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
      }
      channelArrays.push(data);
    }

    return {
      numberOfChannels: channels,
      sampleRate,
      duration,
      length,
      getChannelData: (ch: number) => channelArrays[ch],
    } as unknown as AudioBuffer;
  }

  it('encodes genuine WAV with RIFF header', () => {
    const buffer = createSyntheticAudioBuffer(44100, 0.5, 2);
    const wavBlob = AudioEngine.encodeWav(buffer);

    expect(wavBlob.type).toBe('audio/wav');
    expect(wavBlob.size).toBeGreaterThan(44);
  });

  it('encodes genuine MP3 with LAME encoder', () => {
    const buffer = createSyntheticAudioBuffer(44100, 0.5, 2);
    const mp3Blob = AudioEngine.encodeMp3(buffer, 192);

    expect(mp3Blob.type).toBe('audio/mpeg');
    expect(mp3Blob.size).toBeGreaterThan(100);
  });
});
