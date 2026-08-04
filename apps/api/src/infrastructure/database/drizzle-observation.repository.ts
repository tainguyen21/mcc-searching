import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
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
import { auditLogs, mccObservations, merchantAliases } from './schema';

@Injectable()
export class DrizzleObservationRepository implements ObservationRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDatabase) {}

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
