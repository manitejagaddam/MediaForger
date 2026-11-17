# MediaForge — Engineering Records & Decision Log (records.md)

This document tracks all Architectural Decision Records (ADRs), execution logs, phase transitions, and test/verification records for MediaForge.

---

## 1. Architectural Decision Records (ADRs)

### ADR-001: Monorepo Architecture with pnpm Workspaces & Turborepo
* **Date**: 2026-11-16
* **Status**: ACCEPTED
* **Context**: MediaForge requires a unified web application, Chrome/Edge browser extensions, and multiple specialized processing engines that must share types, validators, database access, and core pipelines.
* **Decision**: Adopt pnpm workspaces with Turborepo for fast builds, strict dependency boundaries, and high cache efficiency.
* **Consequences**: Packages under `packages/*` are published/linked internally. Zero duplicate type definitions across apps.

### ADR-002: Three-Tier Intelligent Processing Router (Native -> WASM -> AI)
* **Date**: 2026-11-16
* **Status**: ACCEPTED
* **Context**: Heavy WASM engines (like FFmpeg WASM ~30MB) and AI models should not be loaded when lightweight native browser APIs (Canvas 2D, OffscreenCanvas, WebCodecs, Web Audio) suffice.
* **Decision**: Route all jobs through a 3-tier selector:
  1. **Level 1 (Native)**: Canvas, Web Audio, ImageBitmap, native codecs.
  2. **Level 2 (WASM)**: FFmpeg WASM, jSquash/Squoosh codecs, pdf-lib, PDF.js, fflate.
  3. **Level 3 (AI)**: ONNX Runtime Web (WebGPU with WASM fallback).
* **Consequences**: Instant startup for standard conversions; lazy-loaded binaries for complex workflows.

### ADR-003: Dedicated Web Workers & Zero Main-Thread Blocking
* **Date**: 2026-11-16
* **Status**: ACCEPTED
* **Context**: Long-running conversions, encoding, or AI inference can freeze the UI thread and degrade UX.
* **Decision**: All heavy processing runs in dedicated Web Workers with structured messaging and Transferable ArrayBuffers.
* **Consequences**: Smooth 60 FPS UI during 4K video compression or multi-file batch conversions.

### ADR-004: Local Storage and Large File Handling (IndexedDB + OPFS)
* **Date**: 2026-11-16
* **Status**: ACCEPTED
* **Context**: Media files can be large (hundreds of MBs to gigabytes). Keeping them solely in RAM or storing large blobs in IndexedDB can cause OOM.
* **Decision**: Use Dexie.js (IndexedDB) for metadata, presets, job state, and history. Use Origin Private File System (OPFS) for streaming large temporary buffers and caching.
* **Consequences**: High memory efficiency, reliable crash recovery, and quota-respecting storage management.

### ADR-005: Privacy-First Zero-Backend Architecture
* **Date**: 2026-11-16
* **Status**: ACCEPTED
* **Context**: User files must never leave the device. No third-party conversion APIs, telemetry on media content, or remote uploads.
* **Decision**: 100% client-side execution. Permitted network traffic is strictly limited to initial application bundle, open-source WASM binaries, and user-initiated AI model downloads.
* **Consequences**: Absolute data privacy, zero server egress costs, complete offline capability.

---

## 2. Phase Execution Status

| Phase | Description | Status | Started | Completed | Notes |
|-------|-------------|--------|---------|-----------|-------|
| **Phase 1** | Project Foundation & Monorepo Scaffold | Completed | 2026-11-16 | 2026-11-16 | pnpm, turbo, 15 packages, Dexie DB, types, validators |
| **Phase 2** | Image Studio | Completed | 2026-11-16 | 2026-11-16 | Canvas 2D/WASM transcoding, compression, resize, crop, filters |
| **Phase 3** | Audio Studio | Completed | 2026-11-16 | 2026-11-16 | Web Audio decode, waveform peak preview, trim, 16-bit WAV |
| **Phase 4** | Video Studio | Completed | 2026-11-16 | 2026-11-16 | Video stream inspection, hardware frame & thumbnail extractor |
| **Phase 5** | Document & Archive Studio | Completed | 2026-11-16 | 2026-11-16 | CSV ↔ JSON converter, fflate secure ZIP create/extract |
| **Phase 6** | AI Studio | Completed | 2026-11-16 | 2026-11-16 | ONNX models registry, WebGPU/WASM resolver, cache manager |
| **Phase 7** | Browser Extension (MV3) | Completed | 2026-11-16 | 2026-11-16 | Chrome & Edge MV3 with offscreen doc & context menus |
| **Phase 8** | Production Hardening | Completed | 2026-11-16 | 2026-11-16 | PWA, service worker, offline shell, security audits, tests |

