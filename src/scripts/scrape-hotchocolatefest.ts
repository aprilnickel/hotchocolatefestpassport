import "dotenv/config";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const BASE_URL = "https://hotchocolatefest.com";
const LIST_OF_FLAVOURS_SLUG = "list-of-flavours";
const USER_AGENT = "HotChocolateFestScraper/1.0 (+https://hotchocolatefest.com)";
const REQUEST_DELAY_MS = 150;
const VENDOR_CONCURRENCY = 4;

const argList = process.argv.slice(2);
const args = new Set(argList);
const APPLY = args.has("--apply");
const REPLACE = args.has("--replace");
const PRUNE = args.has("--prune");
const SHOW_HELP = args.has("--help") || args.has("-h");
const DEFAULT_OUTPUT_PATH = "data/hotchocolatefest-scrape.json";

function getArgValue(flag: string): string | null {
  const match = argList.find((arg) => arg === flag || arg.startsWith(`${flag}=`));
  if (!match) return null;
  if (match.startsWith(`${flag}=`)) {
    return match.slice(flag.length + 1);
  }
  const flagIndex = argList.indexOf(match);
  const nextValue = argList[flagIndex + 1];
  if (!nextValue || nextValue.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return nextValue;
}

const OUTPUT_PATH = getArgValue("--output") ?? DEFAULT_OUTPUT_PATH;

if ((REPLACE || PRUNE) && !APPLY) {
  throw new Error("--replace/--prune requires --apply");
}

type VendorApi = {
  slug: string;
  title: { rendered: string };
  link: string;
  neighbourhood?: number[];
};

type PageApi = {
  content?: { rendered?: string };
};

type NeighbourhoodApi = {
  id: number;
  name: string;
};

type ScrapedVendor = {
  slug: string;
  name: string;
  neighbourhood: string | null;
  address: string | null;
  url: string | null;
  metadata: Record<string, unknown>;
};

type ScrapedDrink = {
  vendorSlug: string;
  vendorName?: string;
  name: string;
  flavourNotes: string | null;
  description: string | null;
  slug: string;
  sortOrder: number;
};

type ScrapeResult = {
  vendors: ScrapedVendor[];
  drinks: ScrapedDrink[];
};

type ScrapeOutput = {
  scrapedAt: string;
  source: {
    site: string;
    listOfFlavoursUrl: string;
    vendorsApiUrl: string;
  };
  vendors: ScrapedVendor[];
  drinks: ScrapedDrink[];
};

type VendorPageDetails = {
  locations: string[];
  mapLinks: string[];
  socialLinks: string[];
  website: string | null;
  otherLinks: string[];
};

const SCRAPE_TIMESTAMP = new Date().toISOString();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  const data = (await response.json()) as T;
  await sleep(REQUEST_DELAY_MS);
  return data;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  const data = await response.text();
  await sleep(REQUEST_DELAY_MS);
  return data;
}

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    const named: Record<string, string> = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: "\"",
      apos: "'",
      nbsp: " ",
    };
    return named[entity] ?? match;
  });
}

function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNewTag(value: string): string {
  return value.replace(/\s*[-\u2013\u2014]\s*NEW\s*$/i, "").trim();
}

function stripTags(html: string): string {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "");
}

function cleanHtmlText(html: string): string {
  return normalizeText(decodeHtmlEntities(stripTags(html)));
}

function slugify(value: string): string {
  const normalized = normalizeText(value).toLowerCase();
  return normalized
    .replace(/#/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function extractLocations(html: string): string[] {
  const results: string[] = [];
  const patterns = [/Location:\s*([^<]+)</gi, /Address:\s*([^<]+)</gi];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const text = cleanHtmlText(match[1]);
      if (text) results.push(text);
    }
  }
  return unique(results);
}

function extractExternalLinks(html: string): string[] {
  const links: string[] = [];
  const pattern = /href="(https?:\/\/[^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    links.push(match[1]);
  }
  return unique(links);
}

