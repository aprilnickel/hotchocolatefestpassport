/**
 * Seed vendors and drinks from festival-data.json
 * Run: pnpm run db:seed:json
 * Requires DATABASE_URL. Run db:push or migrations first.
 */
import "dotenv/config";
import { db } from "@/db";
import { drinks, vendors } from "@/db/schema";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { join } from "path";
import { slugify } from "@/lib/utils";

interface FestivalDataVendor {
  name: string;
  slug: string;
  dietaryOptions: {
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
  };
  openLate: boolean;
  takeoutOnly: boolean;
  socialLinks: {
    website: string | null;
    instagram: string | null;
    facebook: string | null;
  };
  locations: Array<{
    address: string | null;
    neighbourhood: string | null;
    hours: string | null;
    tel: string | null;
    email: string | null;
    googleMapsLink: string | null;
  }>;
}

interface FestivalDataDrink {
  id: string;
  name: string;
  availableDateStart: string | null;
  availableDateEnd: string | null;
  description: string | null;
  flavourNotes: string | null;
  dietaryOptions: {
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
  };
  vendorName: string;
}

interface FestivalData {
  vendors: FestivalDataVendor[];
  drinks: FestivalDataDrink[];
}

async function seedFromJSON() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const existing = await db.select().from(vendors).limit(1);
  if (existing.length > 0) {
    console.log("Vendors already seeded. Skip or clear tables to re-seed.");
    return;
  }

  // Read festival data JSON
  const dataPath = join(process.cwd(), "data", "festival-data.json");
  console.log(`Reading festival data from ${dataPath}...`);
  
  const fileContent = await readFile(dataPath, "utf-8");
  const festivalData: FestivalData = JSON.parse(fileContent);

  console.log(`Found ${festivalData.vendors.length} vendors and ${festivalData.drinks.length} drinks`);

  // Transform and insert vendors
  console.log("Seeding vendors...");
  const vendorRows = festivalData.vendors.map((v) => {
    // Use first location for main address/neighbourhood, store rest in metadata
    const primaryLocation = v.locations[0] || {};
    
    return {
      id: randomUUID(),
      name: v.name,
      slug: v.slug,
      neighbourhood: primaryLocation.neighbourhood || null,
      address: primaryLocation.address || null,
      url: v.socialLinks.website || null,
      metadata: {
        dietaryOptions: v.dietaryOptions,
        openLate: v.openLate,
        takeoutOnly: v.takeoutOnly,
        socialLinks: v.socialLinks,
        locations: v.locations,
      },
    };
  });

  await db.insert(vendors).values(vendorRows);

  // Get vendor IDs for mapping
  const vendorList = await db.select().from(vendors);
  const nameToId = Object.fromEntries(vendorList.map((v) => [v.name, v.id]));

  // Transform and insert drinks
  console.log("Seeding drinks...");
  const drinkRows = festivalData.drinks.map((d, index) => {
    const vendorId = nameToId[d.vendorName];
    if (!vendorId) {
      throw new Error(`Vendor not found: ${d.vendorName}`);
    }

    // Generate slug from drink name for better readability
    const slug = `${d.id.toLowerCase()}-${slugify(d.name)}`;

    return {
      id: d.id,
      vendorId,
      name: d.name,
      flavourNotes: d.flavourNotes || null,
      description: d.description || null,
      slug,
      sortOrder: index,
    };
  });

  await db.insert(drinks).values(drinkRows);

  console.log("Seed complete.");
  console.log(`Seeded ${vendorRows.length} vendors and ${drinkRows.length} drinks.`);
}

seedFromJSON().catch((e) => {
  console.error(e);
  process.exit(1);
});