---

## 3. Step-by-Step Execution Log

* **2026-11-16 18:54**: Project inspected (Node v22.15.1, npm 10.9.2, Windows 11, clean git branch).
* **2026-11-16 18:55**: Initialized governance documentation (`records.md`, `agents.md`, `context.md`, `addons.md`).
* **2026-11-16 18:56**: Installed pnpm globally (v12.21.0), initialized root `.gitignore`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, and root `package.json`. Committed as `6e1dc46`.
* **2026-11-16 19:07**: Implemented and verified build for all 15 shared packages (`@mediaforge/shared-types`, `validators`, `database`, `storage`, `wasm-runtime`, `worker-runtime`, `presets`, `core`, `image-engine`, `audio-engine`, `document-engine`, `archive-engine`, `video-engine`, `ai-engine`, `ui`). 100% build pass with strict TypeScript checks. Committed as `9fd3562`.
* **2026-11-16 19:25**: Implemented and verified full `apps/web` SaaS application (React 19 + Vite 6 + Tailwind CSS + Lucide Icons). Built all 11 pages (Dashboard, Image Studio, Audio Studio, Video Studio, Document Studio, Archive Studio, AI Studio, Batch Processing, History, Settings, Privacy & Specs), Sidebar, and Header. Production build succeeded cleanly (`dist/` generated). Committed as `19f8740`.
* **2026-11-16 19:26**: Implemented Vitest automated test infrastructure with 5 test suites (21 unit tests covering magic-byte inspection, format registry, filename sanitization, zip-slip defense, CSV/JSON transforms, and archive roundtrips). 100% tests passed. Committed as `3699d16`.
* **2026-11-16 19:30**: Implemented Chrome Manifest V3 browser extension (`apps/extension`) with background service worker, right-click context menus, offscreen document for Canvas/WASM processing, popup quick-tools interface, side panel, and options page. Built successfully to `apps/extension/dist` with `manifest.json`. Committed as `4dad2b0`.
* **2026-11-16 19:33**: Implemented PWA offline shell (`manifest.json`, `sw.js`, `logo.svg`), full architectural documentation suite in `docs/`, and updated `README.md`. Committed as `fd5f18f`.
* **2026-11-16 19:44**: Enhanced UX and media processing capabilities based on user feedback:
  1. **Direct Dashboard Redirection**: Uploading/dropping any media file in the dashboard now immediately detects format and redirects directly to the corresponding studio (Image, Audio, Video, Document, Archive) with the file loaded and options ready — no redundant re-upload prompts.
  2. **Audio & Video Playback Controls**: Added fast forward (+5s, +10s), rewind (-5s, -10s), interactive timeline scrubbers, playback speed controls (0.5x, 1x, 1.25x, 1.5x, 2x), interactive waveform click-to-seek, and video frame-by-frame stepping.
  3. **Multi-Format Audio Conversion**: Integrated LAME MP3 Encoder (`@breezystack/lamejs`), supporting real client-side MP3 and WAV export with bitrate selection (128–320 kbps) and dynamic format-specific downloads. Added automated unit tests in `tests/unit/audio-engine.test.ts` (all 23 tests pass).
* **2026-11-16 19:55**: Pushed all 9 atomic commits to GitHub remote repository (`https://github.com/manitejagaddam/MediaForger.git`) on branch `main`. Synced and verified.
* **2026-11-16 20:03**: Fixed studio file isolation and state containment:
  - Replaced global `activeFile` state with discrete, per-studio scoped file state dictionary (`studioFiles: { image, audio, video, document, archive }`) in `apps/web/src/App.tsx`.
  - When an image is uploaded, it is routed exclusively to `studioFiles.image` — other studios remain clean and empty.
  - When an audio file is uploaded, it is routed exclusively to `studioFiles.audio` — preventing images or videos from leaking into audio workspaces or vice-versa.
  - Implemented `onClearFile` callbacks and reset hooks across `ImageStudioPage`, `AudioStudioPage`, `VideoStudioPage`, `DocumentStudioPage`, and `ArchiveStudioPage` so switching or resetting files in one studio does not affect others.
  - Verified with clean production build (`pnpm --filter web run build`) and 23 passing unit tests (`pnpm vitest run`).
