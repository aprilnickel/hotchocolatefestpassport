ALTER TABLE "drinks" ADD COLUMN "external_id" text;
--> statement-breakpoint
ALTER TABLE "drinks" ADD COLUMN "available_start" date;
--> statement-breakpoint
ALTER TABLE "drinks" ADD COLUMN "available_end" date;
--> statement-breakpoint
ALTER TABLE "drinks" ADD COLUMN "dietary_options" "dietary_option"[];
