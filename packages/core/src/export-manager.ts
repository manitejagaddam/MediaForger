import { ObjectUrlManager } from '@mediaforge/storage';
import { sanitizeFilename } from '@mediaforge/validators';

export class ExportManager {
  /**
   * Downloads a single blob as a file with a sanitized filename
   */
  static download(blob: Blob, filename: string): void {
    const cleanName = sanitizeFilename(filename);
    const url = ObjectUrlManager.create(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      ObjectUrlManager.revoke(url);
    }, 1000);
  }

  /**
   * Generates a suitable download filename based on original name and target format
   */
  static formatOutputFilename(originalName: string, targetFormat: string): string {
    const base = originalName.replace(/\.[^/.]+$/, '');
    const cleanBase = sanitizeFilename(base);
    return `${cleanBase}.${targetFormat.toLowerCase()}`;
  }
}

