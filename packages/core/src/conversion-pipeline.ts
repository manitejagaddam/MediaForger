import { ConversionJob, ProcessingOptions, MediaCategory } from '@mediaforge/shared-types';
import { sanitizeFilename } from '@mediaforge/validators';
import { FileInspector } from './file-inspector';
import { FormatRegistry } from './format-registry';
import { ProcessingRouter } from './processing-router';
import { JobScheduler } from './job-scheduler';

export interface CreateJobParams {
  file: File | Blob;
  fileName?: string;
  outputFormat: string;
  options?: ProcessingOptions;
}

export class ConversionPipeline {
  /**
   * Creates, validates, and initializes a standard ConversionJob
   */
  static async createJob(params: CreateJobParams): Promise<ConversionJob> {
    const { file, outputFormat, options = { outputFormat } } = params;
    const rawFileName = params.fileName || (file instanceof File ? file.name : 'media_file');
    const fileName = sanitizeFilename(rawFileName);

    // 1. Inspect input
    const inspection = await FileInspector.inspect(file, fileName);
    const inputFormat = inspection.detectedFormat;
    const category: MediaCategory = inspection.category;

    // 2. Validate output format
    const outputDef = FormatRegistry.get(outputFormat);
    if (!outputDef) {
      throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    // 3. Resolve execution tier
    const tier = ProcessingRouter.resolveTier(category, inputFormat, outputFormat, options);

    // 4. Construct job object
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const job: ConversionJob = {
      id: jobId,
      fileId: `file_${jobId}`,
      fileName,
      inputFormat,
      outputFormat,
      category,
      tier,
      options,
      status: 'created',
      progress: 0,
      createdAt: Date.now(),
      inputSizeBytes: file.size,
    };

    return job;
  }

  /**
   * Submits a job to the scheduler
   */
  static async submitJob(job: ConversionJob): Promise<ConversionJob> {
    return await JobScheduler.enqueue(job);
  }
}
