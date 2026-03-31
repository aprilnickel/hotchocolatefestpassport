import { eq, asc, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  drinks,
  vendors,
  wishlistItems,
  vendorLocations,
  vendorUrls,
  journalEntries,
} from "@/db/schema";

export type DrinkWithVendor = {
  id: string;
  externalId: string | null;
  name: string;
  flavourNotes: string | null;
  description: string | null;
  slug: string;
  sortOrder: number;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorNeighbourhoods: string[];
};

export type WishlistItemRow = {
  id: string;
  drinkId: string;
  drinkName: string;
  drinkSlug: string;
  flavourNotes: string | null;
  vendorName: string;
  vendorSlug: string;
  vendorNeighbourhoods: string[];
};

export type JournalEntryRow = {
  id: string;
  drinkId: string;
  drinkExternalId: string | null;
  drinkName: string;
  drinkSlug: string;
  flavourNotes: string | null;
  vendorName: string;
  vendorSlug: string;
  vendorNeighbourhoods: string[];
  journaledAt: Date;
};

async function getVendorLocationsByVendorIds(vendorIds: string[]) {
  return db
    .select({
      vendorId: vendorLocations.vendorId,
      neighbourhood: vendorLocations.neighbourhood,
    })
    .from(vendorLocations)
    .where(inArray(vendorLocations.vendorId, vendorIds))
    .orderBy(asc(vendorLocations.vendorId));
}

async function getNeighbourhoodsByVendorIds(vendorIds: string[]): Promise<Map<string, string[]>> {
  const neighbourhoodsByVendor = new Map<string, string[]>();

  if (vendorIds.length > 0) {
    const locRows = await getVendorLocationsByVendorIds(vendorIds);

    for (const loc of locRows) {
      const n = loc.neighbourhood?.trim();
      if (!n) continue;
      const list = neighbourhoodsByVendor.get(loc.vendorId);
      if (list) list.push(n);
      else neighbourhoodsByVendor.set(loc.vendorId, [n]);
    }
  }
  return neighbourhoodsByVendor;
}

export async function getDrinksWithVendors(): Promise<DrinkWithVendor[]> {
  const rows = await db
    .select({
      id: drinks.id,
      externalId: drinks.externalId,
      name: drinks.name,
      flavourNotes: drinks.flavourNotes,
      description: drinks.description,
      slug: drinks.slug,
      sortOrder: drinks.sortOrder,
      vendorId: drinks.vendorId,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
    })
    .from(drinks)
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .orderBy(asc(drinks.externalId), asc(drinks.name));

  const vendorIds = [...new Set(rows.map((r) => r.vendorId))];
  const neighbourhoodsByVendor = await getNeighbourhoodsByVendorIds(vendorIds);

  return rows.map((r) => ({
    ...r,
    vendorNeighbourhoods: neighbourhoodsByVendor.get(r.vendorId) ?? [],
  }));
}

export async function getDrinkBySlug(slug: string) {
  const rows = await db
    .select({
      id: drinks.id,
      externalId: drinks.externalId,
      name: drinks.name,
      flavourNotes: drinks.flavourNotes,
      description: drinks.description,
      slug: drinks.slug,
      vendorId: drinks.vendorId,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
    })
    .from(drinks)
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(drinks.slug, slug))
    .limit(1);

  const drinkRow = rows[0] ?? null;
  if (!drinkRow) return null;

  const vendorId = drinkRow.vendorId;
  const neighbourhoodsByVendor = new Map<string, string[]>();

  const locRows = await getVendorLocationsByVendorIds([vendorId]);

  for (const loc of locRows) {
    const n = loc.neighbourhood?.trim();
    if (!n) continue;
    const list = neighbourhoodsByVendor.get(loc.vendorId);
    if (list) list.push(n);
    else neighbourhoodsByVendor.set(loc.vendorId, [n]);
  }

  return {
    ...drinkRow,
    vendorNeighbourhoods: neighbourhoodsByVendor.get(vendorId) ?? [],
  };
}

export async function getVendorBySlug(slug: string) {
  const row = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, slug))
    .limit(1);

  return row[0] ?? null;
}

export async function getVendorLocations(vendorId: string) {
  return db
    .select()
    .from(vendorLocations)
    .where(eq(vendorLocations.vendorId, vendorId))
    .orderBy(asc(vendorLocations.createdAt));
}

export async function getVendorUrls(vendorId: string) {
  return db
    .select()
    .from(vendorUrls)
    .where(eq(vendorUrls.vendorId, vendorId))
    .orderBy(asc(vendorUrls.createdAt));
}

export async function getDrinksByVendorId(vendorId: string) {
  return db
    .select()
    .from(drinks)
    .where(eq(drinks.vendorId, vendorId))
    .orderBy(asc(drinks.sortOrder), asc(drinks.name));
}

/** Returns set of drink IDs that the user has in their wishlist. */
export async function getWishlistDrinkIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ drinkId: wishlistItems.drinkId })
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId));
  return new Set(rows.map((r) => r.drinkId));
}

export async function getWishlistItemsByUser(userId: string) {
  const rows = await db
    .select({
      id: wishlistItems.id,
      drinkId: drinks.id,
      drinkExternalId: drinks.externalId,
      drinkName: drinks.name,
      drinkSlug: drinks.slug,
      flavourNotes: drinks.flavourNotes,
      vendorId: drinks.vendorId,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
    })
    .from(wishlistItems)
    .innerJoin(drinks, eq(wishlistItems.drinkId, drinks.id))
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(asc(drinks.name));
  
  const vendorIds = [...new Set(rows.map((r) => r.vendorId))];
  const neighbourhoodsByVendor = await getNeighbourhoodsByVendorIds(vendorIds);

  return rows.map((r) => ({
    ...r,
    vendorNeighbourhoods: neighbourhoodsByVendor.get(r.vendorId) ?? [],
  }));
}

export async function getJournalEntriesByUser(userId: string) {
  const rows = await db
    .select({
      id: journalEntries.id,
      drinkId: drinks.id,
      drinkExternalId: drinks.externalId,
      drinkName: drinks.name,
      drinkSlug: drinks.slug,
      flavourNotes: drinks.flavourNotes,
      vendorId: drinks.vendorId,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      journaledAt: journalEntries.journaledAt,
    })
    .from(journalEntries)
    .innerJoin(drinks, eq(journalEntries.drinkId, drinks.id))
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.journaledAt));
  
  const vendorIds = [...new Set(rows.map((r) => r.vendorId))];
  const neighbourhoodsByVendor = await getNeighbourhoodsByVendorIds(vendorIds);

  return rows.map((r) => ({
    ...r,
    vendorNeighbourhoods: neighbourhoodsByVendor.get(r.vendorId) ?? [],
  }));
}
