import { describe, it, expect } from 'vitest';
import { ArchiveEngine } from '@mediaforge/archive-engine';

describe('ArchiveEngine Security', () => {
  it('creates and extracts a valid zip archive roundtrip', async () => {
    const textEncoder = new TextEncoder();
    const files = [
      { path: 'hello.txt', data: textEncoder.encode('Hello World!') },
      { path: 'nested/test.json', data: textEncoder.encode('{"status":"ok"}') },
    ];

    const zipBlob = await ArchiveEngine.createZip(files);
    expect(zipBlob.size).toBeGreaterThan(0);

    const extracted = await ArchiveEngine.extractZip(zipBlob);
    expect(extracted).toHaveLength(2);

    const helloEntry = extracted.find((e) => e.path === 'hello.txt');
    expect(helloEntry).toBeDefined();

    const decoded = new TextDecoder().decode(helloEntry?.data);
    expect(decoded).toBe('Hello World!');
  });

  it('rejects zip creation with directory traversal paths', async () => {
    const files = [
      { path: '../../evil.sh', data: new Uint8Array([1, 2, 3]) },
    ];

    await expect(ArchiveEngine.createZip(files)).rejects.toThrow(/Insecure archive path/);
  });
});
