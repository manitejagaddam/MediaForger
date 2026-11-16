import { DocumentProcessingOptions } from '@mediaforge/shared-types';

export class DocumentEngine {
  /**
   * Converts CSV string to JSON structure
   */
  static csvToJson(csvText: string, delimiter = ','): Record<string, string>[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 1) return [];

    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] !== undefined ? values[j] : '';
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Converts JSON array to CSV string
   */
  static jsonToCsv(jsonArray: Record<string, unknown>[], delimiter = ','): string {
    if (!Array.isArray(jsonArray) || jsonArray.length === 0) return '';

    const headers = Object.keys(jsonArray[0]);
    const lines: string[] = [];

    // Header row
    lines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(delimiter));

    // Data rows
    for (const item of jsonArray) {
      const row = headers.map((header) => {
        const val = item[header];
        if (val === null || val === undefined) return '""';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      lines.push(row.join(delimiter));
    }

    return lines.join('\n');
  }

  /**
   * Processes a document (CSV <-> JSON <-> TXT)
   */
  static async processDocument(blob: Blob, options: DocumentProcessingOptions): Promise<Blob> {
    const text = await blob.text();
    const targetFormat = options.outputFormat.toLowerCase();

    if (targetFormat === 'json') {
      const json = this.csvToJson(text, options.csvDelimiter || ',');
      const jsonString = options.prettyPrintJson ? JSON.stringify(json, null, 2) : JSON.stringify(json);
      return new Blob([jsonString], { type: 'application/json' });
    } else if (targetFormat === 'csv') {
      let parsedJson: Record<string, unknown>[];
      try {
        parsedJson = JSON.parse(text);
      } catch {
        throw new Error('Input file is not valid JSON');
      }
      const csv = this.jsonToCsv(parsedJson, options.csvDelimiter || ',');
      return new Blob([csv], { type: 'text/csv' });
    } else if (targetFormat === 'txt') {
      // Line ending normalization (LF)
      const normalized = text.replace(/\r\n/g, '\n');
      return new Blob([normalized], { type: 'text/plain' });
    }

    throw new Error(`Unsupported document transformation to ${targetFormat}`);
  }
}

