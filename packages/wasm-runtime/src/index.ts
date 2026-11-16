/**
 * @mediaforge/wasm-runtime
 * Dynamic WASM loader, caching, and execution verification
 */

export interface WasmModuleMetadata {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  expectedHash?: string;
  category: 'image' | 'audio' | 'video' | 'document' | 'ai';
}

export class WasmRuntimeManager {
  private static cacheName = 'mediaforge-wasm-cache-v1';
  private static loadedModules = new Map<string, WebAssembly.Module>();

  /**
   * Fetches or loads a WASM binary from CacheStorage
   */
  static async fetchBinary(url: string): Promise<ArrayBuffer> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(this.cacheName);
      const cached = await cache.match(url);
      if (cached) {
        return await cached.arrayBuffer();
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download WASM binary: ${response.statusText} (${url})`);
      }

      await cache.put(url, response.clone());
      return await response.arrayBuffer();
    }

    const response = await fetch(url);
    return await response.arrayBuffer();
  }

  /**
   * Instantiates a WASM module from cache or network
   */
  static async loadModule(
    id: string,
    url: string,
    imports: WebAssembly.Imports = {}
  ): Promise<WebAssembly.Instance> {
    let module = this.loadedModules.get(id);

    if (!module) {
      const buffer = await this.fetchBinary(url);
      module = await WebAssembly.compile(buffer);
      this.loadedModules.set(id, module);
    }

    return await WebAssembly.instantiate(module, imports);
  }

  /**
   * Checks whether a WASM binary is already cached locally
   */
  static async isCached(url: string): Promise<boolean> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open(this.cacheName);
      const matched = await cache.match(url);
      return Boolean(matched);
    }
    return false;
  }

  /**
   * Clears the WASM cache
   */
  static async clearCache(): Promise<boolean> {
    this.loadedModules.clear();
    if (typeof window !== 'undefined' && 'caches' in window) {
      return await caches.delete(this.cacheName);
    }
    return false;
  }
}
