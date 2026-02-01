import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { drinks, vendors, wishlistItems } from "@/db/schema";

export type DrinkWithVendor = {
  id: string;
  name: string;
  flavourNotes: string | null;
  description: string | null;
  slug: string;
  sortOrder: number;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  neighbourhood: string | null;
  vendorAddress: string | null;
};

export async function getDrinksWithVendors(): Promise<DrinkWithVendor[]> {
  const rows = await db
    .select({
      id: drinks.id,
      name: drinks.name,
      flavourNotes: drinks.flavourNotes,
      description: drinks.description,
      slug: drinks.slug,
      sortOrder: drinks.sortOrder,
      vendorId: drinks.vendorId,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      neighbourhood: vendors.neighbourhood,
      vendorAddress: vendors.address,
    })
    .from(drinks)
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .orderBy(asc(drinks.sortOrder), asc(drinks.name));

  return rows;
}

export async function getDrinkBySlug(slug: string) {
  const rows = await db
    .select({
      id: drinks.id,
      name: drinks.name,
      flavourNotes: drinks.flavourNotes,
      description: drinks.description,
      slug: drinks.slug,
      vendorId: drinks.vendorId,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      neighbourhood: vendors.neighbourhood,
      address: vendors.address,
      vendorUrl: vendors.url,
    })
    .from(drinks)
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(drinks.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

export async function getVendorBySlug(slug: string) {
  const row = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, slug))
    .limit(1);

  return row[0] ?? null;
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
