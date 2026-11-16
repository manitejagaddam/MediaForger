# MediaForge — Add-ons, Engines & Models Registry (addons.md)

This document tracks all pluggable engines, WebAssembly codecs, AI model weights, presets, and extension modules used in MediaForge.

---

## 1. Engine & Codec Registry

| Codec / Engine | Category | Technology | Source / Package | License | Tier |
|----------------|----------|------------|------------------|---------|------|
| **Canvas 2D / Offscreen** | Image | Browser Native | Native browser runtime | Built-in | Level 1 |
| **WebCodecs** | Video/Audio | Browser Native | Native browser runtime | Built-in | Level 1 |
| **Web Audio API** | Audio | Browser Native | Native browser runtime | Built-in | Level 1 |
| **LAME MP3 Encoder** | Audio | Pure JS / WASM | `@breezystack/lamejs` | LGPL-3.0 | Level 2 |
| **jSquash AVIF** | Image | WebAssembly | `@jsquash/avif` | Apache-2.0 | Level 2 |
| **jSquash WebP** | Image | WebAssembly | `@jsquash/webp` | Apache-2.0 | Level 2 |
| **jSquash JPEG** | Image | WebAssembly | `@jsquash/jpeg` | Apache-2.0 | Level 2 |
| **jSquash PNG** | Image | WebAssembly | `@jsquash/png` | Apache-2.0 | Level 2 |
| **FFmpeg WASM** | Audio/Video | WebAssembly | `@ffmpeg/ffmpeg` + `@ffmpeg/util` | LGPL / MIT wrapper | Level 2 |
| **pdf-lib** | Documents | TypeScript / JS | `pdf-lib` | MIT | Level 2 |
| **PDF.js** | Documents | WebAssembly / JS | `pdfjs-dist` | Apache-2.0 | Level 2 |
| **fflate** | Archives | JavaScript / Uint8Array | `fflate` | MIT | Level 2 |
| **IS-Net / U2Net ONNX Engine** | Background Removal | ONNX WebGPU / WASM | `@imgly/background-removal` | MIT | Level 3 |
| **ONNX Runtime Web** | AI Inference | WebGPU / WASM SIMD | `onnxruntime-web` | MIT | Level 3 |

---

## 2. Local AI Model Registry

All AI models run 100% locally on-device via ONNX Runtime Web. Models are downloaded on-demand only when requested by the user and cached in IndexedDB/CacheStorage.

| Model Name | Task | Framework | Precision | Size | Source | License |
|------------|------|-----------|-----------|------|--------|---------|
| **Real-ESRGAN x2** | Super-Resolution | ONNX | FP16/FP32 | ~16 MB | HuggingFace / OpenSource | BSD-3-Clause |
| **Real-ESRGAN x4** | Super-Resolution | ONNX | FP16/FP32 | ~32 MB | HuggingFace / OpenSource | BSD-3-Clause |
| **RMBG-1.4 / IS-Net** | Background Removal | ONNX | FP32 | ~40 MB | BRIA AI / Xuebin Qin | Open-source research / Apache-2.0 |
| **Fast-Enhance** | Bilateral filter / Tone map | Custom WebGL / WASM | — | < 1 MB | MediaForge Native Engine | MIT |

---

## 3. Presets Catalog

### Image Presets
* **Web Balanced**: WebP format, 80% quality, max width 1920px.
* **Maximum Compression**: AVIF/WebP, 60% quality, stripped EXIF.
* **Lossless Archival**: PNG format, Level 9 compression, preserved color profile.
* **Social Media Dimensions**:
  * Instagram Square: 1080 × 1080
  * Instagram Story / Reel: 1080 × 1920
  * Twitter / X Post: 1200 × 675
  * YouTube Thumbnail: 1280 × 720
  * Favicon Bundle: 16x16, 32x32, 48x48, 64x64, 128x128 `.ico`

### Audio Presets
* **High-Fidelity Audio**: MP3 320 kbps, 44.1 kHz, Stereo
* **Podcast Voice**: MP3 96 kbps, 44.1 kHz, Mono (Voice normalized)
* **Mobile / Web Streaming**: Opus 64 kbps, 48 kHz
* **Studio Master Archive**: FLAC 24-bit, 96 kHz

### Video Presets
* **Web Optimized HD**: MP4 (H.264 / AAC), 1080p, CRF 22, faststart flag
* **Ultra Compressed Mobile**: MP4, 720p, CRF 28, 30 FPS
* **High Quality GIF**: 480p, 15 FPS, Floyd-Steinberg dithering with optimized palette
* **Audio-Only Extraction**: MP3 192 kbps extracted directly from video stream

