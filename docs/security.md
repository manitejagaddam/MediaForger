# MediaForge — Security Architecture & Threat Defense

MediaForge processes untrusted user-supplied files. Security validation is enforced at every layer of the system.

---

## 1. Magic Byte Sniffing & File Validation

Never rely on client-supplied file extensions or MIME types.
Every incoming file has its first 32 bytes inspected by `FileInspector` using `verifyMagicBytes`:
- **JPEG**: `FF D8 FF`
- **PNG**: `89 50 4E 47 0D 0A 1A 0A`
- **GIF**: `47 49 46 38 37 61` (GIF87a) or `47 49 46 38 39 61` (GIF89a)
- **WebP**: `52 49 46 46` ... `57 45 42 50` (RIFF...WEBP)
- **PDF**: `25 50 44 46` (%PDF)
- **ZIP**: `50 4B 03 04` (PK..)
- **WAV**: `52 49 46 46` ... `57 41 56 45` (RIFF...WAVE)
- **FLAC**: `66 4C 61 43` (fLaC)

Any mismatch between the header signature and declared format is flagged immediately.

---

## 2. Filename Sanitization & Path Traversal Guards

User filenames are treated as untrusted data:
1. `sanitizeFilename`:
   - Strips directory traversal prefixes (`../`, `..\`)
   - Removes ASCII control characters (`0x00–0x1F`, `0x80–0x9F`)
   - Strips Windows and POSIX reserved characters (`<>:"/\|?*`)
   - Strips leading dots and trailing whitespace
   - Falls back to `mediaforge_output` if empty
2. `isSafeArchivePath` (Zip-Slip Mitigation):
   - Every file path extracted from a ZIP is inspected
   - Absolute paths (starting with `/` or drive letter `C:`) are blocked
   - Normalized path segments are checked; any entry containing `..` throws an immediate security exception

---

## 3. Archive Bomb Mitigation

To prevent denial-of-service via decompression bombs:
1. **File Count Cap**: Maximum 10,000 files per archive.
2. **Decompressed Size Cap**: Strict 1 GB maximum aggregate uncompressed size.
3. **Expansion Ratio Limit**: Expansion ratio between compressed and uncompressed bytes cannot exceed 100:1.

---

## 4. Memory Leak Prevention & Object URL Registry

Browsers can leak memory when creating `URL.createObjectURL(blob)` without explicit cleanup.
MediaForge routes all object URL lifecycles through `ObjectUrlManager`:
- Tracks active object URLs in an internal `Set`
- Explicit revocation via `ObjectUrlManager.revoke(url)`
- Bulk cleanup via `ObjectUrlManager.revokeAll()` during route transitions and component unmounts
