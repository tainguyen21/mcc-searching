import { relations } from 'drizzle-orm';
import { users } from './auth.schema';
import {
  auditLogs,
  bankDocuments,
  bankMccPolicies,
  ingestionJobs,
  mccObservations,
  sourceItems,
  sources,
} from './source.schema';
import {
  mccCodes,
  merchantAliases,
  merchantLocations,
  merchants,
} from './merchant.schema';

export const usersRelations = relations(users, ({ many }) => ({
  submittedObservations: many(mccObservations, {
    relationName: 'submittedByUser',
  }),
  reviewedObservations: many(mccObservations, {
    relationName: 'reviewedByUser',
  }),
  auditLogs: many(auditLogs),
}));

export const merchantsRelations = relations(merchants, ({ many }) => ({
  locations: many(merchantLocations),
  aliases: many(merchantAliases),
  observations: many(mccObservations),
}));

export const merchantLocationsRelations = relations(
  merchantLocations,
  ({ one, many }) => ({
    merchant: one(merchants, {
      fields: [merchantLocations.merchantId],
      references: [merchants.id],
    }),
    aliases: many(merchantAliases),
    observations: many(mccObservations),
  }),
);

export const merchantAliasesRelations = relations(
  merchantAliases,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantAliases.merchantId],
      references: [merchants.id],
    }),
    merchantLocation: one(merchantLocations, {
      fields: [merchantAliases.merchantLocationId],
      references: [merchantLocations.id],
    }),
  }),
);

export const mccCodesRelations = relations(mccCodes, ({ many }) => ({
  observations: many(mccObservations),
  bankPolicies: many(bankMccPolicies),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  items: many(sourceItems),
  jobs: many(ingestionJobs),
  observations: many(mccObservations),
  bankDocuments: many(bankDocuments),
}));

export const sourceItemsRelations = relations(sourceItems, ({ one, many }) => ({
  source: one(sources, {
    fields: [sourceItems.sourceId],
    references: [sources.id],
  }),
  observations: many(mccObservations),
}));

export const ingestionJobsRelations = relations(ingestionJobs, ({ one }) => ({
  source: one(sources, {
    fields: [ingestionJobs.sourceId],
    references: [sources.id],
  }),
}));

export const mccObservationsRelations = relations(
  mccObservations,
  ({ one, many }) => ({
    merchant: one(merchants, {
      fields: [mccObservations.merchantId],
      references: [merchants.id],
    }),
    merchantLocation: one(merchantLocations, {
      fields: [mccObservations.merchantLocationId],
      references: [merchantLocations.id],
    }),
    mccCode: one(mccCodes, {
      fields: [mccObservations.mccCodeId],
      references: [mccCodes.id],
    }),
    source: one(sources, {
      fields: [mccObservations.sourceId],
      references: [sources.id],
    }),
    sourceItem: one(sourceItems, {
      fields: [mccObservations.sourceItemId],
      references: [sourceItems.id],
    }),
    submittedBy: one(users, {
      fields: [mccObservations.submittedByUserId],
      references: [users.id],
      relationName: 'submittedByUser',
    }),
    reviewedBy: one(users, {
      fields: [mccObservations.reviewedByUserId],
      references: [users.id],
      relationName: 'reviewedByUser',
    }),
    auditLogs: many(auditLogs),
  }),
);

export const bankDocumentsRelations = relations(
  bankDocuments,
  ({ one, many }) => ({
    source: one(sources, {
      fields: [bankDocuments.sourceId],
      references: [sources.id],
    }),
    policies: many(bankMccPolicies),
  }),
);

export const bankMccPoliciesRelations = relations(
  bankMccPolicies,
  ({ one }) => ({
    bankDocument: one(bankDocuments, {
      fields: [bankMccPolicies.bankDocumentId],
      references: [bankDocuments.id],
    }),
    mccCode: one(mccCodes, {
      fields: [bankMccPolicies.mccCodeId],
      references: [mccCodes.id],
    }),
  }),
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  observation: one(mccObservations, {
    fields: [auditLogs.observationId],
    references: [mccObservations.id],
  }),
}));
