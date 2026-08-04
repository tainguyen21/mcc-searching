import {
  boolean,
  customType,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const geographyPoint = customType<{
  data: string;
  driverData: string;
}>({
  dataType: () => 'geography(Point, 4326)',
});

export const merchants = pgTable(
  'merchant',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    canonicalName: varchar('canonical_name', { length: 255 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    storeSlug: varchar('store_slug', { length: 255 }).notNull(),
    merchantType: varchar('merchant_type', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('merchant_normalized_name_unique').on(table.normalizedName),
    uniqueIndex('merchant_store_slug_unique').on(table.storeSlug),
  ],
);

export const merchantLocations = pgTable('merchant_location', {
  id: uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 255 }),
  address: varchar('address', { length: 500 }).notNull(),
  normalizedAddress: varchar('normalized_address', { length: 500 }).notNull(),
  province: varchar('province', { length: 100 }),
  geo: geographyPoint('geo'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const merchantAliases = pgTable(
  'merchant_alias',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    merchantLocationId: uuid('merchant_location_id').references(
      () => merchantLocations.id,
      { onDelete: 'set null' },
    ),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('merchant_alias_scope_name_unique').on(
      table.merchantId,
      table.merchantLocationId,
      table.normalizedName,
    ),
  ],
);

export const mccCodes = pgTable('mcc_code', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 4 }).notNull().unique(),
  englishName: varchar('english_name', { length: 255 }).notNull(),
  vietnameseName: varchar('vietnamese_name', { length: 255 }),
  categoryId: varchar('category_id', { length: 100 }).notNull(),
  categoryName: varchar('category_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
