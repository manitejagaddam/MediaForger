# MediaForge — Supported Format Matrix

MediaForge separates decoding (reading) and encoding (writing) availability for every media format.

| Format | Category | Extensions | MIME Types | Decode | Encode | Tier | Alpha | Animation | Notes |
|--------|----------|------------|------------|:------:|:------:|------|:-----:|:---------:|-------|
| **JPEG** | Image | `.jpg`, `.jpeg` | `image/jpeg` | ✅ | ✅ | Level 1 Native | ❌ | ❌ | Universal photo format |
| **PNG** | Image | `.png` | `image/png` | ✅ | ✅ | Level 1 Native | ✅ | ❌ | Lossless with full 8-bit alpha |
| **WebP** | Image | `.webp` | `image/webp` | ✅ | ✅ | Level 1 Native | ✅ | ✅ | Modern compressed format |
| **AVIF** | Image | `.avif` | `image/avif` | ✅ | ✅ | Level 2 WASM | ✅ | ❌ | High-efficiency next-gen codec |
| **BMP** | Image | `.bmp` | `image/bmp` | ✅ | ✅ | Level 1 Native | ❌ | ❌ | Uncompressed bitmap |
| **SVG** | Image | `.svg` | `image/svg+xml` | ✅ | ❌ | Level 1 Native | ✅ | ❌ | Vector rasterization to bitmap |
| **GIF** | Image | `.gif` | `image/gif` | ✅ | ✅ | Level 2 WASM | ✅ | ✅ | Animated color-palette image |
| **ICO** | Image | `.ico` | `image/x-icon` | ✅ | ✅ | Level 1 Native | ✅ | ❌ | Multi-size favicon |
| **TIFF** | Image | `.tif`, `.tiff` | `image/tiff` | ✅ | ❌ | Level 2 WASM | ✅ | ❌ | Photography master |
| **HEIC/HEIF** | Image | `.heic`, `.heif` | `image/heic` | ✅ | ❌ | Level 2 WASM | ✅ | ❌ | Apple high efficiency image |
| **WAV** | Audio | `.wav` | `audio/wav` | ✅ | ✅ | Level 1 Native | — | — | 16-bit uncompressed PCM |
| **MP3** | Audio | `.mp3` | `audio/mpeg` | ✅ | ✅ | Level 2 WASM | — | — | Universal lossy audio |
| **FLAC** | Audio | `.flac` | `audio/flac` | ✅ | ✅ | Level 2 WASM | — | — | Lossless compressed audio |
| **OGG** | Audio | `.ogg` | `audio/ogg` | ✅ | ✅ | Level 2 WASM | — | — | OGG Vorbis stream |
| **Opus** | Audio | `.opus` | `audio/opus` | ✅ | ✅ | Level 2 WASM | — | — | Low-latency voice & music |
| **AAC** | Audio | `.aac`, `.m4a` | `audio/aac` | ✅ | ✅ | Level 2 WASM | — | — | MPEG-4 Audio |
| **MP4** | Video | `.mp4`, `.m4v` | `video/mp4` | ✅ | ✅ | Level 2 WASM | — | — | H.264 / AAC container |
| **WebM** | Video | `.webm` | `video/webm` | ✅ | ✅ | Level 2 WASM | ✅ | — | VP8/VP9 / Opus open web container |
| **MKV** | Video | `.mkv` | `video/x-matroska` | ✅ | ✅ | Level 2 WASM | — | — | Matroska multimedia container |
| **CSV** | Document | `.csv` | `text/csv` | ✅ | ✅ | Level 1 Native | — | — | Delimited table data |
| **JSON** | Document | `.json` | `application/json` | ✅ | ✅ | Level 1 Native | — | — | Structured data |
| **TXT** | Document | `.txt` | `text/plain` | ✅ | ✅ | Level 1 Native | — | — | UTF-8 plain text |
| **PDF** | Document | `.pdf` | `application/pdf` | ✅ | ✅ | Level 2 WASM | — | — | Portable Document Format |
| **ZIP** | Archive | `.zip` | `application/zip` | ✅ | ✅ | Level 2 WASM | — | — | Deflate compressed archive |

