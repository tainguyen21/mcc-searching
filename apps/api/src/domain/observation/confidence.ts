import { DomainError } from '../shared/domain-error';

export class Confidence {
  private constructor(readonly value: number) {}

  static from(value: number): Confidence {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new DomainError('INVALID_CONFIDENCE');
    }

    return new Confidence(Math.round(value));
  }
}
