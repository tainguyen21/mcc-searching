CREATE TYPE "public"."audit_action" AS ENUM('approved', 'rejected', 'hidden', 'merged', 'created', 'updated', 'source_disabled', 'job_rerun');--> statement-breakpoint
CREATE TYPE "public"."bank_policy_type" AS ENUM('eligible', 'excluded');--> statement-breakpoint
CREATE TYPE "public"."ingestion_job_status" AS ENUM('running', 'succeeded', 'failed', 'no_change');--> statement-breakpoint
CREATE TYPE "public"."observation_status" AS ENUM('staging', 'approved', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."payment_channel" AS ENUM('offline', 'online');--> statement-breakpoint
CREATE TYPE "public"."source_item_status" AS ENUM('received', 'processed', 'ignored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('community', 'facebook', 'bank');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_subject" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_google_subject_unique" UNIQUE("google_subject"),
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "mcc_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(4) NOT NULL,
	"english_name" varchar(255) NOT NULL,
	"vietnamese_name" varchar(255),
	"category_id" varchar(100) NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcc_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "merchant_alias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"merchant_location_id" uuid,
	"display_name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"display_name" varchar(255),
	"address" varchar(500) NOT NULL,
	"normalized_address" varchar(500) NOT NULL,
	"province" varchar(100),
	"geo" geography(Point, 4326),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_name" varchar(255) NOT NULL,
	"normalized_name" varchar(255) NOT NULL,
	"store_slug" varchar(255) NOT NULL,
	"merchant_type" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"observation_id" uuid,
	"from_status" "observation_status",
	"to_status" "observation_status",
	"reason" varchar(1000),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"bank_code" varchar(50) NOT NULL,
	"document_url" varchar(2048) NOT NULL,
	"document_hash" varchar(128) NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_document_source_hash_unique" UNIQUE("source_id","document_hash")
);
--> statement-breakpoint
CREATE TABLE "bank_mcc_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_document_id" uuid NOT NULL,
	"mcc_code_id" uuid NOT NULL,
	"policy_type" "bank_policy_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_mcc_policy_document_code_type_unique" UNIQUE("bank_document_id","mcc_code_id","policy_type")
);
--> statement-breakpoint
CREATE TABLE "ingestion_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"status" "ingestion_job_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"items_read" integer DEFAULT 0 NOT NULL,
	"candidates_created" integer DEFAULT 0 NOT NULL,
	"error_message" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_job_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "mcc_observation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid,
	"merchant_location_id" uuid,
	"mcc_code_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_item_id" uuid,
	"submitted_by_user_id" uuid,
	"channel" "payment_channel" NOT NULL,
	"issuer_bank" varchar(255),
	"card_network" varchar(100),
	"evidence_snippet" text,
	"observed_at" timestamp with time zone,
	"confidence" integer NOT NULL,
	"status" "observation_status" DEFAULT 'staging' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_reason" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_item_id" varchar(500) NOT NULL,
	"source_url" varchar(2048) NOT NULL,
	"content_hash" varchar(128),
	"redacted_snippet" text,
	"observed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"status" "source_item_status" DEFAULT 'received' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_item_source_external_item_unique" UNIQUE("source_id","external_item_id")
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_key" varchar(100) NOT NULL,
	"type" "source_type" NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"external_identifier" varchar(500),
	"source_url" varchar(2048),
	"schedule" varchar(100),
	"retention_days" integer DEFAULT 30 NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"adapter_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_source_key_unique" UNIQUE("source_key")
);
--> statement-breakpoint
ALTER TABLE "merchant_alias" ADD CONSTRAINT "merchant_alias_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_alias" ADD CONSTRAINT "merchant_alias_merchant_location_id_merchant_location_id_fk" FOREIGN KEY ("merchant_location_id") REFERENCES "public"."merchant_location"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_location" ADD CONSTRAINT "merchant_location_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_app_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."app_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_observation_id_mcc_observation_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."mcc_observation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_document" ADD CONSTRAINT "bank_document_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_mcc_policy" ADD CONSTRAINT "bank_mcc_policy_bank_document_id_bank_document_id_fk" FOREIGN KEY ("bank_document_id") REFERENCES "public"."bank_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_mcc_policy" ADD CONSTRAINT "bank_mcc_policy_mcc_code_id_mcc_code_id_fk" FOREIGN KEY ("mcc_code_id") REFERENCES "public"."mcc_code"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_job" ADD CONSTRAINT "ingestion_job_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_merchant_location_id_merchant_location_id_fk" FOREIGN KEY ("merchant_location_id") REFERENCES "public"."merchant_location"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_mcc_code_id_mcc_code_id_fk" FOREIGN KEY ("mcc_code_id") REFERENCES "public"."mcc_code"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_source_item_id_source_item_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."source_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_submitted_by_user_id_app_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."app_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcc_observation" ADD CONSTRAINT "mcc_observation_reviewed_by_user_id_app_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."app_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_item" ADD CONSTRAINT "source_item_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_alias_scope_name_unique" ON "merchant_alias" USING btree ("merchant_id","merchant_location_id","normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_normalized_name_unique" ON "merchant" USING btree ("normalized_name");--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_store_slug_unique" ON "merchant" USING btree ("store_slug");--> statement-breakpoint
CREATE INDEX "audit_log_entity_created_at" ON "audit_log" USING btree ("entity_id","created_at");--> statement-breakpoint
CREATE INDEX "ingestion_job_source_started_at" ON "ingestion_job" USING btree ("source_id","started_at");--> statement-breakpoint
CREATE INDEX "mcc_observation_source_item" ON "mcc_observation" USING btree ("source_item_id");--> statement-breakpoint
CREATE INDEX "mcc_observation_location_status" ON "mcc_observation" USING btree ("merchant_location_id","status");
