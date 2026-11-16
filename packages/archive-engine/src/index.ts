import { zip, unzip, AsyncZipOptions } from 'fflate';
import { isSafeArchivePath } from '@mediaforge/validators';

export interface ArchiveFileEntry {
  path: string;
  data: Uint8Array;
}

export interface ArchiveMetadata {
  fileCount: number;
  totalCompressedSize: number;
  totalUncompressedSize: number;
  files: { path: string; size: number }[];
}

export class ArchiveEngine {
  private static MAX_FILES = 10000;
  private static MAX_TOTAL_DECOMPRESSED_BYTES = 1024 * 1024 * 1024; // 1 GB safety cap
  private static MAX_EXPANSION_RATIO = 100; // Archive bomb guard

  /**
   * Creates a ZIP archive from multiple file entries
   */
  static async createZip(
    files: ArchiveFileEntry[],
    compressionLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 = 6
  ): Promise<Blob> {
    const zipData: Record<string, Uint8Array> = {};

    for (const file of files) {
      if (!isSafeArchivePath(file.path)) {
        throw new Error(`Insecure archive path rejected: ${file.path}`);
      }
      zipData[file.path] = file.data;
    }

    const options: AsyncZipOptions = { level: compressionLevel };

    return new Promise((resolve, reject) => {
      zip(zipData, options, (err, data) => {
        if (err) reject(err);
        else resolve(new Blob([data], { type: 'application/zip' }));
      });
    });
  }

  /**
   * Extracts a ZIP archive safely with archive bomb and path traversal checks
   */
  static async extractZip(archiveBlob: Blob): Promise<ArchiveFileEntry[]> {
    const buffer = new Uint8Array(await archiveBlob.arrayBuffer());

    return new Promise((resolve, reject) => {
      unzip(buffer, (err, unzipped) => {
        if (err) {
          reject(new Error(`Failed to extract ZIP: ${err.message}`));
          return;
        }

        const entries: ArchiveFileEntry[] = [];
        let totalSize = 0;
        const fileNames = Object.keys(unzipped);

        if (fileNames.length > this.MAX_FILES) {
          reject(new Error(`Archive contains too many files (${fileNames.length} > ${this.MAX_FILES})`));
          return;
        }

        for (const path of fileNames) {
          if (!isSafeArchivePath(path)) {
            reject(new Error(`Zip-slip security violation: illegal path "${path}"`));
            return;
          }

          const fileBytes = unzipped[path];
          totalSize += fileBytes.length;

          if (totalSize > this.MAX_TOTAL_DECOMPRESSED_BYTES) {
            reject(new Error('Archive exceeds maximum decompressed size limit (1 GB)'));
            return;
          }

          entries.push({
            path,
            data: fileBytes,
          });
        }

        // Bomb check
        if (archiveBlob.size > 0 && totalSize / archiveBlob.size > this.MAX_EXPANSION_RATIO) {
          reject(new Error('Potential zip bomb detected: expansion ratio exceeds safe limit'));
          return;
        }

        resolve(entries);
      });
    });
  }
}
