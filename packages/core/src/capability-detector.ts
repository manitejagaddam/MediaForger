import { SystemCapabilities } from '@mediaforge/shared-types';

export class CapabilityDetector {
  private static cachedCapabilities: SystemCapabilities | null = null;

  static async detect(): Promise<SystemCapabilities> {
    if (this.cachedCapabilities) return this.cachedCapabilities;

    const isBrowser = typeof window !== 'undefined';
    const isNav = typeof navigator !== 'undefined';

    const webCodecs = isBrowser && 'VideoEncoder' in window && 'VideoDecoder' in window;
    const sharedArrayBuffer = isBrowser && typeof SharedArrayBuffer !== 'undefined' && Boolean(window.crossOriginIsolated);
    const webGPU = isNav && 'gpu' in navigator && Boolean((navigator as any).gpu);
    const opfs = isNav && 'storage' in navigator && 'getDirectory' in navigator.storage;
    const hardwareConcurrency = isNav ? navigator.hardwareConcurrency || 4 : 4;

    let storageQuotaBytes: number | undefined;
    let storageUsageBytes: number | undefined;

    if (isNav && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        storageQuotaBytes = estimate.quota;
        storageUsageBytes = estimate.usage;
      } catch {
        // Ignored
      }
    }

    const estimatedMemoryBytes = isNav && 'deviceMemory' in navigator
      ? ((navigator as any).deviceMemory as number) * 1024 * 1024 * 1024
      : undefined;

    this.cachedCapabilities = {
      webCodecs,
      sharedArrayBuffer,
      webGPU,
      opfs,
      hardwareConcurrency,
      estimatedMemoryBytes,
      storageQuotaBytes,
      storageUsageBytes,
    };

    return this.cachedCapabilities;
  }
}

