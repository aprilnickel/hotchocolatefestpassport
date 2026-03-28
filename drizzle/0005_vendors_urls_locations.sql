CREATE TYPE "public"."dietary_option" AS ENUM('gluten-free', 'dairy-free', 'vegan');
--> statement-breakpoint
CREATE TYPE "public"."vendor_url_type" AS ENUM('website', 'facebook', 'instagram', 'tiktok', 'twitter');
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "description" text;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "dietary_options" "dietary_option"[];
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "open_late" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "takeout_only" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "limited_seating" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "vendors" SET "description" = COALESCE("description", "metadata"->>'description') WHERE "metadata" ? 'description';
--> statement-breakpoint
UPDATE "vendors" SET "open_late" = COALESCE(("metadata"->>'openLate')::boolean, "open_late") WHERE "metadata" ? 'openLate';
--> statement-breakpoint
UPDATE "vendors" SET "takeout_only" = COALESCE(("metadata"->>'takeoutOnly')::boolean, "takeout_only") WHERE "metadata" ? 'takeoutOnly';
--> statement-breakpoint
UPDATE "vendors" SET "limited_seating" = COALESCE(("metadata"->>'limitedSeating')::boolean, "limited_seating") WHERE "metadata" ? 'limitedSeating';
--> statement-breakpoint
UPDATE "vendors" v SET "dietary_options" = COALESCE(
  (SELECT array_agg(elem::text::dietary_option)
   FROM jsonb_array_elements_text(v."metadata"->'dietaryOptions') AS elem),
  '{}'::dietary_option[]
)
WHERE v."metadata" ? 'dietaryOptions';
--> statement-breakpoint
CREATE TABLE "vendor_urls" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
	"url" text NOT NULL,
	"type" "vendor_url_type",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "vendor_urls" ("id", "vendor_id", "url", "type", "created_at")
SELECT gen_random_uuid()::text, "id", "url", 'website'::vendor_url_type, "created_at"
FROM "vendors"
WHERE "url" IS NOT NULL AND btrim("url") <> '';
--> statement-breakpoint
INSERT INTO "vendor_locations" ("id", "vendor_id", "name", "address", "neighbourhood", "created_at")
SELECT gen_random_uuid()::text, v."id", v."name", v."address", v."neighbourhood", v."created_at"
FROM "vendors" v
WHERE (v."address" IS NOT NULL OR v."neighbourhood" IS NOT NULL)
AND NOT EXISTS (SELECT 1 FROM "vendor_locations" vl WHERE vl."vendor_id" = v."id");
--> statement-breakpoint
ALTER TABLE "vendors" DROP COLUMN "neighbourhood";
--> statement-breakpoint
ALTER TABLE "vendors" DROP COLUMN "address";
--> statement-breakpoint
ALTER TABLE "vendors" DROP COLUMN "url";
