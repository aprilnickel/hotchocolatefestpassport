/**
 * Import vendors and drinks from scraped Hot Chocolate Festival JSON into Postgres.
 *
 * Run:
 *   pnpm exec tsx src/scripts/import-festival-data.ts --force --file path/to/data.json
 *
 * Example input file: data/hotchocolatefest-vendors-and-drinks-scraped-20260324.json
 *
 * Requires DATABASE_URL. This deletes all rows in `vendors` (cascades to drinks, wishlist, journal,
 * vendor_locations, vendor_urls) when --force is passed, then inserts from the JSON file.
 */
import "dotenv/config";
import * as fs from "fs/promises";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { drinks, vendorLocations, vendorUrls, vendors } from "@/db/schema";

type DietaryOption = "vegan" | "gluten-free" | "dairy-free";

type VendorUrlType =
  | "website"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "youtube";

type VendorLocation = {
  name: string;
  address: string;
  neighbourhood: string;
  hours: string;
  phoneNumber: string;
  email: string;
  googleMapsLink: string;
};

type JsonVendor = {
  name: string;
  description: string;
  dietaryOptions: DietaryOption[];
  openLate: boolean;
  takeoutOnly: boolean;
  limitedSeating: boolean;
  socialLinks: string[];
  locations: VendorLocation[];
};

type JsonDrink = {
  id: string;
  name: string;
  availableStart: string;
  availableEnd: string;
  description: string;
  dietaryOptions: DietaryOption[];
  vendor: string;
};

type FestivalDataFile = {
  vendors: JsonVendor[];
  drinks: JsonDrink[];
};

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(baseSlug: string, fallbackSlug: string, used: Set<string>): string {
  let slug = baseSlug || fallbackSlug;
  let n = 0;
  while (used.has(slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  used.add(slug);
  return slug;
}

/** Strip HTML tags for plain-text fields (drink detail renders description as text). */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFestivalDate(dateString: string): string | null {
  const date = dateString?.trim();
  if (!date) return null;
  const dateObject = new Date(date);
  if (Number.isNaN(dateObject.getTime())) return null;
  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function inferVendorUrlType(rawUrl: string): VendorUrlType | null {
  try {
    const u = new URL(rawUrl.trim());
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    if (h.includes("instagram.com")) return "instagram";
    if (h.includes("facebook.com") || h.includes("fb.com")) return "facebook";
    if (h.includes("tiktok.com")) return "tiktok";
    if (h.includes("twitter.com") || h.includes("x.com")) return "twitter";
    if (h.includes("youtube.com") || h.includes("youtu.be")) return "youtube";
    return "website";
  } catch {
    return null;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const force = process.argv.includes("--force");
  if (!force) {
    console.error(
      "Refusing to run without --force (this replaces all vendors and drinks, and cascades wishlist/journal rows tied to those drinks)."
    );
    process.exit(1);
  }

  const filePath = getArgValue("--file");
  if (!filePath) {
    throw new Error("Missing required --file argument.");
  }
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as FestivalDataFile;

  if (!Array.isArray(data.vendors) || !Array.isArray(data.drinks)) {
    throw new Error("Invalid JSON: expected { vendors: [], drinks: [] }");
  }

  const vendorNames = new Set(data.vendors.map((vendor) => vendor.name));
  const missingVendors = new Set<string>();
  for (const drink of data.drinks) {
    if (!vendorNames.has(drink.vendor)) missingVendors.add(drink.vendor);
  }
  if (missingVendors.size > 0) {
    const list = [...missingVendors].sort().join("\n  ");
    throw new Error(
      `Drinks reference vendor names not present in vendors[]:\n  ${list}`
    );
  }

  console.log(`Deleting existing vendors (cascade)…`);
  await db.delete(vendors);

  const slugUsed = new Set<string>();
  const vendorRows: (typeof vendors.$inferInsert)[] = [];
  const locationRows: (typeof vendorLocations.$inferInsert)[] = [];
  const urlRows: (typeof vendorUrls.$inferInsert)[] = [];
  const nameToId = new Map<string, string>();

  for (const vendor of data.vendors) {
    const id = randomUUID();
    const vendorNameSlugified = slugify(vendor.name);
    const slug = uniqueSlug(vendorNameSlugified, "vendor", slugUsed);
    const description = htmlToPlainText(vendor.description).trim() || null;

    vendorRows.push({
      id,
      name: vendor.name,
      slug,
      description,
      dietaryOptions: vendor.dietaryOptions.length > 0 ? vendor.dietaryOptions : null,
      openLate: vendor.openLate,
      takeoutOnly: vendor.takeoutOnly,
      limitedSeating: vendor.limitedSeating,
      metadata: null,
    });
    nameToId.set(vendor.name, id);

    for (const loc of vendor.locations) {
      locationRows.push({
        id: randomUUID(),
        vendorId: id,
        name: loc.name?.trim() || vendor.name,
        address: loc.address?.trim() || null,
        neighbourhood: loc.neighbourhood?.trim() || null,
        hours: loc.hours?.trim() || null,
        phoneNumber: loc.phoneNumber?.trim() || null,
        email: loc.email?.trim() || null,
        googleMapsLink: loc.googleMapsLink?.trim() || null,
      });
    }

    const seenUrls = new Set<string>();
    for (const link of vendor.socialLinks) {
      const trimmed = link.trim();
      if (!/^https?:\/\//i.test(trimmed)) continue;
      if (seenUrls.has(trimmed)) continue;
      seenUrls.add(trimmed);
      urlRows.push({
        id: randomUUID(),
        vendorId: id,
        url: trimmed,
        type: inferVendorUrlType(trimmed),
      });
    }
  }

  if (vendorRows.length > 0) {
    console.log(`Inserting ${vendorRows.length} vendors…`);
    await db.insert(vendors).values(vendorRows);
  }

  if (locationRows.length > 0) {
    console.log(`Inserting ${locationRows.length} vendor locations…`);
    await db.insert(vendorLocations).values(locationRows);
  }

  if (urlRows.length > 0) {
    console.log(`Inserting ${urlRows.length} vendor URLs…`);
    await db.insert(vendorUrls).values(urlRows);
  }

  const drinkSlugUsed = new Set<string>();
  const drinkRows: (typeof drinks.$inferInsert)[] = [];

  for (const drink of data.drinks) {
    const vendorId = nameToId.get(drink.vendor);
    if (!vendorId) {
      throw new Error(`Internal: missing vendor id for ${drink.vendor}`);
    }
    const drinkNameSlugified = slugify(drink.name);
    const baseSlug = drink.id ? `${drink.id}-${drinkNameSlugified}` : drinkNameSlugified;
    const slug = uniqueSlug(baseSlug, "drink", drinkSlugUsed);
    const description = htmlToPlainText(drink.description).trim() || null;
    
    drinkRows.push({
      id: randomUUID(),
      externalId: drink.id,
      vendorId,
      name: drink.name,
      flavourNotes: null,
      description,
      slug,
      availableStart: parseFestivalDate(drink.availableStart),
      availableEnd: parseFestivalDate(drink.availableEnd),
      dietaryOptions:
        drink.dietaryOptions.length > 0 ? drink.dietaryOptions : null,
    });
  }

  if (drinkRows.length > 0) {
    console.log(`Inserting ${drinkRows.length} drinks…`);
    await db.insert(drinks).values(drinkRows);
  }

  console.log("Import complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
