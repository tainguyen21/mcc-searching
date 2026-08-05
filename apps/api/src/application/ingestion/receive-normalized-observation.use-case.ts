import type { SourceRepository } from '../ports/source.repository';

export class ReceiveNormalizedObservationUseCase {
  constructor(private readonly sources: SourceRepository) {}

  execute(input: {
    sourceKey: string;
    externalItemId: string;
    sourceUrl: string;
    observedAt?: Date;
    merchantName: string;
    address?: string;
    province?: string;
    mccCode: string;
    channel: 'offline' | 'online';
    issuerBank?: string;
    cardNetwork?: string;
    evidenceSnippet?: string;
  }) {
    return this.sources.receiveNormalizedObservation(input);
  }
}
