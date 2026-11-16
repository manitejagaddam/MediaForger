# MediaForge — Privacy Manifesto

Privacy in MediaForge is not a policy; it is an architectural guarantee.

---

## 1. Zero-Egress Guarantee

* **No Cloud Conversion APIs**: MediaForge does not communicate with external conversion APIs (CloudConvert, Zamzar, etc.).
* **No Remote File Storage**: Your images, documents, audio tracks, and videos are never uploaded to any remote server or S3 bucket.
* **No Content Telemetry**: File names, file contents, dimensions, durations, and metadata never leave your browser memory.

---

## 2. Permitted Network Connections

The network is used exclusively for:
1. **Initial Application Bundle Loading**: Downloading the static HTML, JS, CSS, and icons of the web application.
2. **Open-Source WASM Binaries**: Fetching open-source WASM runtimes (FFmpeg WASM, jSquash). These are cached locally in CacheStorage for offline execution.
3. **User-Initiated AI Models**: Fetching open-source ONNX neural models only when explicitly triggered by the user in AI Studio.

---

## 3. Local Storage Policy

All persistent data is stored strictly on the user's device:
* **IndexedDB (`MediaForgeDB`)**: Stores conversion history, user presets, and model cache metadata.
* **Origin Private File System (OPFS)**: Stores temporary media buffers during active conversion jobs.
* **Cache Storage**: Stores compiled WebAssembly modules for offline operation.
* **User Control**: Users can inspect storage consumption and purge all stored data with one click from the **Settings** page.

