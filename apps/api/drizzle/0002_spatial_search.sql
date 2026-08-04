CREATE INDEX merchant_location_geo_gist ON merchant_location USING GIST (geo);
--> statement-breakpoint
CREATE INDEX merchant_alias_name_trgm ON merchant_alias USING GIN (normalized_name gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX merchant_name_trgm ON merchant USING GIN (normalized_name gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX observation_public_lookup ON mcc_observation (status, mcc_code_id, merchant_location_id);
