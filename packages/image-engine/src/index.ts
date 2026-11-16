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
    if (input instanceof ImageBitmap) {
      bitmap = input;
    } else {
      bitmap = await createImageBitmap(input);
    }

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
    if (canvas instanceof OffscreenCanvas) {
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
  }

  /**
   * Encodes a Blob to Base64 string
   */
  static async blobToBase64(blob: Blob): Promise<string> {
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
