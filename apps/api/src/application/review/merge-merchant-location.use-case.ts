import { DomainError } from '../../domain/shared/domain-error';
import type { ObservationRepository } from '../ports/observation.repository';

export class MergeMerchantLocationUseCase {
  constructor(private readonly observations: ObservationRepository) {}

  async execute(input: {
    duplicateLocationId: string;
    canonicalLocationId: string;
    actorUserId: string;
    reason?: string;
  }): Promise<void> {
    if (input.duplicateLocationId === input.canonicalLocationId) {
      throw new DomainError('MERGE_LOCATIONS_MUST_DIFFER');
    }

    await this.observations.mergeLocation(input);
  }
}
