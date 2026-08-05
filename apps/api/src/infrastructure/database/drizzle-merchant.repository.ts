import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  countDistinct,
  desc,
  eq,
  isNotNull,
  sql,
  type SQL,
} from 'drizzle-orm';
import type {
  MerchantRepository,
  MerchantSearchResult,
  StoreDetail,
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
  sources,
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
      conditions.push(sql`
        (
          similarity(${merchants.normalizedName}, ${normalizedQuery}) > 0.18
          OR EXISTS (
            SELECT 1
            FROM merchant_alias ma
            WHERE ma.merchant_id = ${merchants.id}
              AND similarity(ma.normalized_name, ${normalizedQuery}) > 0.18
          )
        )
      `);
    }

    if (input.mccCode) {
      conditions.push(eq(mccCodes.code, input.mccCode));
    }

    if (input.categoryId) {
      conditions.push(eq(mccCodes.categoryId, input.categoryId));
    }

    if (input.latitude !== undefined && input.longitude !== undefined) {
      const radiusMeters = (input.radiusKm ?? 5) * 1_000;
      conditions.push(sql`
        ST_DWithin(
          ${merchantLocations.geo},
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
          ${radiusMeters}
        )
      `);
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
        distanceMeters:
          input.latitude === undefined || input.longitude === undefined
            ? sql<number | null>`NULL`
            : sql<number>`ST_Distance(
                ${merchantLocations.geo},
                ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
              )`,
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
        input.latitude === undefined || input.longitude === undefined
          ? desc(
              normalizedQuery
                ? sql`similarity(${merchants.normalizedName}, ${normalizedQuery})`
                : mccObservations.confidence,
            )
          : sql`ST_Distance(
              ${merchantLocations.geo},
              ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
            )`,
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
        ...(row.distanceMeters === null
          ? {}
          : { distanceMeters: Number(row.distanceMeters) }),
        observations: [observation],
      });
    }

    return {
      items: [...itemsByLocation.values()],
      total: Number(totalRow.total),
    };
  }

  async listMccCodes() {
    return this.database
      .select({
        code: mccCodes.code,
        englishName: mccCodes.englishName,
        vietnameseName: mccCodes.vietnameseName,
        categoryId: mccCodes.categoryId,
        categoryName: mccCodes.categoryName,
      })
      .from(mccCodes)
      .orderBy(mccCodes.code);
  }

  async listCategories(): Promise<Array<{ id: string; name: string }>> {
    return this.database
      .selectDistinct({
        id: mccCodes.categoryId,
        name: mccCodes.categoryName,
      })
      .from(mccCodes)
      .orderBy(mccCodes.categoryName);
  }

  async findStoreBySlug(slug: string): Promise<StoreDetail | undefined> {
    const rows = await this.database
      .select({
        locationId: merchantLocations.id,
        displayName: merchantLocations.displayName,
        address: merchantLocations.address,
        province: merchantLocations.province,
        latitude: sql<number | null>`ST_Y(${merchantLocations.geo}::geometry)`,
        longitude: sql<number | null>`ST_X(${merchantLocations.geo}::geometry)`,
        merchantName: merchants.canonicalName,
        storeSlug: merchants.storeSlug,
        mccCode: mccCodes.code,
        mccName: mccCodes.vietnameseName,
        channel: mccObservations.channel,
        issuerBank: mccObservations.issuerBank,
        cardNetwork: mccObservations.cardNetwork,
        confidence: mccObservations.confidence,
        observedAt: mccObservations.observedAt,
        sourceName: sources.displayName,
      })
      .from(merchants)
      .innerJoin(
        merchantLocations,
        eq(merchantLocations.merchantId, merchants.id),
      )
      .innerJoin(
        mccObservations,
        eq(mccObservations.merchantLocationId, merchantLocations.id),
      )
      .innerJoin(mccCodes, eq(mccCodes.id, mccObservations.mccCodeId))
      .innerJoin(sources, eq(sources.id, mccObservations.sourceId))
      .where(
        and(
          eq(merchants.storeSlug, slug),
          eq(merchantLocations.isActive, true),
          eq(mccObservations.status, 'approved'),
        ),
      )
      .orderBy(
        desc(mccObservations.confidence),
        desc(mccObservations.observedAt),
      );

    const first = rows[0];
    if (!first) {
      return undefined;
    }

    const locationsById = new Map<string, StoreDetail['locations'][number]>();
    for (const row of rows) {
      const observation = {
        mccCode: row.mccCode,
        mccName: row.mccName ?? row.mccCode,
        channel: row.channel as PaymentChannel,
        issuerBank: row.issuerBank,
        cardNetwork: row.cardNetwork,
        confidence: row.confidence,
        observedAt: row.observedAt?.toISOString() ?? null,
        sourceName: row.sourceName,
      };
      const location = locationsById.get(row.locationId);

      if (location) {
        location.observations.push(observation);
        continue;
      }

      locationsById.set(row.locationId, {
        locationId: row.locationId,
        displayName: row.displayName,
        address: row.address,
        province: row.province,
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
        observations: [observation],
      });
    }

    return {
      merchantName: first.merchantName,
      storeSlug: first.storeSlug,
      locations: [...locationsById.values()],
    };
  }
}
