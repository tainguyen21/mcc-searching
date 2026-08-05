import { Confidence } from '../../domain/observation/confidence';
import { DomainError } from '../../domain/shared/domain-error';
import type { PaymentChannel } from '../../domain/observation/observation-status';
import type { ObservationRepository } from '../ports/observation.repository';

const COMMUNITY_REPORT_CONFIDENCE = 65;

export class CreateCommunityReportUseCase {
  constructor(private readonly observations: ObservationRepository) {}

  async execute(input: {
    userId: string;
    merchantName: string;
    address: string;
    mccCode: string;
    issuerBank: string;
    channel: PaymentChannel;
  }): Promise<{ observationId: string; duplicate: boolean }> {
    const mccCodeId = await this.observations.findMccCodeIdByCode(
      input.mccCode,
    );

    if (!mccCodeId) {
      throw new DomainError('UNKNOWN_MCC_CODE');
    }

    const report = await this.observations.createCommunityReport({
      ...input,
      mccCodeId,
      confidence: Confidence.from(COMMUNITY_REPORT_CONFIDENCE),
    });

    return {
      observationId: report.observation.id,
      duplicate: report.duplicate,
    };
  }
}
