import type { JobStatus, SourceRepository } from '../ports/source.repository';

export class FinishJobUseCase {
  constructor(private readonly sources: SourceRepository) {}

  execute(input: {
    jobId: string;
    status: JobStatus;
    itemsRead: number;
    candidatesCreated: number;
    errorMessage?: string;
  }): Promise<void> {
    return this.sources.finishJob(input);
  }
}
