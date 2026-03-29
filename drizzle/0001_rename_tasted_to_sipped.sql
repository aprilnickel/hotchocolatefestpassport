-- Rename tasted_items table and column to sipped_items / sipped_at
ALTER TABLE "tasted_items" RENAME TO "sipped_items";
ALTER TABLE "sipped_items" RENAME COLUMN "tasted_at" TO "sipped_at";
ALTER INDEX "tasted_user_drink" RENAME TO "sipped_user_drink";
