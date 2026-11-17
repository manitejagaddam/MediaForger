import { DocumentProcessingOptions } from '@mediaforge/shared-types';

export class DocumentEngine {
  /**
   * Tokenizes a CSV line respecting quoted strings and escaped quotes ("")
   */
  private static parseCsvLine(line: string, delimiter = ','): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote: "" -> "
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    fields.push(current.trim());
    return fields;
  }

  /**
   * Converts CSV string to JSON structure
   */
  static csvToJson(csvText: string, delimiter = ','): Record<string, string>[] {
    const trimmed = csvText.trim();
    if (!trimmed) return [];

    const lines = trimmed.split(/\r?\n/);
    if (lines.length < 1) return [];

    const headers = this.parseCsvLine(lines[0], delimiter);
    const result: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = this.parseCsvLine(lines[i], delimiter);
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] !== undefined ? values[j] : '';
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Converts JSON array or object to CSV string
   */
  static jsonToCsv(jsonInput: unknown, delimiter = ','): string {
    let jsonArray: Record<string, unknown>[] = [];

    if (Array.isArray(jsonInput)) {
      jsonArray = jsonInput.filter((item) => typeof item === 'object' && item !== null) as Record<string, unknown>[];
    } else if (typeof jsonInput === 'object' && jsonInput !== null) {
      // Check if it has a property containing an array of records (e.g. { data: [...] } or { users: [...] })
      const record = jsonInput as Record<string, unknown>;
      let foundArray = false;
      for (const key of Object.keys(record)) {
        const val = record[key];
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
          jsonArray = val.filter((it) => typeof it === 'object' && it !== null);
          foundArray = true;
          break;
        }
      }
      if (!foundArray) {
        // Single object -> wrap in array
        jsonArray = [record];
      }
    }

    if (jsonArray.length === 0) return '';

    // Collect all unique headers across all records
    const headerSet = new Set<string>();
    for (const item of jsonArray) {
      for (const key of Object.keys(item)) {
        headerSet.add(key);
      }
    }
    const headers = Array.from(headerSet);
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
      let parsedJson: unknown;
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

