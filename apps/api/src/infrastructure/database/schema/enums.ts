import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const paymentChannelEnum = pgEnum('payment_channel', [
  'offline',
  'online',
]);

export const observationStatusEnum = pgEnum('observation_status', [
  'staging',
  'approved',
  'rejected',
  'hidden',
]);

export const sourceTypeEnum = pgEnum('source_type', [
  'community',
  'facebook',
  'bank',
]);

export const sourceItemStatusEnum = pgEnum('source_item_status', [
  'received',
  'processed',
  'ignored',
  'failed',
]);

export const ingestionJobStatusEnum = pgEnum('ingestion_job_status', [
  'running',
  'succeeded',
  'failed',
  'no_change',
]);

export const bankPolicyTypeEnum = pgEnum('bank_policy_type', [
  'eligible',
  'excluded',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'approved',
  'rejected',
  'hidden',
  'merged',
  'created',
  'updated',
  'source_disabled',
  'job_rerun',
]);
