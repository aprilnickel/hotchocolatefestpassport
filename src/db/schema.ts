import {
  pgTable,
  text,
  timestamp,
  integer,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

export * from "./auth-schema";

// User data comes from Better Auth (user table). We reference user.id as text in wishlist/tasted.

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  neighbourhood: text("neighbourhood"),
  address: text("address"),
  url: text("url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drinks = pgTable("drinks", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  flavourNotes: text("flavour_notes"),
  description: text("description"),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    drinkId: text("drink_id")
      .notNull()
      .references(() => drinks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wishlist_user_drink").on(table.userId, table.drinkId),
  ]
);

export const tastedItems = pgTable(
  "tasted_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    drinkId: text("drink_id")
      .notNull()
      .references(() => drinks.id, { onDelete: "cascade" }),
    tastedAt: timestamp("tasted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tasted_user_drink").on(table.userId, table.drinkId),
  ]
);
