-- Rename sipped_items table and columns to journal_items / journaled_at
ALTER TABLE "sipped_items" RENAME TO "journal_items";
ALTER TABLE "journal_items" RENAME COLUMN "sipped_at" TO "journaled_at";
ALTER INDEX "sipped_user_drink" RENAME TO "journal_user_drink";
