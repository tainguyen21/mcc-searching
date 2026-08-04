import type { Confidence } from '../../domain/observation/confidence';
import type {
  ObservationStatus,
  PaymentChannel,
} from '../../domain/observation/observation-status';

export interface ObservationRecord {
  id: string;
  merchantId: string | null;
  merchantLocationId: string | null;
  mccCodeId: string;
  sourceId: string;
  sourceItemId: string | null;
  submittedByUserId: string | null;
  channel: PaymentChannel;
  issuerBank: string | null;
  cardNetwork: string | null;
  evidenceSnippet: string | null;
  observedAt: Date | null;
  confidence: number;
  status: ObservationStatus;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  reviewReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObservationRepository {
  create(input: {
    sourceId: string;
    mccCodeId: string;
    channel: PaymentChannel;
    confidence: Confidence;
    merchantId?: string;
    merchantLocationId?: string;
    sourceItemId?: string;
    submittedByUserId?: string;
    issuerBank?: string;
    cardNetwork?: string;
    evidenceSnippet?: string;
    observedAt?: Date;
  }): Promise<ObservationRecord>;
  listForAdmin(input: {
    statuses: ObservationStatus[];
    page: number;
    pageSize: number;
  }): Promise<ObservationRecord[]>;
  listPublicForLocation(locationId: string): Promise<ObservationRecord[]>;
  decide(input: {
    observationId: string;
    actorUserId: string;
    status: Exclude<ObservationStatus, 'staging'>;
    reason?: string;
    merchantId?: string;
    merchantLocationId?: string;
  }): Promise<ObservationRecord | undefined>;
  mergeLocation(input: {
    duplicateLocationId: string;
    canonicalLocationId: string;
    actorUserId: string;
    reason?: string;
  }): Promise<void>;
}
