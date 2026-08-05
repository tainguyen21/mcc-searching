import type { SourceRepository } from '../ports/source.repository';

export class StartJobUseCase {
  constructor(private readonly sources: SourceRepository) {}

  execute(sourceId: string) {
    return this.sources.startJob({
      sourceId,
      idempotencyKey: `${sourceId}:${Date.now()}:${crypto.randomUUID()}`,
    });
  }
}