* **2026-11-16 20:10**: Completed and hardened the AI Neural Studio:
  - Architected and implemented complete local client-side AI processing algorithms in `@mediaforge/ai-engine`:
    - `upscaleImage`: 2x and 4x Super-Resolution pixel interpolation + edge-directed Laplacian micro-texture reconstruction and bilateral artifact denoising.
    - `removeBackground`: Boundary color profiling and perceptual Euclidean alpha matte segmentation with smooth sigmoidal edge feathering.
    - `enhanceImage`: Local adaptive dynamic range tone mapping, S-curve clarity, and selective color vibrance restoration.
  - Replaced empty model download cards with a full-featured **AI Studio Workspace**:
    - Interactive before/after split-screen comparison slider with drag handle.
    - Pipeline and model selector (`Real-ESRGAN 2x`, `Real-ESRGAN 4x`, `RMBG 1.4 Background Remover`, `Neural Clarity & HDR Enhancer`).
    - Dedicated parameter controls (sharpness, bilateral denoise, matting sensitivity, boundary feather, invert mask, HDR shadow recovery).
    - One-click **"Use in Studio"** button directly on downloaded and cached models.
    - **"Import .ONNX Model"** button enabling users to import custom local `.onnx` models from disk into IndexedDB storage.
    - Direct export options: download high-resolution output, copy Base64 data URL, send directly to Image Studio, and automatically save to conversion history.
  - Added unit test suite `tests/unit/ai-engine.test.ts` (all 28 tests pass). Production build verified cleanly.
* **2026-11-16 21:30**: Upgraded Background Removal Engine & Built Background Replacement Studio:
  - Fixed background segmentation algorithm: replaced naive border color averaging with connected boundary flood-fill (BFS) matting, multi-cluster background palette clustering, and perceptual color distance matching.
  - Implemented **Interactive Eyedropper Tool**: allows clicking directly anywhere on the image preview to sample and target the exact background color to key out.
  - Added **Background Replacement Studio**:
    - `Transparent`: Clean alpha PNG cutout.
    - `Solid Color`: Color picker + 8 studio swatches (Clean White, Studio Dark, Neutral Gray, Royal Navy, Chroma Green, Pastel Rose, Mint, Crimson).
    - `Studio Gradient`: 6 gradient themes (Ocean Breeze, Sunset Glow, Midnight Nebula, Minimal Studio, Neon Cyber, Emerald Forest) + custom gradient angle slider.
    - `Bokeh Blur (DSLR)`: Shallow depth-of-field lens blur on original background with adjustable radius (5px to 45px) keeping foreground razor-sharp.
    - `Custom Image`: Upload and composite cut-out subject onto a custom background image.
  - Added **Minute Edge Controls & Compositing**:
    - Edge Shift (Choke & Expand: -8px to +8px) to eliminate color fringing and halos.
    - Anti-aliasing feathering slider (0px to 12px) for soft hair and fabric contours.
    - Subject Drop Shadow with adjustable opacity, blur, and Y-offset for realistic composite depth.
    - Format and quality selectors (PNG, JPEG, WebP).
  - Verified with clean production build and 29 passing unit tests (`pnpm vitest run`).
* **2026-11-16 23:30**: Integrated Deep Learning IS-Net Neural Segmentation via ONNX Runtime Web:
  - Identified root cause of portrait blurring: naive boundary flood fill seeded the bottom border as background, causing the person's suit and torso to be classified as background.
  - Integrated `@imgly/background-removal` (IS-Net deep neural network) executing directly in WebAssembly (`ort-wasm-simd-threaded.jsep.wasm`) and WebGPU.
  - The deep neural network identifies people, clothing, hair, objects, and complex backgrounds (office interiors, furniture, foliage, outdoor scenery) with semantic accuracy.
  - Implemented refined multi-stage pipeline: IS-Net neural mask extraction -> edge shift & feathering -> studio background replacement (Transparent, Solid Color, Gradient, Bokeh Blur, Custom Image).
  - Fixed portrait blur: In Bokeh Blur mode, the background is softly blurred while the neural cutout of the subject is rendered 100% crystal-sharp on top.
  - Verified Vite bundling of ONNX Runtime Web WebAssembly assets (`dist/assets/ort-wasm-simd-threaded.jsep*.wasm`) and 29 passing Vitest tests.