function classifyLinks(links: string[]): {
  mapLinks: string[];
  socialLinks: string[];
  websiteLinks: string[];
  otherLinks: string[];
} {
  const mapLinks: string[] = [];
  const socialLinks: string[] = [];
  const websiteLinks: string[] = [];
  const otherLinks: string[] = [];

  const socialHosts = new Set([
    "instagram.com",
    "www.instagram.com",
    "facebook.com",
    "www.facebook.com",
    "tiktok.com",
    "www.tiktok.com",
    "x.com",
    "www.x.com",
    "twitter.com",
    "www.twitter.com",
    "threads.net",
    "www.threads.net",
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "linkedin.com",
    "www.linkedin.com",
    "pinterest.com",
    "www.pinterest.com",
  ]);

  for (const link of links) {
    let host = "";
    try {
      host = new URL(link).hostname.toLowerCase();
    } catch (error) {
      otherLinks.push(link);
      continue;
    }

    if (host.endsWith("hotchocolatefest.com") || host.endsWith("gmpg.org")) {
      continue;
    }

    if (
      host === "goo.gl" ||
      host === "maps.app.goo.gl" ||
      host === "maps.google.com" ||
      (host === "www.google.com" && link.includes("/maps"))
    ) {
      mapLinks.push(link);
      continue;
    }

    if (socialHosts.has(host)) {
      socialLinks.push(link);
      continue;
    }

    if (host.endsWith("ajwebdesign.ca")) {
      otherLinks.push(link);
      continue;
    }

    websiteLinks.push(link);
  }

  return {
    mapLinks: unique(mapLinks),
    socialLinks: unique(socialLinks),
    websiteLinks: unique(websiteLinks),
    otherLinks: unique(otherLinks),
  };
}

async function fetchVendorPageDetails(url: string): Promise<VendorPageDetails> {
  try {
    const html = await fetchText(url);
    const locations = extractLocations(html);
    const externalLinks = extractExternalLinks(html);
    const classified = classifyLinks(externalLinks);
    return {
      locations,
      mapLinks: classified.mapLinks,
      socialLinks: classified.socialLinks,
      website: classified.websiteLinks[0] ?? null,
      otherLinks: classified.otherLinks,
    };
  } catch (error) {
    console.warn(`Failed to scrape vendor page ${url}`, error);
    return {
      locations: [],
      mapLinks: [],
      socialLinks: [],
      website: null,
      otherLinks: [],
    };
  }
}

async function fetchNeighbourhoods(): Promise<Map<number, string>> {
  const url = `${BASE_URL}/wp-json/wp/v2/neighbourhood?per_page=100`;
  const data = await fetchJson<NeighbourhoodApi[]>(url);
  return new Map(
    data.map((item) => [item.id, cleanHtmlText(item.name)])
  );
}

