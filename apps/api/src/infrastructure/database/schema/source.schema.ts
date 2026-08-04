import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema';
import {
  auditActionEnum,
  bankPolicyTypeEnum,
  ingestionJobStatusEnum,
  observationStatusEnum,
  paymentChannelEnum,
  sourceItemStatusEnum,
  sourceTypeEnum,
} from './enums';
import { mccCodes, merchantLocations, merchants } from './merchant.schema';

export const sources = pgTable('source', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceKey: varchar('source_key', { length: 100 }).notNull().unique(),
  type: sourceTypeEnum('type').notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  externalIdentifier: varchar('external_identifier', { length: 500 }),
  sourceUrl: varchar('source_url', { length: 2048 }),
  schedule: varchar('schedule', { length: 100 }),
  retentionDays: integer('retention_days').notNull().default(30),
  enabled: boolean('enabled').notNull().default(false),
  adapterConfig: jsonb('adapter_config')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sourceItems = pgTable(
  'source_item',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    externalItemId: varchar('external_item_id', { length: 500 }).notNull(),
    sourceUrl: varchar('source_url', { length: 2048 }).notNull(),
    contentHash: varchar('content_hash', { length: 128 }),
    redactedSnippet: text('redacted_snippet'),
    observedAt: timestamp('observed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    status: sourceItemStatusEnum('status').notNull().default('received'),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('source_item_source_external_item_unique').on(
      table.sourceId,
      table.externalItemId,
    ),
  ],
);

export const ingestionJobs = pgTable(
  'ingestion_job',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    idempotencyKey: varchar('idempotency_key', { length: 255 })
      .notNull()
      .unique(),
    status: ingestionJobStatusEnum('status').notNull().default('running'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    itemsRead: integer('items_read').notNull().default(0),
    candidatesCreated: integer('candidates_created').notNull().default(0),
    errorMessage: varchar('error_message', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('ingestion_job_source_started_at').on(
      table.sourceId,
      table.startedAt,
    ),
  ],
);

export const mccObservations = pgTable(
  'mcc_observation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id').references(() => merchants.id, {
      onDelete: 'restrict',
    }),
    merchantLocationId: uuid('merchant_location_id').references(
      () => merchantLocations.id,
      { onDelete: 'restrict' },
    ),
    mccCodeId: uuid('mcc_code_id')
      .notNull()
      .references(() => mccCodes.id, { onDelete: 'restrict' }),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    sourceItemId: uuid('source_item_id').references(() => sourceItems.id, {
      onDelete: 'set null',
    }),
    submittedByUserId: uuid('submitted_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    channel: paymentChannelEnum('channel').notNull(),
    issuerBank: varchar('issuer_bank', { length: 255 }),
    cardNetwork: varchar('card_network', { length: 100 }),
    evidenceSnippet: text('evidence_snippet'),
    observedAt: timestamp('observed_at', { withTimezone: true }),
    confidence: integer('confidence').notNull(),
    status: observationStatusEnum('status').notNull().default('staging'),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewReason: varchar('review_reason', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('mcc_observation_source_item').on(table.sourceItemId),
    index('mcc_observation_location_status').on(
      table.merchantLocationId,
      table.status,
    ),
  ],
);

export const bankDocuments = pgTable(
  'bank_document',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    bankCode: varchar('bank_code', { length: 50 }).notNull(),
    documentUrl: varchar('document_url', { length: 2048 }).notNull(),
    documentHash: varchar('document_hash', { length: 128 }).notNull(),
    effectiveFrom: date('effective_from'),
    effectiveTo: date('effective_to'),
    retrievedAt: timestamp('retrieved_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('bank_document_source_hash_unique').on(
      table.sourceId,
      table.documentHash,
    ),
  ],
);

export const bankMccPolicies = pgTable(
  'bank_mcc_policy',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bankDocumentId: uuid('bank_document_id')
      .notNull()
      .references(() => bankDocuments.id, { onDelete: 'cascade' }),
    mccCodeId: uuid('mcc_code_id')
      .notNull()
      .references(() => mccCodes.id, { onDelete: 'restrict' }),
    policyType: bankPolicyTypeEnum('policy_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('bank_mcc_policy_document_code_type_unique').on(
      table.bankDocumentId,
      table.mccCodeId,
      table.policyType,
    ),
  ],
);

export const auditLogs = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: auditActionEnum('action').notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    observationId: uuid('observation_id').references(() => mccObservations.id, {
      onDelete: 'set null',
    }),
    fromStatus: observationStatusEnum('from_status'),
    toStatus: observationStatusEnum('to_status'),
    reason: varchar('reason', { length: 1000 }),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_log_entity_created_at').on(table.entityId, table.createdAt),
  ],
);
