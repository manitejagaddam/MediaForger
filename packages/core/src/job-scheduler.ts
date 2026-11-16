import { ConversionJob } from '@mediaforge/shared-types';
import { db } from '@mediaforge/database';

export type JobSubscriber = (job: ConversionJob) => void;

export class JobScheduler {
  private static queue: ConversionJob[] = [];
  private static running = new Map<string, ConversionJob>();
  private static subscribers = new Set<JobSubscriber>();
  private static maxConcurrent = 3;
  private static isProcessingLoop = false;

  static setMaxConcurrent(limit: number): void {
    this.maxConcurrent = Math.max(1, limit);
  }

  static subscribe(fn: JobSubscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private static notify(job: ConversionJob): void {
    for (const sub of this.subscribers) {
      try {
        sub({ ...job });
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Enqueues a new conversion job
   */
  static async enqueue(job: ConversionJob): Promise<ConversionJob> {
    job.status = 'queued';
    job.progress = 0;
    this.queue.push(job);
    await db.jobs.put(job);
    this.notify(job);

    this.processNext();
    return job;
  }

  /**
   * Updates an in-flight job's progress
   */
  static updateProgress(jobId: string, progress: number, stage?: string): void {
    const job = this.running.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.progress = Math.min(1.0, Math.max(0.0, progress));
    if (stage) job.currentStage = stage;

    this.notify(job);
  }

  /**
   * Marks a job as completed
   */
  static async markCompleted(jobId: string, outputBlob: Blob, outputSizeBytes: number): Promise<void> {
    const job = this.running.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 1.0;
    job.completedAt = Date.now();
    job.outputBlob = outputBlob;
    job.outputSizeBytes = outputSizeBytes;

    this.running.delete(jobId);
    await db.jobs.put(job);

    // Also record into history
    await db.history.put({
      id: `hist_${job.id}`,
      jobId: job.id,
      fileName: job.fileName,
      category: job.category,
      inputFormat: job.inputFormat,
      outputFormat: job.outputFormat,
      inputSizeBytes: job.inputSizeBytes,
      outputSizeBytes,
      durationMs: (job.completedAt || Date.now()) - (job.startedAt || job.createdAt),
      completedAt: job.completedAt || Date.now(),
    });

    this.notify(job);
    this.processNext();
  }

  /**
   * Marks a job as failed
   */
  static async markFailed(jobId: string, error: string): Promise<void> {
    const job = this.running.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.completedAt = Date.now();

    this.running.delete(jobId);
    await db.jobs.put(job);
    this.notify(job);
    this.processNext();
  }

  /**
   * Cancels a job
   */
  static async cancel(jobId: string): Promise<void> {
    // Check queue first
    const queuedIdx = this.queue.findIndex((j) => j.id === jobId);
    if (queuedIdx >= 0) {
      const [job] = this.queue.splice(queuedIdx, 1);
      job.status = 'cancelled';
      await db.jobs.put(job);
      this.notify(job);
      return;
    }

    const runningJob = this.running.get(jobId);
    if (runningJob) {
      runningJob.status = 'cancelled';
      this.running.delete(jobId);
      await db.jobs.put(runningJob);
      this.notify(runningJob);
      this.processNext();
    }
  }

  private static processNext(): void {
    if (this.isProcessingLoop) return;
    this.isProcessingLoop = true;

    try {
      while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
        const nextJob = this.queue.shift();
        if (nextJob) {
          nextJob.status = 'initializing';
          nextJob.startedAt = Date.now();
          this.running.set(nextJob.id, nextJob);
          this.notify(nextJob);
        }
      }
    } finally {
      this.isProcessingLoop = false;
    }
  }

  static getJob(jobId: string): ConversionJob | undefined {
    return this.running.get(jobId) || this.queue.find((j) => j.id === jobId);
  }

  static getAllActive(): ConversionJob[] {
    return [...Array.from(this.running.values()), ...this.queue];
  }
}
