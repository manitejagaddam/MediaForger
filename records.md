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
| **Phase 1** | Project Foundation & Monorepo Scaffold | In Progress | 2026-11-16 | — | Setting up pnpm, packages, types, core engine, db |
| **Phase 2** | Image Studio | Pending | — | — | Native + WASM image conversions, batch, resize, crop |
| **Phase 3** | Audio Studio | Pending | — | — | Web Audio, FFmpeg audio conversions, waveform, trim |
| **Phase 4** | Video Studio | Pending | — | — | FFmpeg WASM + WebCodecs, compression, trim, GIF |
| **Phase 5** | Document & Archive Studio | Pending | — | — | PDF.js, pdf-lib, fflate secure ZIP, CSV/JSON |
| **Phase 6** | AI Studio | Pending | — | — | ONNX Runtime Web, Real-ESRGAN, RMBG-1.4 |
| **Phase 7** | Browser Extension (MV3) | Pending | — | — | Chrome/Edge extension with offscreen doc & context menus |
| **Phase 8** | Production Hardening | Pending | — | — | PWA, offline caching, security audits, release builds |

---

## 3. Step-by-Step Execution Log

* **2026-11-16 18:54**: Project inspected (Node v22.15.1, npm 10.9.2, Windows 11, clean git branch).
* **2026-11-16 18:55**: Initialized governance documentation (`records.md`, `agents.md`, `context.md`, `addons.md`).
* **2026-11-16 18:56**: Installed pnpm globally (v12.21.0), initialized root `.gitignore`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, and root `package.json`. Committed as `6e1dc46`.
* **2026-11-16 19:07**: Implemented and verified build for all 15 shared packages (`@mediaforge/shared-types`, `validators`, `database`, `storage`, `wasm-runtime`, `worker-runtime`, `presets`, `core`, `image-engine`, `audio-engine`, `document-engine`, `archive-engine`, `video-engine`, `ai-engine`, `ui`). 100% build pass with strict TypeScript checks.
* **2026-11-16 19:25**: Implemented and verified full `apps/web` SaaS application (React 19 + Vite 6 + Tailwind CSS + Lucide Icons). Built all 11 pages (Dashboard, Image Studio, Audio Studio, Video Studio, Document Studio, Archive Studio, AI Studio, Batch Processing, History, Settings, Privacy & Specs), Sidebar, and Header. Production build succeeded cleanly (`dist/` generated). Committed as `apps/web`.