async function fetchAllVendors(): Promise<VendorApi[]> {
  const vendors: VendorApi[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${BASE_URL}/wp-json/wp/v2/vendors?per_page=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Request failed ${response.status} for ${url}`);
    }
    const data = (await response.json()) as VendorApi[];
    totalPages = Number.parseInt(
      response.headers.get("x-wp-totalpages") ?? "1",
      10
    );
    vendors.push(...data);
    page += 1;
    await sleep(REQUEST_DELAY_MS);
  }

  return vendors;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: limit }, () => runWorker());
  await Promise.all(workers);
  return results;
}

async function scrapeVendors(): Promise<ScrapedVendor[]> {
  const neighbourhoods = await fetchNeighbourhoods();
  const vendorEntries = await fetchAllVendors();

  return mapWithConcurrency(
    vendorEntries,
    VENDOR_CONCURRENCY,
    async (vendor) => {
      const details = await fetchVendorPageDetails(vendor.link);
      const name = stripNewTag(cleanHtmlText(vendor.title.rendered));
      const neighbourhoodNames = (vendor.neighbourhood ?? [])
        .map((id) => neighbourhoods.get(id))
        .filter((value): value is string => Boolean(value));
      const neighbourhood = neighbourhoodNames.length
        ? neighbourhoodNames.join(" / ")
        : null;
      const address = details.locations.length
        ? details.locations.join("; ")
        : null;

      return {
        slug: vendor.slug,
        name,
        neighbourhood,
        address,
        url: details.website,
        metadata: {
          source: {
            site: BASE_URL,
            vendorUrl: vendor.link,
            scrapedAt: SCRAPE_TIMESTAMP,
          },
          locations: details.locations,
          mapLinks: details.mapLinks,
          socialLinks: details.socialLinks,
          otherLinks: details.otherLinks,
        },
      };
    }
  );
}

function extractVendorReference(sectionHtml: string): {
  slug: string;
  name: string;
  url: string;
} | null {
  const match = sectionHtml.match(
    /<a[^>]+href="([^"]+\/vendors\/[^"]+)"[^>]*>(.*?)<\/a>/i
  );
  if (!match) return null;
  const url = new URL(match[1], BASE_URL);
  const slug =
    url.pathname
      .split("/")
      .filter(Boolean)
      .pop() ?? "";
  if (!slug) return null;
  const name = stripNewTag(cleanHtmlText(match[2]));
  return { slug, name, url: url.toString() };
}

function extractParagraphs(sectionHtml: string): string[] {
  const results: string[] = [];
  const pattern = /<p[^>]*>(.*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(sectionHtml))) {
    const text = cleanHtmlText(match[1]);
    if (text) results.push(text);
  }
  return results;
}

async function scrapeDrinks(): Promise<ScrapedDrink[]> {
  const url = `${BASE_URL}/wp-json/wp/v2/pages?slug=${LIST_OF_FLAVOURS_SLUG}`;
  const pages = await fetchJson<PageApi[]>(url);
  const html = pages[0]?.content?.rendered ?? "";
  if (!html) {
    throw new Error("List of flavours page not found or empty.");
  }

  const drinks: ScrapedDrink[] = [];
  const pattern = /<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<h3[^>]*>|$)/gi;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(html))) {
    const headingText = cleanHtmlText(match[1]);
    if (!/#\s*\d+/.test(headingText)) {
      continue;
    }

    const sectionHtml = match[2];
    const vendorRef = extractVendorReference(sectionHtml);
    if (!vendorRef) {
      console.warn(`Missing vendor link for drink "${headingText}"`);
      continue;
    }

    const paragraphs = extractParagraphs(sectionHtml);
    const descriptionParts = paragraphs.slice(1);
    const description = descriptionParts.length
      ? descriptionParts.join("\n\n")
      : null;

    const numberMatch = headingText.match(/#\s*(\d+)/);
    const sortOrder = numberMatch
      ? Number.parseInt(numberMatch[1], 10)
      : index + 1;
    const slug = slugify(headingText);

    drinks.push({
      vendorSlug: vendorRef.slug,
      vendorName: vendorRef.name,
      name: headingText,
      flavourNotes: null,
      description,
      slug,
      sortOrder,
    });

    index += 1;
  }

  const deduped = new Map<string, ScrapedDrink>();
  for (const drink of drinks) {
    const key = `${drink.vendorSlug}::${drink.slug}`;
    if (deduped.has(key)) {
      console.warn(`Duplicate drink skipped: ${drink.name}`);
      continue;
    }
    deduped.set(key, drink);
  }

  return Array.from(deduped.values());
}

async function scrapeHotChocolateFest(): Promise<ScrapeResult> {
  const [vendors, drinks] = await Promise.all([scrapeVendors(), scrapeDrinks()]);

  const vendorBySlug = new Map(vendors.map((vendor) => [vendor.slug, vendor]));
  for (const drink of drinks) {
    if (!vendorBySlug.has(drink.vendorSlug)) {
      vendorBySlug.set(drink.vendorSlug, {
        slug: drink.vendorSlug,
        name: drink.vendorName ?? drink.vendorSlug,
        neighbourhood: null,
        address: null,
        url: null,
        metadata: {
          source: {
            site: BASE_URL,
            scrapedAt: SCRAPE_TIMESTAMP,
          },
          note: "Vendor missing from vendor API; created from drink list.",
        },
      });
    }
  }

  return {
    vendors: Array.from(vendorBySlug.values()),
    drinks,
  };
}

async function applyToDatabase(result: ScrapeResult) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to write to the database.");
  }

  const { db } = await import("@/db");
  const { vendors, drinks } = await import("@/db/schema");
  const { eq, inArray } = await import("drizzle-orm");

  if (REPLACE) {
    console.log("Clearing existing drinks and vendors...");
    await db.delete(drinks);
    await db.delete(vendors);
  }

  const vendorSlugs = result.vendors.map((vendor) => vendor.slug);
  const existingVendors = REPLACE
    ? []
    : await db
        .select({ id: vendors.id, slug: vendors.slug })
        .from(vendors)
        .where(inArray(vendors.slug, vendorSlugs));
  const existingVendorIdBySlug = new Map(
    existingVendors.map((vendor) => [vendor.slug, vendor.id])
  );

  const vendorRows = result.vendors.map((vendor) => ({
    id: existingVendorIdBySlug.get(vendor.slug) ?? randomUUID(),
    slug: vendor.slug,
    name: vendor.name,
    neighbourhood: vendor.neighbourhood,
    address: vendor.address,
    url: vendor.url,
    metadata: vendor.metadata,
  }));

  const vendorsToInsert = vendorRows.filter(
    (vendor) => !existingVendorIdBySlug.has(vendor.slug)
  );
  const vendorsToUpdate = vendorRows.filter((vendor) =>
    existingVendorIdBySlug.has(vendor.slug)
  );

  if (vendorsToInsert.length) {
    console.log(`Inserting ${vendorsToInsert.length} vendors...`);
    await db.insert(vendors).values(vendorsToInsert);
  }

  if (vendorsToUpdate.length) {
    console.log(`Updating ${vendorsToUpdate.length} vendors...`);
    for (const vendor of vendorsToUpdate) {
      await db
        .update(vendors)
        .set({
          name: vendor.name,
          neighbourhood: vendor.neighbourhood,
          address: vendor.address,
          url: vendor.url,
          metadata: vendor.metadata,
        })
        .where(eq(vendors.id, vendor.id));
    }
  }

  const vendorIdBySlug = new Map(
    vendorRows.map((vendor) => [vendor.slug, vendor.id])
  );
  const vendorIds = vendorRows.map((vendor) => vendor.id);

  const existingDrinks = REPLACE
    ? []
    : await db
        .select({ id: drinks.id, slug: drinks.slug, vendorId: drinks.vendorId })
        .from(drinks)
        .where(inArray(drinks.vendorId, vendorIds));
  const existingDrinkIdByKey = new Map(
    existingDrinks.map((drink) => [
      `${drink.vendorId}::${drink.slug}`,
      drink.id,
    ])
  );

  const drinkRows = result.drinks
    .map((drink) => {
      const vendorId = vendorIdBySlug.get(drink.vendorSlug);
      if (!vendorId) {
        console.warn(
          `Skipping drink without vendor match: ${drink.name} (${drink.vendorSlug})`
        );
        return null;
      }
      const existingId = existingDrinkIdByKey.get(`${vendorId}::${drink.slug}`);
      return {
        id: existingId ?? randomUUID(),
        vendorId,
        name: drink.name,
        flavourNotes: drink.flavourNotes,
        description: drink.description,
        slug: drink.slug,
        sortOrder: drink.sortOrder,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const drinksToInsert = drinkRows.filter(
    (drink) => !existingDrinkIdByKey.has(`${drink.vendorId}::${drink.slug}`)
  );
  const drinksToUpdate = drinkRows.filter((drink) =>
    existingDrinkIdByKey.has(`${drink.vendorId}::${drink.slug}`)
  );

  if (drinksToInsert.length) {
    console.log(`Inserting ${drinksToInsert.length} drinks...`);
    await db.insert(drinks).values(drinksToInsert);
  }

  if (drinksToUpdate.length) {
    console.log(`Updating ${drinksToUpdate.length} drinks...`);
    for (const drink of drinksToUpdate) {
      await db
        .update(drinks)
        .set({
          vendorId: drink.vendorId,
          name: drink.name,
          flavourNotes: drink.flavourNotes,
          description: drink.description,
          slug: drink.slug,
          sortOrder: drink.sortOrder,
        })
        .where(eq(drinks.id, drink.id));
    }
  }

  if (PRUNE) {
    const keepKeys = new Set(
      drinkRows.map((drink) => `${drink.vendorId}::${drink.slug}`)
    );
    const staleDrinks = existingDrinks.filter(
      (drink) => !keepKeys.has(`${drink.vendorId}::${drink.slug}`)
    );
    if (staleDrinks.length) {
      console.log(`Pruning ${staleDrinks.length} stale drinks...`);
      await db
        .delete(drinks)
        .where(inArray(drinks.id, staleDrinks.map((drink) => drink.id)));
    }
  }

  console.log("Import complete.");
}

async function writeOutputFile(outputPath: string, result: ScrapeResult) {
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await mkdir(path.dirname(resolvedPath), { recursive: true });

  const payload: ScrapeOutput = {
    scrapedAt: SCRAPE_TIMESTAMP,
    source: {
      site: BASE_URL,
      listOfFlavoursUrl: `${BASE_URL}/${LIST_OF_FLAVOURS_SLUG}/`,
      vendorsApiUrl: `${BASE_URL}/wp-json/wp/v2/vendors`,
    },
    vendors: result.vendors,
    drinks: result.drinks,
  };

  await writeFile(resolvedPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Saved scrape output to ${resolvedPath}`);
}

function printHelp() {
  console.log(`\nHot Chocolate Festival scraper\n\nUsage:\n  pnpm run db:scrape\n  pnpm run db:scrape -- --apply\n\nOptions:\n  --apply    Write scraped data to the database\n  --replace  Clear vendors/drinks before import (requires --apply)\n  --prune    Remove drinks not present in the scrape (requires --apply)\n  --output   Write JSON output to a custom file path\n  --help     Show this help message\n`);
}

async function main() {
  if (SHOW_HELP) {
    printHelp();
    return;
  }

  console.log("Scraping Hot Chocolate Festival data...");
  const result = await scrapeHotChocolateFest();

  console.log(
    `Scrape complete: ${result.vendors.length} vendors, ${result.drinks.length} drinks`
  );
  await writeOutputFile(OUTPUT_PATH, result);

  if (!APPLY) {
    console.log("Dry run only. Pass --apply to write to the database.");
    return;
  }

  await applyToDatabase(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
