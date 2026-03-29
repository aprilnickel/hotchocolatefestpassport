/**
 * Seed vendors and drinks for the Hot Chocolate Festival.
 * Run: pnpm run db:seed
 * Requires DATABASE_URL. Run db:push or migrations first.
 */
import "dotenv/config";
import { db } from "@/db";
import { drinks, vendorLocations, vendorUrls, vendors } from "@/db/schema";
import { randomUUID } from "crypto";

const placeholderVendors = [
  {
    id: randomUUID(),
    name: "Bel Café",
    slug: "bel-cafe",
    neighbourhood: "Downtown Vancouver",
    address: "801 West Georgia Street, Vancouver",
    websiteUrl: "https://belcafe.com",
  },
  {
    id: randomUUID(),
    name: "Thierry Chocolates",
    slug: "thierry-chocolates",
    neighbourhood: "Downtown Vancouver",
    address: "1059 Alberni Street, Vancouver",
    websiteUrl: "https://thierrychocolates.com",
  },
  {
    id: randomUUID(),
    name: "Boketto Dessert Cafe",
    slug: "boketto-dessert-cafe",
    neighbourhood: "Mount Pleasant / East Vancouver",
    address: "3471 West Sawmill Crescent, Vancouver",
    websiteUrl: "https://bokettoteabar.com",
  },
];

const placeholderDrinks = [
  {
    vendorSlug: "bel-cafe",
    name: "#018 – Berry Sweet 16",
    flavourNotes: "milk chocolate, almond, raspberry",
    description: "Milk hot chocolate with almond praline and raspberry whipped cream. Served with a raspberry macaron.",
    slug: "018-berry-sweet-16",
    sortOrder: 0,
  },
  {
    vendorSlug: "bel-cafe",
    name: "#019 – Cherry on Top",
    flavourNotes: "dark chocolate, cherry, rose",
    description: "Dark hot chocolate with cherry syrup and rose whipped cream. Served with a cherry truffle.",
    slug: "019-cherry-on-top",
    sortOrder: 1,
  },
  {
    vendorSlug: "thierry-chocolates",
    name: "#204 – Tonka Bean Temptation",
    flavourNotes: "milk chocolate, tonka bean",
    description: "A 45% milk hot chocolate with tonka bean, topped with whipped cream. Served with tonka almond nougatine and coffee eclair.",
    slug: "204-tonka-bean-temptation",
    sortOrder: 0,
  },
  {
    vendorSlug: "thierry-chocolates",
    name: "#205 – Li Chu Legacy",
    flavourNotes: "dark chocolate, wayanadan black pepper",
    description: "A 64% Li Chu hot chocolate from Vietnam, topped with Chantilly cream and Wayanadan black pepper. On the side, we have an in-house option and a takeaway option. In-house, we're pairing this hot chocolate with Ugandan vanilla bean crème brulée. For takeout, a Ugandan vanilla bean milk chocolate bar.",
    slug: "205-li-chu-legacy",
    sortOrder: 1,
  },
  {
    vendorSlug: "boketto-dessert-cafe",
    name: "#029 – Postcards from Japan",
    flavourNotes: "",
    description: "A twist on our first year’s submission, back by popular demand. Salted white Belgian hot chocolate with a bit of salted kinako powder (roasted soybean powder). Topped with toasted house-made marshmallow cream. Served with a liege mini mochi waffle stuffed with mochi, drizzled with white chocolate, and kinako powder.",
    slug: "029-postcards-from-japan",
    sortOrder: 0,
  },
  {
    vendorSlug: "boketto-dessert-cafe",
    name: "#030 – Postcards from Belgium",
    flavourNotes: "",
    description: "A hot chocolate made with milk and semi-sweet Callebaut chocolate. Topped with our house-made toasted marshmallow cream. Topped with cookie butter and Biscoff cookie crumble. Paired with a warm mini liege waffle stuffed with mochi, topped with Biscoff cookie crumble and caramel.",
    slug: "030-postcards-from-belgium",
    sortOrder: 1,
  },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const existing = await db.select().from(vendors).limit(1);
  if (existing.length > 0) {
    console.log("Vendors already seeded. Skip or clear tables to re-seed.");
    return;
  }

  console.log("Seeding vendors...");
  for (const v of placeholderVendors) {
    await db.insert(vendors).values({
      id: v.id,
      name: v.name,
      slug: v.slug,
      description: null,
      dietaryOptions: null,
      openLate: false,
      takeoutOnly: false,
      limitedSeating: false,
      metadata: null,
    });
    await db.insert(vendorLocations).values({
      id: randomUUID(),
      vendorId: v.id,
      name: v.name,
      address: v.address,
      neighbourhood: v.neighbourhood,
      hours: null,
      phoneNumber: null,
      email: null,
      googleMapsLink: null,
    });
    await db.insert(vendorUrls).values({
      id: randomUUID(),
      vendorId: v.id,
      url: v.websiteUrl,
      type: "website",
    });
  }

  const vendorList = await db.select().from(vendors);
  const slugToId = Object.fromEntries(vendorList.map((v) => [v.slug, v.id]));

  const drinkRows = placeholderDrinks.map((d) => {
    const vendorId = slugToId[d.vendorSlug];
    if (!vendorId) throw new Error(`Vendor not found: ${d.vendorSlug}`);
    return {
      id: randomUUID(),
      externalId: null,
      vendorId,
      name: d.name,
      flavourNotes: d.flavourNotes,
      description: d.description,
      slug: d.slug,
      sortOrder: d.sortOrder,
      availableStart: null,
      availableEnd: null,
      dietaryOptions: null,
    };
  });

  console.log("Seeding drinks...");
  await db.insert(drinks).values(drinkRows);

  console.log("Seed complete.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
