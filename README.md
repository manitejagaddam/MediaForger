# MediaForge ⚡

> **Universal, privacy-first, local media processing and conversion platform.**  
> Transcode, compress, resize, edit, and enhance images, audio, video, documents, and archives directly in your browser. Zero cloud uploads. 100% on-device compute.

---

## 🌟 Core Tenets

- 🔒 **100% Privacy & Zero Egress**: Files never leave your device. No cloud conversion APIs, no remote databases, zero data tracking.
- ⚡ **Native Performance**: 3-tier execution model (Level 1 Native Browser APIs → Level 2 WebAssembly → Level 3 ONNX WebGPU).
- 🧩 **Multi-Surface**: Delivered as a complete React 19 web application, an offline PWA, and a Chrome/Edge Manifest V3 extension.
- 🛠️ **Real Computation**: Real conversions, genuine byte compression, real waveform previews, hardware video frame captures, and real magic-byte validation.

---

## 📦 Monorepo Architecture

MediaForge is structured as a pnpm workspace with Turborepo:

- **`apps/web`**: SaaS-quality web application (React 19, Vite 6, Tailwind CSS, Lucide icons, Dexie.js, PWA offline support).
- **`apps/extension`**: Chrome & Edge Manifest V3 extension featuring context menu conversions and offscreen processing.
- **`packages/*`**: 15 shared packages:
  - `@mediaforge/core`: FormatRegistry, FileInspector, CapabilityDetector, ProcessingRouter, JobScheduler, ExportManager.
  - `@mediaforge/image-engine`: Canvas 2D / OffscreenCanvas transcoding (JPEG, PNG, WebP, BMP), compression, resize, crop, rotate, flip, filters, watermark.
  - `@mediaforge/audio-engine`: Web Audio decoding, waveform peak rendering, trim, volume normalization, 16-bit PCM WAV encoder.
  - `@mediaforge/video-engine`: Video metadata inspection, hardware frame & thumbnail extraction.
  - `@mediaforge/document-engine`: In-browser CSV ↔ JSON parsing and TXT line-break normalization.
  - `@mediaforge/archive-engine`: Pure-JS fflate ZIP creation and extraction with zip-slip path traversal and bomb mitigation.
  - `@mediaforge/ai-engine`: ONNX Runtime Web manager, WebGPU/WASM execution provider resolver, neural models registry.
  - `@mediaforge/storage`: OPFS (Origin Private File System) helpers, StorageQuota detector, leak-safe ObjectUrlManager.
  - `@mediaforge/database`: Dexie.js (IndexedDB) schemas for jobs, files, presets, history, and cache.
  - `@mediaforge/validators`: Zod schemas, magic bytes signatures, filename sanitization, archive safety checks.
  - `@mediaforge/presets`: Social media presets (Instagram, YouTube, Twitter), compression profiles.
  - `@mediaforge/shared-types`: Universal TypeScript types, contracts, and enums.
  - `@mediaforge/ui`: Theme tokens, utility classes, and glassmorphism design system.
  - `@mediaforge/wasm-runtime`: Dynamic WASM binary loader with CacheStorage caching.
  - `@mediaforge/worker-runtime`: Web Worker pool and transferable ArrayBuffer messaging.

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js `v20+` or `v22+`
- pnpm `v10+` or `v12+` (Install globally: `npm install -g pnpm`)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Automated Test Suite
```bash
pnpm vitest run
```

### 3. Start Web Application in Dev Mode
```bash
pnpm --filter web run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build All Packages and Apps for Production
```bash
# Build all shared packages
pnpm -r run build

# Build Web App for production (outputs to apps/web/dist)
pnpm --filter web run build

# Build Browser Extension for production (outputs to apps/extension/dist)
pnpm --filter extension run build
```

---

## 🔌 Installing the Browser Extension (Chrome & Edge)

1. Build the extension:
   ```bash
   pnpm --filter extension run build
   ```
2. Open Chrome or Edge and navigate to `chrome://extensions` or `edge://extensions`.
3. Toggle **Developer mode** ON (top right).
4. Click **Load unpacked** and select the folder:
   `apps/extension/dist`
5. Right-click any image on the web to convert it instantly to WebP, PNG, or JPEG, or click the toolbar icon to use the quick-tools popup!

---

## 📄 Documentation

- [Architecture Guide](docs/architecture.md)
- [Format Support Matrix](docs/format-support.md)
- [Security & Threat Defense](docs/security.md)
- [Privacy Manifesto](docs/privacy.md)
- [Extension Guide](docs/extension.md)
- [Known Limitations](docs/known-limitations.md)

---

## ⚖️ License

Open source under the [MIT License](LICENSE).
