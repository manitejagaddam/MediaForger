# MediaForge — Known Limitations & Browser Constraints

Because MediaForge is strictly local-first and client-side, certain platform constraints apply:

---

## 1. Browser Memory Caps

* Web browsers typically enforce a virtual memory limit of 2 GB to 4 GB per tab on 64-bit platforms.
* Processing 4K/8K uncompressed video streams or images with > 100 megapixels in a single pass can cause memory pressure.
* **Mitigation**: MediaForge monitors memory usage, encourages tiling for ultra-large images, and streams large buffers into the Origin Private File System (OPFS).

---

## 2. Multi-Threading & SharedArrayBuffer

* Multi-threaded WebAssembly (such as multi-threaded FFmpeg) requires `SharedArrayBuffer`, which browsers only enable when the page is served with Cross-Origin Opener Policy (`COOP: same-origin`) and Cross-Origin Embedder Policy (`COEP: require-corp`).
* The Vite dev server and production builds configure these headers. When embedded into third-party iframes where these headers cannot be set, MediaForge gracefully falls back to single-threaded WebAssembly.

---

## 3. WebGPU Availability

* WebGPU provides 10x–20x faster neural inference for ONNX AI models (such as Real-ESRGAN super-resolution) compared to CPU.
* On devices or browsers where WebGPU is not supported (older drivers, software-only WebGL), MediaForge falls back to CPU WebAssembly. CPU inference for 4x upscaling will take longer on older CPUs.

---

## 4. Proprietary Codec Support

* Codecs like Apple HEIC/HEIF or proprietary RAW formats require specialized WebAssembly decoders because standard browser `<canvas>` elements cannot decode them natively.
* MediaForge uses open-source WASM decoders with permissive licenses for these formats.
