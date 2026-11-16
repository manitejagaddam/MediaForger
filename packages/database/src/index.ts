import Dexie, { type Table } from 'dexie';
import { ConversionJob, Preset, MediaCategory } from '@mediaforge/shared-types';

export interface StoredFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  category: MediaCategory;
  createdAt: number;
  opfsPath?: string;
}

export interface StoredOutput {
  id: string;
  jobId: string;
  fileName: string;
  format: string;
  sizeBytes: number;
  createdAt: number;
  blob?: Blob;
  opfsPath?: string;
}

export interface ConversionHistoryItem {
  id: string;
  jobId: string;
  fileName: string;
  category: MediaCategory;
  inputFormat: string;
  outputFormat: string;
  inputSizeBytes: number;
  outputSizeBytes: number;
  durationMs: number;
  completedAt: number;
}

export interface StoredSetting {
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface StoredModelCacheEntry {
  modelId: string;
  name: string;
  sizeBytes: number;
  downloadedAt: number;
  precision: 'fp16' | 'fp32';
  cacheKey: string;
}

export class MediaForgeDatabase extends Dexie {
  files!: Table<StoredFile, string>;
  jobs!: Table<ConversionJob, string>;
  outputs!: Table<StoredOutput, string>;
  presets!: Table<Preset, string>;
  history!: Table<ConversionHistoryItem, string>;
  settings!: Table<StoredSetting, string>;
  modelCache!: Table<StoredModelCacheEntry, string>;

  constructor() {
    super('MediaForgeDB');

    this.version(1).stores({
      files: 'id, name, mimeType, category, createdAt',
      jobs: 'id, fileId, status, category, createdAt, completedAt',
      outputs: 'id, jobId, format, createdAt',
      presets: 'id, category, isBuiltIn, createdAt',
      history: 'id, jobId, category, completedAt',
      settings: 'key',
      modelCache: 'modelId, name, downloadedAt',
    });
  }

  /**
   * Cleans up expired temporary files and completed jobs older than retentionDays
   */
  async cleanupOldData(retentionDays = 7): Promise<{ deletedJobs: number; deletedOutputs: number }> {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const oldJobs = await this.jobs.where('createdAt').below(cutoff).toArray();
    const oldJobIds = oldJobs.map((j) => j.id);

    const deletedOutputs = await this.outputs.where('jobId').anyOf(oldJobIds).delete();
    const deletedJobs = await this.jobs.where('createdAt').below(cutoff).delete();

    return { deletedJobs, deletedOutputs };
  }
}

export const db = new MediaForgeDatabase();
