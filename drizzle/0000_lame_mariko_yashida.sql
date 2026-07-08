CREATE TABLE "admin_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"action_type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cells" (
	"id" text PRIMARY KEY NOT NULL,
	"rough_name" text,
	"center_lat" double precision,
	"center_lng" double precision,
	"status" text DEFAULT 'active' NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"visible_post_count" integer DEFAULT 0 NOT NULL,
	"last_post_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"device_hash" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_post_at" timestamp with time zone,
	"blocked_until" timestamp with time zone,
	"trust_score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "devices_device_hash_unique" UNIQUE("device_hash")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"cell_id" text,
	"device_hash" text,
	"source" text,
	"ui_locale" text,
	"device_language" text,
	"os" text,
	"browser" text,
	"device_type" text,
	"country" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_type" text NOT NULL,
	"pattern" text NOT NULL,
	"note" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"cell_id" text NOT NULL,
	"content" text NOT NULL,
	"language" text,
	"status" text DEFAULT 'visible' NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"device_hash" text,
	"ip_hash" text,
	"ip_enc" text,
	"ip_enc_expires_at" timestamp with time zone,
	"moderation_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"reason" text NOT NULL,
	"detail" text,
	"status" text DEFAULT 'open' NOT NULL,
	"device_hash" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_type_created_idx" ON "events" USING btree ("event_type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_cell_idx" ON "events" USING btree ("cell_id");--> statement-breakpoint
CREATE INDEX "posts_cell_created_idx" ON "posts" USING btree ("cell_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_status_created_idx" ON "posts" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_device_idx" ON "posts" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "reports_post_idx" ON "reports" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_post_device_uq" ON "reports" USING btree ("post_id","device_hash");