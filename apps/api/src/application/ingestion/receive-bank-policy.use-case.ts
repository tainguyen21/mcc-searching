import type { SourceRepository } from '../ports/source.repository';

export class ReceiveBankPolicyUseCase {
  constructor(private readonly sources: SourceRepository) {}

  execute(input: {
    sourceKey: string;
    bankCode: string;
    documentUrl: string;
    documentHash: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    eligibleMccCodes: string[];
    excludedMccCodes: string[];
  }) {
    return this.sources.receiveBankPolicy(input);
  }
}
