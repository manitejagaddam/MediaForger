/**
 * @mediaforge/storage
 * Memory management, OPFS integration, Cache Storage, and Leak-safe Object URLs
 */

export class ObjectUrlManager {
  private static urls = new Set<string>();

  /**
   * Creates an object URL and registers it for lifecycle management
   */
  static create(blob: Blob | MediaSource): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  /**
   * Revokes a specific registered object URL
   */
  static revoke(url: string): void {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  /**
   * Revokes all registered object URLs to prevent leaks
   */
  static revokeAll(): void {
    for (const url of this.urls) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }

  static getActiveCount(): number {
    return this.urls.size;
  }
}

/**
 * Storage quota inspector
 */
export async function getStorageQuota(): Promise<{
  quotaBytes: number;
  usageBytes: number;
  percentUsed: number;
  isPersistent: boolean;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const quotaBytes = estimate.quota || 0;
    const usageBytes = estimate.usage || 0;
    const percentUsed = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0;
    const isPersistent = navigator.storage.persisted ? await navigator.storage.persisted() : false;

    return {
      quotaBytes,
      usageBytes,
      percentUsed,
      isPersistent,
    };
  }

  return {
    quotaBytes: 0,
    usageBytes: 0,
    percentUsed: 0,
    isPersistent: false,
  };
}

/**
 * OPFS (Origin Private File System) Manager
 */
export class OpfsStorage {
  private static async getRoot(): Promise<FileSystemDirectoryHandle | null> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage) {
      return await navigator.storage.getDirectory();
    }
    return null;
  }

  /**
   * Writes buffer to a file in OPFS
   */
  static async writeFile(path: string, data: ArrayBuffer | Uint8Array): Promise<boolean> {
    try {
      const root = await this.getRoot();
      if (!root) return false;

      const fileHandle = await root.getFileHandle(path, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data as any);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads a file from OPFS as an ArrayBuffer
   */
  static async readFile(path: string): Promise<ArrayBuffer | null> {
    try {
      const root = await this.getRoot();
      if (!root) return null;

      const fileHandle = await root.getFileHandle(path);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch {
      return null;
    }
  }

  /**
   * Deletes a file from OPFS
   */
  static async deleteFile(path: string): Promise<boolean> {
    try {
      const root = await this.getRoot();
      if (!root) return false;

      await root.removeEntry(path);
      return true;
    } catch {
      return false;
    }
  }
}
