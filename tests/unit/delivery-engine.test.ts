import { describe, it, expect } from 'vitest';
import { DeliveryEngine, DeliverableFile } from '@mediaforge/core';

describe('DeliveryEngine Client Deliverables Packaging', () => {
  it('computes accurate SHA-256 hexadecimal hash', async () => {
    const textData = new TextEncoder().encode('MediaForge Test Deliverable');
    const hash = await DeliveryEngine.computeSha256(textData.buffer);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates a valid client delivery package with certificate and manifest', async () => {
    const file1: DeliverableFile = {
      name: 'hero_poster.webp',
      blob: new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00])], { type: 'image/webp' }),
      category: 'image',
      format: 'webp',
    };

    const file2: DeliverableFile = {
      name: 'soundtrack.mp3',
      blob: new Blob([new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00])], { type: 'audio/mp3' }),
      category: 'audio',
      format: 'mp3',
    };

    const result = await DeliveryEngine.createDeliveryPackage(
      'Acme Studios',
      'Summer Campaign 2026',
      [file1, file2]
    );

    expect(result.packageId).toMatch(/^MF-DELIVERY-/);
    expect(result.clientName).toBe('Acme Studios');
    expect(result.projectName).toBe('Summer Campaign 2026');
    expect(result.itemCount).toBe(2);
    expect(result.bundleBlob.size).toBeGreaterThan(0);
    expect(result.bundleBlob.type).toBe('application/zip');

    // Verify manifest contents
    const parsedManifest = JSON.parse(result.manifestJson);
    expect(parsedManifest.packageId).toBe(result.packageId);
    expect(parsedManifest.deliverables.length).toBe(2);
    expect(parsedManifest.deliverables[0].fileName).toBe('hero_poster.webp');
    expect(parsedManifest.deliverables[0].sha256).toHaveLength(64);

    // Verify certificate text
    expect(result.certificateText).toContain('MEDIAFORGE — CLIENT DELIVERABLES PROVENANCE CERTIFICATE');
    expect(result.certificateText).toContain('Acme Studios');
    expect(result.certificateText).toContain('SHA-256');
  });

  it('throws error when attempting to seal empty delivery package', async () => {
    await expect(
      DeliveryEngine.createDeliveryPackage('Acme', 'Empty Project', [])
    ).rejects.toThrow('at least one asset is required');
  });
});
