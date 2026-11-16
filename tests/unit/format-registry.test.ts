import { describe, it, expect } from 'vitest';
import { FormatRegistry } from '@mediaforge/core';

describe('FormatRegistry', () => {
  it('initializes and returns all core formats', () => {
    const formats = FormatRegistry.getAll();
    expect(formats.length).toBeGreaterThan(15);
  });

  it('correctly identifies JPEG format definitions', () => {
    const jpeg = FormatRegistry.get('jpeg');
    expect(jpeg).toBeDefined();
    expect(jpeg?.category).toBe('image');
    expect(jpeg?.extensions).toContain('jpg');
    expect(jpeg?.extensions).toContain('jpeg');
    expect(jpeg?.supportsEncoding).toBe(true);
    expect(jpeg?.supportsDecoding).toBe(true);
    expect(jpeg?.requiredTier).toBe('level1-native');
  });

  it('resolves format by file extension', () => {
    expect(FormatRegistry.findByExtension('.png')?.id).toBe('png');
    expect(FormatRegistry.findByExtension('webp')?.id).toBe('webp');
    expect(FormatRegistry.findByExtension('.mp3')?.id).toBe('mp3');
    expect(FormatRegistry.findByExtension('.wav')?.id).toBe('wav');
    expect(FormatRegistry.findByExtension('mp4')?.id).toBe('mp4');
    expect(FormatRegistry.findByExtension('.pdf')?.id).toBe('pdf');
    expect(FormatRegistry.findByExtension('zip')?.id).toBe('zip');
  });

  it('filters formats by media category', () => {
    const imageFormats = FormatRegistry.getByCategory('image');
    expect(imageFormats.every((f) => f.category === 'image')).toBe(true);
    expect(imageFormats.some((f) => f.id === 'png')).toBe(true);

    const audioFormats = FormatRegistry.getByCategory('audio');
    expect(audioFormats.every((f) => f.category === 'audio')).toBe(true);
    expect(audioFormats.some((f) => f.id === 'wav')).toBe(true);
  });
});
