# MediaForge — Browser Extension (Chrome & Edge MV3)

The MediaForge Browser Extension allows users to convert, compress, resize, and copy images directly from any webpage without leaving their active tab.

---

## 1. Extension Architecture

Manifest V3 disallows long-running execution inside background service workers and forbids `new Function` / `eval`.
MediaForge uses an **Offscreen Document** pattern to perform local media processing:

```
[Webpage Image] 
       │
       ▼ (Right-Click Context Menu)
[Background Service Worker (background.js)]
       │
       ▼ (chrome.runtime.sendMessage)
[Offscreen Document (offscreen.html / offscreen.js)]
       │ (Canvas 2D / OffscreenCanvas / ImageEngine)
       ▼
[Converted Blob / Base64 Data URL]
       │
       ▼ (chrome.downloads API)
[User's Downloads Folder]
```

---

## 2. Right-Click Context Menu Actions

When right-clicking any webpage image:
- **Convert to WebP**: Modern compressed format with 80% balanced quality.
- **Convert to PNG**: Lossless image with full transparency.
- **Convert to JPEG**: Universal photo format.
- **Compress Image (Balanced)**: Strips EXIF and applies balanced lossy compression.
- **Copy Image as Base64**: Fetches image and copies clean Data URL directly to clipboard.

---

## 3. How to Load and Test the Extension

1. Build the extension:
   ```bash
   pnpm --filter extension run build
   ```
2. Open Google Chrome or Microsoft Edge.
3. Navigate to `chrome://extensions` or `edge://extensions`.
4. Enable **Developer Mode** (top-right toggle).
5. Click **Load unpacked**.
6. Select the directory:
   `c:\Users\manit\OneDrive\Desktop\Projects\Self\Media Forger\apps\extension\dist`
7. Click the extension icon in your toolbar to open the quick-tools popup!

