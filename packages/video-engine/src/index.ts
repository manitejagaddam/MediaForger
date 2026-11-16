export interface VideoMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export class VideoEngine {
  /**
   * Inspects video file metadata using an offscreen HTMLVideoElement
   */
  static async inspectVideo(blob: Blob): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const durationSeconds = video.duration;
        const aspectRatio = height > 0 ? width / height : 1.777;

        URL.revokeObjectURL(url);
        resolve({
          width,
          height,
          durationSeconds,
          aspectRatio,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = url;
    });
  }

  /**
   * Captures a single video frame at timestamp as a high-quality JPEG/PNG image Blob
   */
  static async captureThumbnail(
    blob: Blob,
    timeSeconds = 1.0,
    format: 'jpeg' | 'png' = 'jpeg',
    quality = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(Math.max(0, timeSeconds), video.duration);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to get 2D canvas context'));
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (result) => {
              URL.revokeObjectURL(url);
              if (result) resolve(result);
              else reject(new Error('Failed to capture frame'));
            },
            `image/${format}`,
            quality
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Video playback error during frame capture'));
      };

      video.src = url;
    });
  }
}