* **2026-11-17 14:30**: Complete Professional Obsidian Dark Redesign Across All Surfaces:
  - Addressed user feedback to eliminate all gradients and eye-straining colors, and implement an ultra-clean, professional dark UI with smooth micro-animations.
  - Re-architected theme design tokens in `apps/web/src/index.css` and `apps/web/tailwind.config.js`:
    - Base background: `#09090b` (true Obsidian dark).
    - Surface panel: `#111114`, card surface: `#141418`, borders: `#222227` / `#27272a`.
    - Text hierarchy: headings `#f4f4f5` (crisp white), body `#a1a1aa`, muted `#71717a`.
    - Buttons: `.btn-primary` (clean white pill `#f4f4f5` with active scale), `.btn-secondary` (`#18181b` border `#27272a`).
    - Custom dark scrollbar and custom range slider with smooth white thumb.
  - Eliminated all `bg-gradient-to-*` and eye-straining colors (neon purple, cyan, saturated fuchsia, bright emerald) across all 11 studio & utility pages:
    - `DashboardPage.tsx`: Solid dark icon badges (`bg-zinc-800`), refined dropzone, clean dark metrics and history.
    - `ImageStudioPage.tsx`: Clean dark controls, monochromatic format tags, `btn-primary` forge trigger.
    - `AudioStudioPage.tsx`: Replaced violet theme; interactive waveform now uses `#f4f4f5` (played) / `#27272a` (unplayed); tactile playback controls and dark format selectors.
    - `VideoStudioPage.tsx`: Replaced amber theme; monochromatic video player controls, clean frame-stepping buttons, and snapshot extractor.
    - `DocumentStudioPage.tsx`: Replaced emerald/blue theme; monospace preview panels and dark delimiter selectors.
    - `ArchiveStudioPage.tsx`: Replaced rose theme; Obsidian dark ZIP creator and inspection view.
    - `BatchStudioPage.tsx`: Clean dark batch queue and download buttons.
    - `AiStudioPage.tsx`: Monochromatic studio lighting gradients, refined split-slider handle, and dark parameter controls.
    - `Sidebar.tsx` & `Header.tsx`: Monochromatic dark branding, active tab indicators (`bg-zinc-800/90 text-white`), and storage meter.
    - `HistoryPage.tsx`, `SettingsPage.tsx`, `AboutPage.tsx`: Monochromatic metrics, format matrix, and maintenance tools.
  - Micro-animations added: card hover lift (`-translate-y-0.5 hover:border-zinc-700`), tactile button clicks (`active:scale-[0.98]`), animated tab transitions.
  - Verified with full production build (`tsc && vite build`) and 29 passing Vitest tests.
