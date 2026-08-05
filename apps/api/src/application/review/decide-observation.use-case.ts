import { DomainError } from '../../domain/shared/domain-error';
import type { ObservationRepository } from '../ports/observation.repository';

export class DecideObservationUseCase {
  constructor(private readonly observations: ObservationRepository) {}

  async execute(input: {
    observationId: string;
    actorUserId: string;
    status: 'approved' | 'rejected' | 'hidden';
    reason?: string;
    merchantId?: string;
    merchantLocationId?: string;
  }): Promise<void> {
    const observation = await this.observations.findById(input.observationId);

    if (!observation) {
      throw new DomainError('OBSERVATION_NOT_FOUND', 404);
    }

    const reason = input.reason?.trim();

    if (input.status === 'rejected' && !reason) {
      throw new DomainError('REJECTION_REASON_REQUIRED');
    }

    if (
      (input.status === 'approved' || input.status === 'rejected') &&
      observation.status !== 'staging'
    ) {
      throw new DomainError('ONLY_STAGING_OBSERVATION_CAN_BE_DECIDED');
    }

    if (input.status === 'hidden' && observation.status !== 'approved') {
      throw new DomainError('ONLY_APPROVED_OBSERVATION_CAN_BE_HIDDEN');
    }

    if (input.status === 'approved') {
      const merchantId = input.merchantId ?? observation.merchantId;
      const merchantLocationId =
        input.merchantLocationId ?? observation.merchantLocationId;

      if (!merchantId) {
        throw new DomainError('MERCHANT_RESOLUTION_REQUIRED');
      }

      if (
        observation.channel === 'offline' &&
        (!merchantLocationId ||
          !(await this.observations.hasGeocodedLocation(merchantLocationId)))
      ) {
        throw new DomainError('GEOCODED_LOCATION_REQUIRED');
      }
    }

    await this.observations.decide({
      ...input,
      reason,
    });
  }
}
