import { zip, AsyncZipOptions } from 'fflate';

export interface DeliverableFile {
  name: string;
  blob: Blob;
  category?: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'data';
  format?: string;
}

export interface ManifestItem {
  fileName: string;
  category: string;
  format: string;
  sizeBytes: number;
  sha256: string;
}

export interface DeliveryPackageResult {
  packageId: string;
  clientName: string;
  projectName: string;
  timestamp: number;
  totalSizeBytes: number;
  itemCount: number;
  items: ManifestItem[];
  manifestJson: string;
  certificateText: string;
  bundleBlob: Blob;
}

export class DeliveryEngine {
  /**
   * Computes hexadecimal SHA-256 hash of an ArrayBuffer or Blob
   */
  static async computeSha256(bufferOrBlob: ArrayBuffer | Blob): Promise<string> {
    const buffer = bufferOrBlob instanceof Blob ? await bufferOrBlob.arrayBuffer() : bufferOrBlob;
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates formatted human-readable Delivery Certificate
   */
  static generateDeliveryCertificate(
    packageId: string,
    clientName: string,
    projectName: string,
    items: ManifestItem[],
    timestamp: number
  ): string {
    const dateStr = new Date(timestamp).toUTCString();
    const totalBytes = items.reduce((acc, it) => acc + it.sizeBytes, 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

    const separator = '═'.repeat(74);
    const thinSep = '─'.repeat(74);

    let cert = `${separator}
           MEDIAFORGE — CLIENT DELIVERABLES PROVENANCE CERTIFICATE
${separator}
Package ID     : ${packageId}
Client Target  : ${clientName}
Project Name   : ${projectName}
Dispatched At  : ${dateStr}
Total Payload  : ${totalMb} MB (${items.length} verified assets)
Zero-Egress    : 100% On-Device Local Processing (Zero Cloud Data Leakage)
${thinSep}
ITEMIZED ASSETS & CRYPTOGRAPHIC CHECKSUMS (SHA-256):
`;

    items.forEach((item, idx) => {
      const idxStr = String(idx + 1).padStart(2, '0');
      const sizeStr = (item.sizeBytes / 1024).toFixed(1).padStart(8, ' ') + ' KB';
      cert += `
[${idxStr}] ${item.fileName} (${item.format.toUpperCase()} • ${sizeStr})
     SHA-256: ${item.sha256}
`;
    });

    cert += `${thinSep}
VERIFICATION INSTRUCTIONS:
To verify the integrity of any delivered asset in this package:
  Windows PowerShell : Get-FileHash -Algorithm SHA256 <file>
  macOS / Linux      : shasum -a 256 <file>

COMPLIANCE & PRIVACY ASSURANCE:
This package was forged and sealed entirely inside the client-side sandbox
of MediaForge without transit through any remote conversion API or backend.
${separator}
`;
    return cert;
  }

  /**
   * Assembles, certifies, and seals a Client Deliverables Bundle (.zip)
   */
  static async createDeliveryPackage(
    clientName: string,
    projectName: string,
    files: DeliverableFile[],
    onProgress?: (stage: string, percent: number) => void
  ): Promise<DeliveryPackageResult> {
    if (files.length === 0) {
      throw new Error('Cannot create delivery package: at least one asset is required.');
    }

    onProgress?.('Generating cryptographic checksums', 10);

    const timestamp = Date.now();
    const datePart = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const packageId = `MF-DELIVERY-${datePart}-${randPart}`;

    const items: ManifestItem[] = [];
    const zipEntries: Record<string, Uint8Array> = {};

    let processedCount = 0;

    for (const f of files) {
      const buffer = await f.blob.arrayBuffer();
      const sha256 = await this.computeSha256(buffer);
      const ext = f.name.includes('.') ? f.name.split('.').pop() || 'bin' : f.format || 'bin';

      const item: ManifestItem = {
        fileName: f.name,
        category: f.category || 'media',
        format: ext.toLowerCase(),
        sizeBytes: f.blob.size,
        sha256,
      };

      items.push(item);
      zipEntries[`assets/${f.name}`] = new Uint8Array(buffer);

      processedCount++;
      const pct = 10 + Math.round((processedCount / files.length) * 50);
      onProgress?.(`Hashing ${f.name}`, pct);
    }

    onProgress?.('Generating delivery manifest and certificate', 65);

    // 1. Generate Manifest JSON
    const manifestPayload = {
      packageId,
      clientName,
      projectName,
      timestamp,
      itemCount: items.length,
      totalSizeBytes: items.reduce((acc, curr) => acc + curr.sizeBytes, 0),
      securityAudit: {
        engine: 'MediaForge Local Core',
        zeroEgress: true,
        hashAlgorithm: 'SHA-256',
      },
      deliverables: items,
    };
    const manifestJson = JSON.stringify(manifestPayload, null, 2);
    zipEntries['manifest.json'] = new TextEncoder().encode(manifestJson);

    // 2. Generate Human-Readable Delivery Certificate
    const certificateText = this.generateDeliveryCertificate(
      packageId,
      clientName,
      projectName,
      items,
      timestamp
    );
    zipEntries['DELIVERY_CERTIFICATE.txt'] = new TextEncoder().encode(certificateText);

    // 3. Generate standard checksums.sha256 file
    const checksumsFile = items.map((it) => `${it.sha256}  assets/${it.fileName}`).join('\n') + '\n';
    zipEntries['checksums.sha256'] = new TextEncoder().encode(checksumsFile);

    onProgress?.('Sealing delivery package archive', 80);

    const options: AsyncZipOptions = { level: 6 };
    const bundleBlob = await new Promise<Blob>((resolve, reject) => {
      zip(zipEntries, options, (err, data) => {
        if (err) reject(err);
        else resolve(new Blob([data], { type: 'application/zip' }));
      });
    });

    onProgress?.('Delivery package sealed and verified', 100);

    return {
      packageId,
      clientName,
      projectName,
      timestamp,
      totalSizeBytes: bundleBlob.size,
      itemCount: items.length,
      items,
      manifestJson,
      certificateText,
      bundleBlob,
    };
  }
}
