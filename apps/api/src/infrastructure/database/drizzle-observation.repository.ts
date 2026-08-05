import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import type {
  ObservationRecord,
  ObservationRepository,
} from '../../application/ports/observation.repository';
import type {
  ObservationStatus,
  PaymentChannel,
} from '../../domain/observation/observation-status';
import { DRIZZLE_DB } from './database.constants';
import type { AppDatabase } from './database.types';
import {
  auditLogs,
  mccCodes,
  mccObservations,
  merchantAliases,
  merchantLocations,
  merchants,
  sources,
} from './schema';

@Injectable()
export class DrizzleObservationRepository implements ObservationRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDatabase) {}

  async findMccCodeIdByCode(code: string): Promise<string | undefined> {
    const [mccCode] = await this.database
      .select({ id: mccCodes.id })
      .from(mccCodes)
      .where(eq(mccCodes.code, code))
      .limit(1);

    return mccCode?.id;
  }

  async createCommunityReport(input: {
    userId: string;
    merchantName: string;
    address: string;
    mccCodeId: string;
    issuerBank: string;
    channel: PaymentChannel;
    confidence: { value: number };
  }): Promise<{ observation: ObservationRecord; duplicate: boolean }> {
    return this.database.transaction(async (transaction) => {
      const source = await getCommunitySource(transaction);
      const normalizedMerchantName = normalizeText(input.merchantName);
      const normalizedAddress = normalizeText(input.address);
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
            })
            .returning({ id: merchantLocations.id })
        )[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);
      const [existingObservation] = await transaction
        .select()
        .from(mccObservations)
        .where(
          and(
            eq(mccObservations.sourceId, source.id),
            eq(mccObservations.submittedByUserId, input.userId),
            eq(mccObservations.merchantLocationId, location.id),
            eq(mccObservations.mccCodeId, input.mccCodeId),
            eq(mccObservations.channel, input.channel),
            gte(mccObservations.createdAt, sevenDaysAgo),
          ),
        )
        .limit(1);

      if (existingObservation) {
        return { observation: existingObservation, duplicate: true };
      }

      const [observation] = await transaction
        .insert(mccObservations)
        .values({
          merchantId: merchant.id,
          merchantLocationId: location.id,
          mccCodeId: input.mccCodeId,
          sourceId: source.id,
          submittedByUserId: input.userId,
          issuerBank: input.issuerBank,
          channel: input.channel,
          confidence: input.confidence.value,
          status: 'staging',
          observedAt: new Date(),
        })
        .returning();

      await transaction.insert(auditLogs).values({
        actorUserId: input.userId,
        action: 'created',
        entityType: 'mcc_observation',
        entityId: observation.id,
        observationId: observation.id,
        toStatus: 'staging',
        metadata: { sourceKey: 'community' },
      });

      return { observation, duplicate: false };
    });
  }

  async create(input: {
    sourceId: string;
    mccCodeId: string;
    channel: PaymentChannel;
    confidence: { value: number };
    merchantId?: string;
    merchantLocationId?: string;
    sourceItemId?: string;
    submittedByUserId?: string;
    issuerBank?: string;
    cardNetwork?: string;
    evidenceSnippet?: string;
    observedAt?: Date;
  }): Promise<ObservationRecord> {
    const [observation] = await this.database
      .insert(mccObservations)
      .values({
        ...input,
        confidence: input.confidence.value,
      })
      .returning();

    return observation;
  }

  async listForAdmin(input: {
    statuses: ObservationStatus[];
    page: number;
    pageSize: number;
  }): Promise<ObservationRecord[]> {
    if (input.statuses.length === 0) {
      return [];
    }

    return this.database
      .select()
      .from(mccObservations)
      .where(inArray(mccObservations.status, input.statuses))
      .orderBy(desc(mccObservations.createdAt))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize);
  }

  async findById(id: string): Promise<ObservationRecord | undefined> {
    const [observation] = await this.database
      .select()
      .from(mccObservations)
      .where(eq(mccObservations.id, id))
      .limit(1);

    return observation;
  }

  async hasGeocodedLocation(locationId: string): Promise<boolean> {
    const [location] = await this.database
      .select({ id: merchantLocations.id })
      .from(merchantLocations)
      .where(
        and(
          eq(merchantLocations.id, locationId),
          isNotNull(merchantLocations.geo),
        ),
      )
      .limit(1);

    return location !== undefined;
  }

  async listPublicForLocation(
    locationId: string,
  ): Promise<ObservationRecord[]> {
    return this.database
      .select()
      .from(mccObservations)
      .where(
        and(
          eq(mccObservations.merchantLocationId, locationId),
          eq(mccObservations.status, 'approved'),
        ),
      )
      .orderBy(desc(mccObservations.observedAt));
  }

  async decide(input: {
    observationId: string;
    actorUserId: string;
    status: Exclude<ObservationStatus, 'staging'>;
    reason?: string;
    merchantId?: string;
    merchantLocationId?: string;
  }): Promise<ObservationRecord | undefined> {
    return this.database.transaction(async (transaction) => {
      const [before] = await transaction
        .select()
        .from(mccObservations)
        .where(eq(mccObservations.id, input.observationId))
        .limit(1);

      if (!before) {
        return undefined;
      }

      const [after] = await transaction
        .update(mccObservations)
        .set({
          status: input.status,
          merchantId: input.merchantId ?? before.merchantId,
          merchantLocationId:
            input.merchantLocationId ?? before.merchantLocationId,
          reviewedByUserId: input.actorUserId,
          reviewedAt: new Date(),
          reviewReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(mccObservations.id, input.observationId))
        .returning();

      await transaction.insert(auditLogs).values({
        actorUserId: input.actorUserId,
        action: input.status,
        entityType: 'mcc_observation',
        entityId: input.observationId,
        observationId: input.observationId,
        fromStatus: before.status,
        toStatus: after.status,
        reason: input.reason,
      });

      return after;
    });
  }

  async mergeLocation(input: {
    duplicateLocationId: string;
    canonicalLocationId: string;
    actorUserId: string;
    reason?: string;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(merchantAliases)
        .set({
          merchantLocationId: input.canonicalLocationId,
          updatedAt: new Date(),
        })
        .where(
          eq(merchantAliases.merchantLocationId, input.duplicateLocationId),
        );

      await transaction
        .update(mccObservations)
        .set({
          merchantLocationId: input.canonicalLocationId,
          updatedAt: new Date(),
        })
        .where(
          eq(mccObservations.merchantLocationId, input.duplicateLocationId),
        );

      await transaction.insert(auditLogs).values({
        actorUserId: input.actorUserId,
        action: 'merged',
        entityType: 'merchant_location',
        entityId: input.duplicateLocationId,
        reason: input.reason,
        metadata: { canonicalLocationId: input.canonicalLocationId },
      });
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

async function getCommunitySource(
  transaction: Parameters<AppDatabase['transaction']>[0] extends (
    transaction: infer Transaction,
  ) => Promise<unknown>
    ? Transaction
    : never,
): Promise<{ id: string }> {
  const [source] = await transaction
    .insert(sources)
    .values({
      sourceKey: 'community',
      type: 'community',
      displayName: 'Community reports',
      enabled: true,
      retentionDays: 365,
    })
    .onConflictDoNothing()
    .returning({ id: sources.id });

  if (source) {
    return source;
  }

  const [existingSource] = await transaction
    .select({ id: sources.id })
    .from(sources)
    .where(eq(sources.sourceKey, 'community'))
    .limit(1);

  if (!existingSource) {
    throw new Error('Community source could not be created.');
  }

  return existingSource;
}
