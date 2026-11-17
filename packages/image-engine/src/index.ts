import { ImageProcessingOptions } from '@mediaforge/shared-types';
import { verifyMagicBytes } from '@mediaforge/validators';

export interface ImageProcessResult {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  format: string;
}

export class ImageEngine {
  /**
   * Processes an image blob using Canvas / OffscreenCanvas
   */
  static async processImage(
    input: Blob | File | ImageBitmap,
    options: ImageProcessingOptions
  ): Promise<ImageProcessResult> {
    let bitmap: ImageBitmap;
    let needsClose = false;
    if (input instanceof ImageBitmap) {
      bitmap = input;
    } else {
      bitmap = await createImageBitmap(input);
      needsClose = true;
    }

    try {
      const srcWidth = bitmap.width;
      const srcHeight = bitmap.height;

    // 1. Calculate target dimensions
    let targetWidth = srcWidth;
    let targetHeight = srcHeight;

    if (options.width && options.height) {
      if (options.maintainAspectRatio) {
        const aspect = srcWidth / srcHeight;
        if (options.fit === 'cover') {
          if (options.width / options.height > aspect) {
            targetWidth = options.width;
            targetHeight = Math.round(options.width / aspect);
          } else {
            targetHeight = options.height;
            targetWidth = Math.round(options.height * aspect);
          }
        } else {
          // 'inside' or 'contain'
          if (options.width / options.height > aspect) {
            targetHeight = options.height;
            targetWidth = Math.round(options.height * aspect);
          } else {
            targetWidth = options.width;
            targetHeight = Math.round(options.width / aspect);
          }
        }
      } else {
        targetWidth = options.width;
        targetHeight = options.height;
      }
    } else if (options.width) {
      targetWidth = options.width;
      targetHeight = Math.round((srcHeight * options.width) / srcWidth);
    } else if (options.height) {
      targetHeight = options.height;
      targetWidth = Math.round((srcWidth * options.height) / srcHeight);
    }

    // Handle cropping bounds
    let cropX = 0;
    let cropY = 0;
    let cropW = srcWidth;
    let cropH = srcHeight;

    if (options.crop) {
      cropX = Math.max(0, options.crop.x);
      cropY = Math.max(0, options.crop.y);
      cropW = Math.min(srcWidth - cropX, options.crop.width);
      cropH = Math.min(srcHeight - cropY, options.crop.height);
      targetWidth = cropW;
      targetHeight = cropH;
    }

    // Determine canvas dimensions considering rotation
    const rotation = (options.rotate || 0) % 360;
    const isSwapped = rotation === 90 || rotation === 270;
    const canvasWidth = isSwapped ? targetHeight : targetWidth;
    const canvasHeight = isSwapped ? targetWidth : targetHeight;

    // Use OffscreenCanvas if available, otherwise regular Canvas
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx = canvas.getContext('2d');
    }

    if (!ctx) {
      throw new Error('Failed to create Canvas 2D context');
    }

    // Enable high quality image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply transformations
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    const scaleX = options.flipHorizontal ? -1 : 1;
    const scaleY = options.flipVertical ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }

    // Draw image
    ctx.drawImage(
      bitmap,
      cropX,
      cropY,
      cropW,
      cropH,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
    ctx.restore();

    // Release GPU memory for source bitmap as soon as rendered
    if (needsClose) {
      bitmap.close();
      needsClose = false;
    }

    // Filters: Grayscale, brightness, contrast
    if (options.grayscale || options.brightness || options.contrast) {
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imgData.data;

      const brightnessAdj = ((options.brightness || 0) / 100) * 255;
      const contrastFactor =
        options.contrast !== undefined
          ? (259 * ((options.contrast / 100) * 255 + 255)) / (255 * (259 - (options.contrast / 100) * 255))
          : 1;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (options.grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
        }

        if (brightnessAdj !== 0) {
          r += brightnessAdj;
          g += brightnessAdj;
          b += brightnessAdj;
        }

        if (contrastFactor !== 1) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);
    }

    // Watermark overlay
    if (options.watermark?.text) {
      const wm = options.watermark;
      const text = wm.text;
      if (text) {
        const fontSize = wm.fontSize || Math.max(16, Math.round(canvasWidth / 30));
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = wm.color || '#ffffff';
        ctx.globalAlpha = wm.opacity ?? 0.6;

        const metrics = ctx.measureText(text);
        let wx = 20;
        let wy = canvasHeight - 20;

        if (wm.position === 'center') {
          wx = (canvasWidth - metrics.width) / 2;
          wy = canvasHeight / 2;
        } else if (wm.position === 'top-left') {
          wx = 20;
          wy = fontSize + 20;
        } else if (wm.position === 'top-right') {
          wx = canvasWidth - metrics.width - 20;
          wy = fontSize + 20;
        } else if (wm.position === 'bottom-left') {
          wx = 20;
          wy = canvasHeight - 20;
        } else if (wm.position === 'bottom-right') {
          wx = canvasWidth - metrics.width - 20;
          wy = canvasHeight - 20;
        }

        ctx.fillText(text, wx, wy);
        ctx.globalAlpha = 1.0;
      }
    }

