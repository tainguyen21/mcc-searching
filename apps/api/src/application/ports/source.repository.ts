export type SourceType = 'community' | 'facebook' | 'bank';
export type JobStatus = 'succeeded' | 'failed' | 'no_change';

export interface SourceRecord {
  id: string;
  sourceKey: string;
  type: SourceType;
  displayName: string;
  externalIdentifier: string | null;
  sourceUrl: string | null;
  schedule: string | null;
  retentionDays: number;
  enabled: boolean;
}

export interface SourceRepository {
  list(): Promise<SourceRecord[]>;
  create(
    input: Omit<SourceRecord, 'id' | 'enabled'> & { enabled?: boolean },
  ): Promise<SourceRecord>;
  update(
    id: string,
    input: Partial<Omit<SourceRecord, 'id' | 'sourceKey' | 'type'>>,
  ): Promise<SourceRecord | undefined>;
  startJob(input: {
    sourceId: string;
    idempotencyKey: string;
  }): Promise<{ id: string; sourceId: string }>;
  finishJob(input: {
    jobId: string;
    status: JobStatus;
    itemsRead: number;
    candidatesCreated: number;
    errorMessage?: string;
  }): Promise<void>;
  receiveNormalizedObservation(input: {
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
  }): Promise<{
    status: 'created' | 'duplicate' | 'ignored';
    observationId?: string;
  }>;
  receiveBankPolicy(input: {
    sourceKey: string;
    bankCode: string;
    documentUrl: string;
    documentHash: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    eligibleMccCodes: string[];
    excludedMccCodes: string[];
  }): Promise<{ status: 'created' | 'no_change'; bankDocumentId: string }>;
}
