CREATE TABLE "vendor_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"address" text,
	"neighbourhood" text,
	"hours" text,
	"phone_number" text,
	"email" text,
	"google_maps_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