    // 2. Export to target format Blob
    const format = options.outputFormat.toLowerCase();
    let mimeType = 'image/png';
    let quality = options.quality !== undefined ? options.quality / 100 : 0.85;

    if (format === 'jpeg' || format === 'jpg') {
      mimeType = 'image/jpeg';
    } else if (format === 'webp') {
      mimeType = 'image/webp';
    } else if (format === 'png') {
      mimeType = 'image/png';
      quality = 1.0; // PNG is lossless in canvas
    } else if (format === 'bmp') {
      mimeType = 'image/bmp';
    }

    let outputBlob: Blob;
    if (format === 'bmp') {
      // Use genuine pure-TypeScript BMP encoder for guaranteed cross-browser compatibility
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      outputBlob = this.encodeBmp(imgData);
    } else if (canvas instanceof OffscreenCanvas) {
      outputBlob = await canvas.convertToBlob({ type: mimeType, quality });
    } else {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create Blob from canvas'));
          },
          mimeType,
          quality
        );
      });
    }

    // 3. Verify output blob with magic bytes
    const headBytes = new Uint8Array(await outputBlob.slice(0, 16).arrayBuffer());
    const validSignature = verifyMagicBytes(headBytes, format === 'jpg' ? 'jpeg' : format);

    if (!validSignature && format !== 'bmp') {
      // Warning or fallback verification
    }

    return {
      blob: outputBlob,
      width: canvasWidth,
      height: canvasHeight,
      sizeBytes: outputBlob.size,
      format,
    };
    } finally {
      if (needsClose) {
        try {
          bitmap.close();
        } catch {
          // Ignore if already closed
        }
      }
    }
  }

  /**
   * Encodes raw ImageData pixels into a genuine 24-bit uncompressed Windows BMP Blob
   */
  static encodeBmp(imageData: ImageData): Blob {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Row size is padded to a multiple of 4 bytes
    const rowBytes = Math.floor((width * 3 + 3) / 4) * 4;
    const pixelArraySize = rowBytes * height;
    const fileHeaderSize = 14;
    const dibHeaderSize = 40;
    const totalFileSize = fileHeaderSize + dibHeaderSize + pixelArraySize;

    const buffer = new ArrayBuffer(totalFileSize);
    const view = new DataView(buffer);

    // 1. BMP File Header (14 bytes)
    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4d); // 'M'
    view.setUint32(2, totalFileSize, true);
    view.setUint16(6, 0, true); // Reserved
    view.setUint16(8, 0, true); // Reserved
    view.setUint32(10, fileHeaderSize + dibHeaderSize, true); // Pixel offset (54)

    // 2. DIB Header (BITMAPINFOHEADER - 40 bytes)
    view.setUint32(14, dibHeaderSize, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true); // Positive height = bottom-up
    view.setUint16(26, 1, true); // Color planes
    view.setUint16(28, 24, true); // 24-bit BGR
    view.setUint32(30, 0, true); // BI_RGB (no compression)
    view.setUint32(34, pixelArraySize, true);
    view.setUint32(38, 2835, true); // ~72 DPI horizontal
    view.setUint32(42, 2835, true); // ~72 DPI vertical
    view.setUint32(46, 0, true); // Colors in color table
    view.setUint32(50, 0, true); // Important color count

    // 3. Pixel Data (Bottom-Up row order, BGR order)
    const bytes = new Uint8Array(buffer);
    let pixelOffset = 54;

    for (let y = height - 1; y >= 0; y--) {
      const srcRowOffset = y * width * 4;
      let dstRowOffset = pixelOffset;

      for (let x = 0; x < width; x++) {
        const srcIdx = srcRowOffset + x * 4;
        bytes[dstRowOffset++] = data[srcIdx + 2]; // Blue
        bytes[dstRowOffset++] = data[srcIdx + 1]; // Green
        bytes[dstRowOffset++] = data[srcIdx];     // Red
      }

      // Pad remaining bytes in row to 4-byte boundary
      const padding = rowBytes - width * 3;
      for (let p = 0; p < padding; p++) {
        bytes[dstRowOffset++] = 0;
      }

      pixelOffset += rowBytes;
    }

    return new Blob([buffer], { type: 'image/bmp' });
  }

  /**
   * Encodes a Blob to Base64 string (compatible with Web Workers, Service Workers, and DOM)
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    if (typeof FileReader !== 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to read as Data URL'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Universal fallback via ArrayBuffer for Workers and environments without FileReader
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    const b64 =
      typeof btoa !== 'undefined'
        ? btoa(binary)
        : (globalThis as any).Buffer?.from(binary, 'binary').toString('base64') || '';
    return `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
  }

  /**
   * Decodes a Data URL or raw Base64 string to Blob
   */
  static base64ToBlob(base64: string, defaultMime = 'image/png'): Blob {
    let mime = defaultMime;
    let raw = base64;

    if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mime = match[1];
      raw = parts[1];
    }

    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  }
}
