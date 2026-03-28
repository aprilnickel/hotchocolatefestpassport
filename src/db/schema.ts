import {
  pgTable,
  text,
  timestamp,
  integer,
  uniqueIndex,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export * from "./auth-schema";

// User data comes from Better Auth (user table). We reference user.id as text in wishlist/journal.

export const dietaryOptionEnum = pgEnum("dietary_option", [
  "gluten-free",
  "dairy-free",
  "vegan",
]);

export const vendorUrlTypeEnum = pgEnum("vendor_url_type", [
  "website",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
]);

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  dietaryOptions: dietaryOptionEnum("dietary_options").array(),
  openLate: boolean("open_late").default(false).notNull(),
  takeoutOnly: boolean("takeout_only").default(false).notNull(),
  limitedSeating: boolean("limited_seating").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vendorUrls = pgTable("vendor_urls", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: vendorUrlTypeEnum("type"),
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

export const vendorLocations = pgTable("vendor_locations", {
  id: text("id").primaryKey(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  neighbourhood: text("neighbourhood"),
  hours: text("hours"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  googleMapsLink: text("google_maps_link"),
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

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    drinkId: text("drink_id")
      .notNull()
      .references(() => drinks.id, { onDelete: "cascade" }),
    journaledAt: timestamp("journaled_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("journal_user_drink").on(table.userId, table.drinkId),
  ]
);
