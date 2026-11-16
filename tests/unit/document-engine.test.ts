import { describe, it, expect } from 'vitest';
import { DocumentEngine } from '@mediaforge/document-engine';

describe('DocumentEngine', () => {
  it('converts CSV text to structured JSON objects', () => {
    const csv = `id,name,role\n1,Alice,Engineer\n2,Bob,Architect`;
    const json = DocumentEngine.csvToJson(csv);

    expect(json).toHaveLength(2);
    expect(json[0]).toEqual({ id: '1', name: 'Alice', role: 'Engineer' });
    expect(json[1]).toEqual({ id: '2', name: 'Bob', role: 'Architect' });
  });

  it('converts JSON objects to CSV string', () => {
    const json = [
      { name: 'John Doe', age: 30, city: 'New York' },
      { name: 'Jane Smith', age: 25, city: 'London' },
    ];
    const csv = DocumentEngine.jsonToCsv(json);

    expect(csv).toContain('"name","age","city"');
    expect(csv).toContain('"John Doe","30","New York"');
    expect(csv).toContain('"Jane Smith","25","London"');
  });

  it('handles custom CSV delimiters', () => {
    const tsv = `id\tname\tscore\n101\tDelta\t98.5`;
    const json = DocumentEngine.csvToJson(tsv, '\t');

    expect(json).toHaveLength(1);
    expect(json[0].name).toBe('Delta');
    expect(json[0].score).toBe('98.5');
  });
});
