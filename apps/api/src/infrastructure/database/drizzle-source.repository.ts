import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type {
  JobStatus,
  SourceRecord,
  SourceRepository,
} from '../../application/ports/source.repository';
import { DomainError } from '../../domain/shared/domain-error';
import { DRIZZLE_DB } from './database.constants';
import type { AppDatabase } from './database.types';
import {
  auditLogs,
  bankDocuments,
  bankMccPolicies,
  ingestionJobs,
  mccCodes,
  mccObservations,
  merchantLocations,
  merchants,
  sourceItems,
  sources,
} from './schema';

@Injectable()
export class DrizzleSourceRepository implements SourceRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDatabase) {}

  async list(): Promise<SourceRecord[]> {
    return this.database
      .select({
        id: sources.id,
        sourceKey: sources.sourceKey,
        type: sources.type,
        displayName: sources.displayName,
        externalIdentifier: sources.externalIdentifier,
        sourceUrl: sources.sourceUrl,
        schedule: sources.schedule,
        retentionDays: sources.retentionDays,
        enabled: sources.enabled,
      })
      .from(sources)
      .orderBy(desc(sources.createdAt));
  }

  async create(
    input: Omit<SourceRecord, 'id' | 'enabled'> & { enabled?: boolean },
  ): Promise<SourceRecord> {
    const [source] = await this.database
      .insert(sources)
      .values({
        ...input,
        enabled: input.type === 'facebook' ? false : (input.enabled ?? false),
      })
      .returning({
        id: sources.id,
        sourceKey: sources.sourceKey,
        type: sources.type,
        displayName: sources.displayName,
        externalIdentifier: sources.externalIdentifier,
        sourceUrl: sources.sourceUrl,
        schedule: sources.schedule,
        retentionDays: sources.retentionDays,
        enabled: sources.enabled,
      });

    return source;
  }

  async update(
    id: string,
    input: Partial<Omit<SourceRecord, 'id' | 'sourceKey' | 'type'>>,
  ): Promise<SourceRecord | undefined> {
    const [existing] = await this.database
      .select({ type: sources.type })
      .from(sources)
      .where(eq(sources.id, id))
      .limit(1);
    if (!existing) {
      return undefined;
    }

    const [source] = await this.database
      .update(sources)
      .set({
        ...input,
        enabled:
          existing.type === 'facebook' && input.enabled === true
            ? false
            : input.enabled,
        updatedAt: new Date(),
      })
      .where(eq(sources.id, id))
      .returning({
        id: sources.id,
        sourceKey: sources.sourceKey,
        type: sources.type,
        displayName: sources.displayName,
        externalIdentifier: sources.externalIdentifier,
        sourceUrl: sources.sourceUrl,
        schedule: sources.schedule,
        retentionDays: sources.retentionDays,
        enabled: sources.enabled,
      });

    return source;
  }

  async startJob(input: {
    sourceId: string;
    idempotencyKey: string;
  }): Promise<{ id: string; sourceId: string }> {
    const [job] = await this.database
      .insert(ingestionJobs)
      .values({
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        status: 'running',
      })
      .returning({ id: ingestionJobs.id, sourceId: ingestionJobs.sourceId });

    return job;
  }

  async finishJob(input: {
    jobId: string;
    status: JobStatus;
    itemsRead: number;
    candidatesCreated: number;
    errorMessage?: string;
  }): Promise<void> {
    await this.database
      .update(ingestionJobs)
      .set({
        status: input.status,
        itemsRead: input.itemsRead,
        candidatesCreated: input.candidatesCreated,
        errorMessage: input.errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(ingestionJobs.id, input.jobId));
  }

  async receiveNormalizedObservation(input: {
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
  }> {
    return this.database.transaction(async (transaction) => {
      const [source] = await transaction
        .select()
        .from(sources)
        .where(eq(sources.sourceKey, input.sourceKey))
        .limit(1);

      if (!source) {
        throw new DomainError('SOURCE_NOT_FOUND', 404);
      }
      if (!source.enabled) {
        return { status: 'ignored' };
      }

      const [sourceItem] = await transaction
        .insert(sourceItems)
        .values({
          sourceId: source.id,
          externalItemId: input.externalItemId,
          sourceUrl: input.sourceUrl,
          redactedSnippet: input.evidenceSnippet,
          observedAt: input.observedAt,
          status: 'processed',
        })
        .onConflictDoUpdate({
          target: [sourceItems.sourceId, sourceItems.externalItemId],
          set: {
            sourceUrl: input.sourceUrl,
            redactedSnippet: input.evidenceSnippet,
            observedAt: input.observedAt,
            status: 'processed',
            updatedAt: new Date(),
          },
        })
        .returning();

      const [existingObservation] = await transaction
        .select({ id: mccObservations.id })
        .from(mccObservations)
        .where(eq(mccObservations.sourceItemId, sourceItem.id))
        .limit(1);
      if (existingObservation) {
        return { status: 'duplicate', observationId: existingObservation.id };
      }

      const [mccCode] = await transaction
        .select({ id: mccCodes.id })
        .from(mccCodes)
        .where(eq(mccCodes.code, input.mccCode))
        .limit(1);
      if (!mccCode) {
        throw new DomainError('UNKNOWN_MCC_CODE');
      }

      const normalizedMerchantName = normalizeText(input.merchantName);
      const [merchant] = await transaction
        .insert(merchants)
        .values({
          canonicalName: input.merchantName,
          normalizedName: normalizedMerchantName,
          storeSlug: slugFromNormalizedName(normalizedMerchantName),
        })
        .onConflictDoUpdate({
          target: merchants.normalizedName,
          set: { updatedAt: new Date() },
        })
        .returning({ id: merchants.id });

      let merchantLocationId: string | undefined;
      if (input.address) {
        const normalizedAddress = normalizeText(input.address);
        const [existingLocation] = await transaction
          .select({ id: merchantLocations.id })
          .from(merchantLocations)
          .where(
            and(
              eq(merchantLocations.merchantId, merchant.id),
              eq(merchantLocations.normalizedAddress, normalizedAddress),
            ),
          )
          .limit(1);
        const location =
          existingLocation ??
          (
            await transaction
              .insert(merchantLocations)
              .values({
                merchantId: merchant.id,
                address: input.address,
                normalizedAddress,
                province: input.province,
              })
              .returning({ id: merchantLocations.id })
          )[0];
        merchantLocationId = location.id;
      }

      const [observation] = await transaction
        .insert(mccObservations)
        .values({
          merchantId: merchant.id,
          merchantLocationId,
          mccCodeId: mccCode.id,
          sourceId: source.id,
          sourceItemId: sourceItem.id,
          channel: input.channel,
          issuerBank: input.issuerBank,
          cardNetwork: input.cardNetwork,
          evidenceSnippet: input.evidenceSnippet,
          observedAt: input.observedAt ?? new Date(),
          confidence: 50,
          status: 'staging',
        })
        .returning({ id: mccObservations.id });

      await transaction.insert(auditLogs).values({
        action: 'created',
        entityType: 'mcc_observation',
        entityId: observation.id,
        observationId: observation.id,
        toStatus: 'staging',
        metadata: {
          sourceKey: input.sourceKey,
          externalItemId: input.externalItemId,
        },
      });

      return { status: 'created', observationId: observation.id };
    });
  }

  async receiveBankPolicy(input: {
    sourceKey: string;
    bankCode: string;
    documentUrl: string;
    documentHash: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    eligibleMccCodes: string[];
    excludedMccCodes: string[];
  }): Promise<{ status: 'created' | 'no_change'; bankDocumentId: string }> {
    return this.database.transaction(async (transaction) => {
      const [source] = await transaction
        .select()
        .from(sources)
        .where(eq(sources.sourceKey, input.sourceKey))
        .limit(1);
      if (!source || source.type !== 'bank') {
        throw new DomainError('BANK_SOURCE_NOT_FOUND', 404);
      }
      if (!source.enabled) {
        throw new DomainError('SOURCE_DISABLED', 409);
      }

      const [existingDocument] = await transaction
        .select({ id: bankDocuments.id })
        .from(bankDocuments)
        .where(
          and(
            eq(bankDocuments.sourceId, source.id),
            eq(bankDocuments.documentHash, input.documentHash),
          ),
        )
        .limit(1);
      if (existingDocument) {
        return { status: 'no_change', bankDocumentId: existingDocument.id };
      }

      const [document] = await transaction
        .insert(bankDocuments)
        .values({
          sourceId: source.id,
          bankCode: input.bankCode,
          documentUrl: input.documentUrl,
          documentHash: input.documentHash,
          effectiveFrom: input.effectiveFrom,
          effectiveTo: input.effectiveTo,
        })
        .returning({ id: bankDocuments.id });

      const codes = [
        ...new Set([...input.eligibleMccCodes, ...input.excludedMccCodes]),
      ];
      const rows = await transaction
        .select({ id: mccCodes.id, code: mccCodes.code })
        .from(mccCodes)
        .where(inArray(mccCodes.code, codes));
      if (rows.length !== codes.length) {
        throw new DomainError('UNKNOWN_MCC_CODE');
      }

      const codeId = new Map(rows.map((row) => [row.code, row.id]));
      const policies = [
        ...input.eligibleMccCodes.map((code) => ({
          bankDocumentId: document.id,
          mccCodeId: codeId.get(code)!,
          policyType: 'eligible' as const,
        })),
        ...input.excludedMccCodes.map((code) => ({
          bankDocumentId: document.id,
          mccCodeId: codeId.get(code)!,
          policyType: 'excluded' as const,
        })),
      ];
      if (policies.length > 0) {
        await transaction.insert(bankMccPolicies).values(policies);
      }

      await transaction.insert(auditLogs).values({
        action: 'created',
        entityType: 'bank_document',
        entityId: document.id,
        metadata: { sourceKey: input.sourceKey, bankCode: input.bankCode },
      });
      return { status: 'created', bankDocumentId: document.id };
    });
  }
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase('vi').replace(/\s+/g, ' ');
}

function slugFromNormalizedName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gu, 'd')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 220);
}