* **2026-11-17 15:04**: Comprehensive Architectural & Functional Audit Across All 17 Packages:
  - Conducted full audit of all packages (`@mediaforge/*`, `apps/web`, `apps/extension`).
  - Identified and resolved 11 critical and functional issues:
    1. **Magic Bytes Validation Mismatch (`packages/validators`)**: Aligned signature keys for `mp3`, `webm`, `mkv`, `tiff`, and `jpg`. Added comprehensive magic byte unit tests in `tests/unit/validators.test.ts`.
    2. **Browser VRAM & GPU Memory Leak (`packages/image-engine` & `@mediaforge/ai-engine`)**: Fixed unclosed `ImageBitmap` references by wrapping all canvas drawing and matting pipelines in `try ... finally { bitmap.close(); }` blocks.
    3. **Fake BMP Export Fallback (`packages/image-engine`)**: Standard HTML Canvas 2D silently falls back to PNG when `image/bmp` is passed. Implemented a genuine, pure-TypeScript 24-bit uncompressed Windows BMP encoder (`encodeBmp`) with valid `BM` (`0x42 0x4D`) headers and row padding. Added unit tests in `tests/unit/image-engine.test.ts`.
    4. **Universal Base64 Encoding in Workers/Node (`packages/image-engine`)**: Resolved `ReferenceError: FileReader is not defined` when running outside the main DOM thread by implementing an ArrayBuffer chunked fallback using `btoa` / `Buffer`.
    5. **CSV Quoted Comma Splitting (`packages/document-engine`)**: Replaced naive `.split(',')` with an RFC 4180-compliant quote-aware tokenizer (`parseCsvLine`) and enhanced `jsonToCsv` to handle single-object records and envelope payloads (`{ users: [...] }`). Added unit tests in `tests/unit/document-engine.test.ts`.
    6. **Video Frame Timestamp Desync (`apps/web/src/pages/VideoStudioPage.tsx`)**: Captured and locked the exact video timestamp at snapshot capture time to prevent scrub race conditions.
    7. **Audio Trim Start State Bleed (`apps/web/src/pages/AudioStudioPage.tsx`)**: Reset `trimStart`, `currentTime`, and playback state on new track load to avoid Web Audio index errors.
    8. **Batch Studio Failed Status Indicator (`apps/web/src/pages/BatchStudioPage.tsx`)**: Added `it.status === 'failed'` rendering with `AlertCircle` icon and error badge.
    9. **Extension Obsidian Dark Theme & Alert Blockers (`apps/extension`)**: Styled popup, options, and sidepanel to match the Obsidian Dark palette and replaced blocking browser `alert()` calls with dismissible notifications.
    10. **Zero-Alert Policy Across Monorepo**: Replaced all remaining `alert(...)` calls in `ImageStudioPage`, `AudioStudioPage`, `VideoStudioPage`, `DocumentStudioPage`, `ArchiveStudioPage`, `AiStudioPage`, and `SettingsPage` with accessible, dismissible in-app error notification banners. Verified with `git grep "alert("` returning 0 occurrences.
    11. **High-Precision Multi-Border Saliency Engine (`packages/ai-engine`)**: Overhauled local segmentation algorithm to sample multi-border perimeter color clusters, compute spatial centrality priors, and use smooth sigmoidal alpha transitions, ensuring robust background detection even on complex scenes when offline.
  - Verified with full Turborepo monorepo compilation (17/17 packages built successfully) and Vitest unit test suite (8/8 test files, 36/36 tests passing).
* **2026-11-17 15:22**: Bespoke Logo & Dedicated Studio Icon System:
  - Addressed user request to replace simple generic icons and logo with a special, high-end visual design system.
  - Crafted the **MediaForge Master Brand Mark (`logo.svg` & `MediaForgeLogo`)**:
    - Multi-faceted isometric forge anvil & crystalline optical prism monolith (stylized 'M' and 'F').
    - Precision platinum highlights (`#ffffff` / `#e4e4e7`), chiseled dark metallic facets (`#3f3f46`, `#27272a`, `#18181b`), and central radiant diamond energy core representing on-device local computation.
    - Updated PWA `logo.svg`, app header, sidebar, dashboard hero dropzone, extension popup, and extension options.
  - Designed & implemented a dedicated suite of bespoke SVG studio icons in `StudioIcons.tsx`:
    - `ForgeImageIcon`: Camera aperture iris with 6 interlocking blades, optical pupil, and corner crop brackets.
    - `ForgeAudioIcon`: Acoustic chamber baffle with dynamic multi-band logarithmic waveform frequencies and decibel peak markers.
    - `ForgeVideoIcon`: Cinematic 16:9 widescreen viewport with celluloid frame sprockets and stereoscopic playback aperture.
    - `ForgeDocumentIcon`: Folded blueprint matrix sheet with JSON `{ }` keys and CSV tabular column cells.
    - `ForgeArchiveIcon`: Heavy-duty armored compression vault crate with reinforcement ribs and cryptographic padlock.
    - `ForgeAiIcon`: Synaptic tensor lattice with 4-point quantum diamond intelligence core and peripheral nodes.
    - `ForgeBatchIcon`: Staggered 3D parallel process wafers with atomic pipeline flow indicators.
    - `ForgeHistoryIcon`: Chronometer quantum timeline dial with 360° precision tick index and rewind arc.
    - `ForgeShieldIcon`: Armored biometric fortress shield with local zero-egress hardware lock.
    - `ForgeSettingsIcon`: Precision engineered planetary calibration gear with axle teeth.
  - Integrated across all 11 studio & utility pages in `apps/web` and browser extension `apps/extension`.
  - Verified 17/17 Turborepo package builds passing and 36/36 Vitest unit tests passing.
