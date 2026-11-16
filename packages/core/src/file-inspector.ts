import { InspectionResult } from '@mediaforge/shared-types';
import { verifyMagicBytes } from '@mediaforge/validators';
import { FormatRegistry } from './format-registry';

export class FileInspector {
  /**
   * Inspects a File or Blob, detects real MIME type and format via magic bytes,
   * and extracts media metadata where possible.
   */
  static async inspect(file: File | Blob, originalFileName?: string): Promise<InspectionResult> {
    const sizeBytes = file.size;
    const fileName = originalFileName || (file instanceof File ? file.name : 'media_file');
    const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';

    // Read first 32 bytes for magic byte sniffing
    const headerBuffer = await file.slice(0, 32).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);

    let detectedFormat = 'unknown';
    let magicBytesVerified = false;

    // Check against format registry
    const candidateFormat = FormatRegistry.findByExtension(extension);
    if (candidateFormat && verifyMagicBytes(headerBytes, candidateFormat.id)) {
      detectedFormat = candidateFormat.id;
      magicBytesVerified = true;
    } else {
      // Brute-force sniff known formats
      const allFormats = FormatRegistry.getAll();
      for (const fmt of allFormats) {
        if (verifyMagicBytes(headerBytes, fmt.id)) {
          detectedFormat = fmt.id;
          magicBytesVerified = true;
          break;
        }
      }
    }

    // Fallback if not matched by magic bytes (e.g. text/csv/json/svg which don't have binary headers)
    if (detectedFormat === 'unknown') {
      if (candidateFormat) {
        detectedFormat = candidateFormat.id;
      } else if (file.type) {
        const byMime = FormatRegistry.findByMimeType(file.type);
        if (byMime) detectedFormat = byMime.id;
      }
    }

    const formatDef = FormatRegistry.get(detectedFormat);
    const category = formatDef?.category || 'image';
    const mimeType = formatDef?.mimeTypes[0] || file.type || 'application/octet-stream';

    const result: InspectionResult = {
      detectedFormat,
      mimeType,
      extension: extension || formatDef?.extensions[0] || '',
      sizeBytes,
      magicBytesVerified,
      category,
    };

    // Extract basic dimensions for images if in browser environment
    if (category === 'image' && typeof createImageBitmap !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(file);
        result.width = bitmap.width;
        result.height = bitmap.height;
        bitmap.close();
      } catch {
        // SVG or unsupported codec in createImageBitmap
      }
    }

    return result;
  }
}
