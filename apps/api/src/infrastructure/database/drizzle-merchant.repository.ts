import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  countDistinct,
  desc,
  eq,
  ilike,
  isNotNull,
  sql,
  type SQL,
} from 'drizzle-orm';
import type {
  MerchantRepository,
  MerchantSearchResult,
} from '../../application/ports/merchant.repository';
import { DomainError } from '../../domain/shared/domain-error';
import type { PaymentChannel } from '../../domain/observation/observation-status';
import { DRIZZLE_DB } from './database.constants';
import type { AppDatabase } from './database.types';
import {
  mccCodes,
  mccObservations,
  merchantAliases,
  merchantLocations,
  merchants,
} from './schema';

@Injectable()
export class DrizzleMerchantRepository implements MerchantRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly database: AppDatabase) {}

  async createMerchant(input: {
    canonicalName: string;
    normalizedName: string;
    storeSlug: string;
    merchantType?: string;
  }): Promise<{ id: string }> {
    const [merchant] = await this.database
      .insert(merchants)
      .values(input)
      .returning({ id: merchants.id });

    return merchant;
  }

  async createLocation(input: {
    merchantId: string;
    address: string;
    normalizedAddress: string;
    displayName?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ id: string }> {
    const { latitude, longitude } = input;
    let geo: ReturnType<typeof sql<string>> | null = null;

    if (latitude !== undefined || longitude !== undefined) {
      if (
        latitude === undefined ||
        longitude === undefined ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        throw new DomainError('INVALID_COORDINATES');
      }

      geo = sql<string>`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;
    }

    const [location] = await this.database
      .insert(merchantLocations)
      .values({
        merchantId: input.merchantId,
        address: input.address,
        normalizedAddress: input.normalizedAddress,
        displayName: input.displayName,
        province: input.province,
        geo,
      })
      .returning({ id: merchantLocations.id });

    return location;
  }

  async createAlias(input: {
    merchantId: string;
    merchantLocationId?: string;
    displayName: string;
    normalizedName: string;
  }): Promise<{ id: string }> {
    const [alias] = await this.database
      .insert(merchantAliases)
      .values(input)
      .returning({ id: merchantAliases.id });

    return alias;
  }

  async search(input: {
    query?: string;
    mccCode?: string;
    categoryId?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    page: number;
    pageSize: number;
  }): Promise<{ items: MerchantSearchResult[]; total: number }> {
    const conditions: SQL[] = [
      eq(mccObservations.status, 'approved'),
      eq(merchantLocations.isActive, true),
      isNotNull(merchantLocations.geo),
    ];
    const normalizedQuery = input.query?.trim().toLocaleLowerCase('vi');

    if (normalizedQuery) {
      conditions.push(ilike(merchants.normalizedName, `%${normalizedQuery}%`));
    }

    if (input.mccCode) {
      conditions.push(eq(mccCodes.code, input.mccCode));
    }

    if (input.categoryId) {
      conditions.push(eq(mccCodes.categoryId, input.categoryId));
    }

    const where = and(...conditions);
    const offset = (input.page - 1) * input.pageSize;
    const rows = await this.database
      .select({
        locationId: merchantLocations.id,
        merchantName: merchants.canonicalName,
        storeSlug: merchants.storeSlug,
        address: merchantLocations.address,
        latitude: sql<number>`ST_Y(${merchantLocations.geo}::geometry)`,
        longitude: sql<number>`ST_X(${merchantLocations.geo}::geometry)`,
        mccCode: mccCodes.code,
        channel: mccObservations.channel,
        confidence: mccObservations.confidence,
        observedAt: mccObservations.observedAt,
      })
      .from(mccObservations)
      .innerJoin(
        merchantLocations,
        eq(mccObservations.merchantLocationId, merchantLocations.id),
      )
      .innerJoin(merchants, eq(merchantLocations.merchantId, merchants.id))
      .innerJoin(mccCodes, eq(mccObservations.mccCodeId, mccCodes.id))
      .where(where)
      .orderBy(
        desc(mccObservations.confidence),
        desc(mccObservations.observedAt),
      )
      .limit(input.pageSize)
      .offset(offset);

    const [totalRow] = await this.database
      .select({ total: countDistinct(merchantLocations.id) })
      .from(mccObservations)
      .innerJoin(
        merchantLocations,
        eq(mccObservations.merchantLocationId, merchantLocations.id),
      )
      .innerJoin(merchants, eq(merchantLocations.merchantId, merchants.id))
      .innerJoin(mccCodes, eq(mccObservations.mccCodeId, mccCodes.id))
      .where(where);

    const itemsByLocation = new Map<string, MerchantSearchResult>();

    for (const row of rows) {
      const item = itemsByLocation.get(row.locationId);
      const observation = {
        mccCode: row.mccCode,
        channel: row.channel as PaymentChannel,
        confidence: row.confidence,
        observedAt: row.observedAt?.toISOString() ?? '',
      };

      if (item) {
        item.observations.push(observation);
        continue;
      }

      itemsByLocation.set(row.locationId, {
        locationId: row.locationId,
        merchantName: row.merchantName,
        storeSlug: row.storeSlug,
        address: row.address,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        observations: [observation],
      });
    }

    return {
      items: [...itemsByLocation.values()],
      total: Number(totalRow.total),
    };
  }
}
