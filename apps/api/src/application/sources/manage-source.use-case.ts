import type {
  SourceRecord,
  SourceRepository,
} from '../ports/source.repository';

export class ManageSourceUseCase {
  constructor(private readonly sources: SourceRepository) {}

  list(): Promise<SourceRecord[]> {
    return this.sources.list();
  }

  create(
    input: Omit<SourceRecord, 'id' | 'enabled'> & { enabled?: boolean },
  ): Promise<SourceRecord> {
    return this.sources.create(input);
  }

  update(
    id: string,
    input: Partial<Omit<SourceRecord, 'id' | 'sourceKey' | 'type'>>,
  ): Promise<SourceRecord | undefined> {
    return this.sources.update(id, input);
  }
}
