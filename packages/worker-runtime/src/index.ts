/**
 * @mediaforge/worker-runtime
 * Worker pool management, structured message passing, and transferable execution
 */

export interface WorkerRequestMessage<TPayload = unknown> {
  type: 'EXECUTE_JOB' | 'CANCEL_JOB' | 'PING';
  jobId: string;
  payload?: TPayload;
}

export interface WorkerResponseMessage<TResult = unknown> {
  type: 'PROGRESS' | 'COMPLETED' | 'FAILED' | 'PONG';
  jobId: string;
  progress?: number; // 0.0 - 1.0
  stage?: string;
  result?: TResult;
  error?: string;
}

export interface WorkerPoolOptions {
  maxWorkers?: number;
  workerScriptUrl?: string;
  workerFactory?: () => Worker;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private activeJobs = new Map<string, { worker: Worker; onProgress: (p: number, s?: string) => void; resolve: (res: any) => void; reject: (err: Error) => void }>();
  private idleWorkers: Worker[] = [];
  private maxWorkers: number;
  private workerFactory?: () => Worker;

  constructor(options: WorkerPoolOptions = {}) {
    const hw = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    this.maxWorkers = options.maxWorkers || Math.min(Math.max(2, hw - 1), 6);
    this.workerFactory = options.workerFactory;
  }

  private createWorker(): Worker | null {
    if (this.workerFactory) {
      return this.workerFactory();
    }
    return null;
  }

  /**
   * Dispatches a job to an available worker
   */
  async execute<TPayload, TResult>(
    jobId: string,
    payload: TPayload,
    transferables: Transferable[] = [],
    onProgress?: (progress: number, stage?: string) => void
  ): Promise<TResult> {
    return new Promise((resolve, reject) => {
      let worker = this.idleWorkers.pop();

      if (!worker && this.workers.length < this.maxWorkers) {
        worker = this.createWorker() || undefined;
        if (worker) {
          this.attachWorkerListeners(worker);
          this.workers.push(worker);
        }
      }

      if (!worker) {
        // Run immediately or enqueue (fallback)
        reject(new Error('No worker available and pool is at maximum capacity'));
        return;
      }

      this.activeJobs.set(jobId, {
        worker,
        onProgress: onProgress || (() => {}),
        resolve,
        reject,
      });

      const message: WorkerRequestMessage<TPayload> = {
        type: 'EXECUTE_JOB',
        jobId,
        payload,
      };

      worker.postMessage(message, transferables);
    });
  }

  private attachWorkerListeners(worker: Worker): void {
    worker.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
      const { type, jobId, progress, stage, result, error } = event.data;
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      if (type === 'PROGRESS' && progress !== undefined) {
        job.onProgress(progress, stage);
      } else if (type === 'COMPLETED') {
        this.activeJobs.delete(jobId);
        this.idleWorkers.push(worker);
        job.resolve(result);
      } else if (type === 'FAILED') {
        this.activeJobs.delete(jobId);
        this.idleWorkers.push(worker);
        job.reject(new Error(error || 'Worker execution failed'));
      }
    };

    worker.onerror = (err) => {
      for (const [jobId, job] of this.activeJobs.entries()) {
        if (job.worker === worker) {
          job.reject(new Error(`Worker error: ${err.message}`));
          this.activeJobs.delete(jobId);
        }
      }
    };
  }

  /**
   * Cancels a running job
   */
  cancel(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.worker.postMessage({ type: 'CANCEL_JOB', jobId });
      job.reject(new Error('Job cancelled by user'));
      this.activeJobs.delete(jobId);
      this.idleWorkers.push(job.worker);
    }
  }

  /**
   * Terminates all pool workers
   */
  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.idleWorkers = [];
    this.activeJobs.clear();
  }
}

