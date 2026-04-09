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
import { cache } from "react";

export type Drink = {
  id: string;
  slug: string;
  externalId: string | null;
  name: string;
  flavourNotes: string | null;
  description: string | null;
};

export type DrinkWithVendor = typeof drinks.$inferSelect & {
  vendor: typeof vendors.$inferSelect & {
    vendorLocations: typeof vendorLocations.$inferSelect[];
  };
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

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  neighbourhoods: string[];
  drinks: Drink[];
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
  const rows = await db.query.drinks.findMany({
    columns: {
      id: true,
      externalId: true,
      name: true,
      flavourNotes: true,
      description: true,
      slug: true,
      sortOrder: true,
      vendorId: true,
    },
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
        with: {
          vendorLocations: {
            columns: {
              neighbourhood: true,
            },
          },
        },
      },
    },
    orderBy: [asc(drinks.externalId), asc(drinks.name)],
  });

  return rows as DrinkWithVendor[];
}

export const getDrinkBySlug = cache(async (slug: string) => {
  const row = await db.query.drinks.findFirst({
    where: eq(drinks.slug, slug),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
        with: {
          vendorLocations: {
            columns: {
              neighbourhood: true,
            },
          },
        },
      },
    },
  });

  return row ?? null;
});

export const getVendorBySlug = cache(async (slug: string) => {
  const row = await db.query.vendors.findFirst({
    where: eq(vendors.slug, slug),
  });

  return row ?? null;
});

export async function getAllVendors() {
  const rows = await db.query.vendors.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
    },
    with: {
      drinks: {
        columns: {
          id: true,
          slug: true,
          externalId: true,
          name: true,
          flavourNotes: true,
          description: true,
        },
      },
      vendorLocations: {
        columns: {
          neighbourhood: true,
        },
      },
    },
  });

  return rows
    .map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      neighbourhoods: [
        ...new Set(
          vendor.vendorLocations
            .map((location) => location.neighbourhood?.trim())
            .filter((neighbourhood): neighbourhood is string => Boolean(neighbourhood))
        ),
      ],
      drinks: [...vendor.drinks].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      ),
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
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
