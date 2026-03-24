/**
 * Scrape vendors and drinks from hotchocolatefest.com and save normalized JSON.
 *
 * Run:
 *   pnpm run data:scrape
 *   pnpm run data:scrape -- --output data/hotchocolatefest.json
 */
import * as fs from "fs/promises";
import * as path from "path";
import * as cheerio from "cheerio";

const BASE_URL = "https://hotchocolatefest.com";
const DIRECTORY_URL = `${BASE_URL}/vendor-directory/`;

const DIETARY_VALUES = ["vegan", "gluten-free", "dairy-free"] as const;
type DietaryOption = (typeof DIETARY_VALUES)[number];

type VendorLocation = {
  name: string;
  address: string;
  neighbourhood: string;
  hours: string;
  phoneNumber: string;
  email: string;
  googleMapsLink: string;
};

type Vendor = {
  name: string;
  description: string;
  dietaryOptions: DietaryOption[];
  openLate: boolean;
  takeoutOnly: boolean;
  limitedSeating: boolean;
  socialLinks: string[];
  locations: VendorLocation[];
};

type Drink = {
  id: string;
  name: string;
  availableStart: string;
  availableEnd: string;
  description: string;
  dietaryOptions: DietaryOption[];
  vendor: string;
};

type OutputSchema = {
  vendors: Vendor[];
  drinks: Drink[];
};

type DirectoryVendorMeta = {
  url: string;
  name: string;
  neighbourhoods: string[];
  dietaryOptions: DietaryOption[];
  openLate: boolean;
  takeoutOnly: boolean;
  limitedSeating: boolean;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function neighbourhoodTitleCaseSlug(slug: string): string {
  const known: Record<string, string> = {
    "downtown-vancouver": "Downtown Vancouver",
    "mount-pleasant-east-vancouver": "Mount Pleasant/East Vancouver",
    "north-vancouver-west-vancouver": "North Vancouver/West Vancouver",
    richmond: "Richmond",
    "sea-to-sky": "Sea to Sky",
    "south-granville-kitsilano": "South Granville/Kitsilano",
    "tri-cities-langley-and-new-westminster":
      "Tri-Cities, Langley and New Westminster",
    "westside-kerrisdale": "Westside/Kerrisdale",
    "white-rock-surrey": "White Rock/Surrey",
    burnaby: "Burnaby",
  };
  if (known[slug]) return known[slug];
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function mapDietaryFromText(input: string): DietaryOption[] {
  const text = input.toLowerCase();
  const opts = new Set<DietaryOption>();
  if (text.includes("vegan")) opts.add("vegan");
  if (text.includes("gluten-free")) opts.add("gluten-free");
  if (text.includes("dairy-free")) opts.add("dairy-free");
  return Array.from(opts);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "hotchocolatefestpassport-data-scraper/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.text();
}

function parseDirectoryVendors(html: string): DirectoryVendorMeta[] {
  const $ = cheerio.load(html);
  const vendors: DirectoryVendorMeta[] = [];
  const seen = new Set<string>();

  $("a[href*='/vendors/']").each((_idx, anchor) => {
    const href = $(anchor).attr("href");
    if (!href) return;

    const absoluteUrl = new URL(href, BASE_URL).toString();
    if (!absoluteUrl.startsWith(`${BASE_URL}/vendors/`)) return;
    if (seen.has(absoluteUrl)) return;

    const vendorName = normalizeWhitespace($(anchor).find("h4").first().text());
    if (!vendorName) return;

    const vendorParentElement =
      $(anchor).closest("[data-elementor-type='loop-item']") ||
      $(anchor).closest(".e-loop-item");
    const classNames = (vendorParentElement.attr("class") ?? "").split(/\s+/);

    const neighbourhoods = classNames
      .filter((cls) => cls.startsWith("neighbourhood-"))
      .map((cls) => cls.replace("neighbourhood-", ""))
      .map(neighbourhoodTitleCaseSlug);

    const dietaryFromClasses: DietaryOption[] = [];
    if (
      classNames.some((c) => c.includes("dietary-requirements-vegan-options"))
    ) {
      dietaryFromClasses.push("vegan");
    }
    if (
      classNames.some((c) =>
        c.includes("dietary-requirements-gluten-free-options"),
      )
    ) {
      dietaryFromClasses.push("gluten-free");
    }
    if (
      classNames.some((c) => c.includes("dietary-requirements-dairy-free-options"))
    ) {
      dietaryFromClasses.push("dairy-free");
    }

    const altText = normalizeWhitespace(
      vendorParentElement.find("img[alt]").map((_i, el) => $(el).attr("alt") ?? "").get().join(" "),
    );
    const dietaryFromAlt = mapDietaryFromText(altText);
    const dietaryOptions = Array.from(new Set([...dietaryFromClasses, ...dietaryFromAlt]));

    const openLate =
      classNames.some((c) => c.includes("available-services-open-late")) ||
      altText.toLowerCase().includes("open late");
    const takeoutOnly =
      classNames.some((c) => c.includes("available-services-takeout-only")) ||
      altText.toLowerCase().includes("takeout only");
    const limitedSeating =
      classNames.some((c) => c.includes("available-services-limited-cafe-seating")) ||
      altText.toLowerCase().includes("limited cafe seating");

    vendors.push({
      url: absoluteUrl,
      name: vendorName,
      neighbourhoods,
      dietaryOptions,
      openLate,
      takeoutOnly,
      limitedSeating,
    });
    seen.add(absoluteUrl);
  });

  return vendors;
}

function getSectionWidgetHtml($: cheerio.CheerioAPI, headingText: string): string {
  const headingNode = $(
    `.elementor-button-text:contains("${headingText}")`,
  ).first();
  if (!headingNode.length) return "";

  const buttonWidget = headingNode.closest(".elementor-widget-button");
  if (!buttonWidget.length) return "";

  const nextTextWidget = buttonWidget
    .nextAll(".elementor-widget-text-editor")
    .first();
  if (!nextTextWidget.length) return "";

  return nextTextWidget.find(".elementor-widget-container").html() ?? "";
}

function extractSocialLinks(
  $: cheerio.CheerioAPI,
  sectionHeading: string,
): string[] {
  const headingNode = $(
    `.elementor-button-text:contains("${sectionHeading}")`,
  ).first();
  if (!headingNode.length) return [];
  const buttonWidget = headingNode.closest(".elementor-widget-button");
  if (!buttonWidget.length) return [];

  // Collect links from section widgets after the heading button until next heading button.
  const hrefs: string[] = [];
  let sibling = buttonWidget.next();
  while (sibling.length && !sibling.is(".elementor-widget-button")) {
    sibling.find("a[href]").each((_i, el) => {
      hrefs.push(new URL($(el).attr("href") ?? "", BASE_URL).toString());
    });
    sibling = sibling.next();
  }

  const unique = new Set<string>();
  for (const link of hrefs.filter(Boolean)) {
    const host = new URL(link).hostname.toLowerCase();
    const isSocial =
      host.includes("instagram.com") ||
      host.includes("facebook.com") ||
      host.includes("tiktok.com") ||
      host === "x.com" ||
      host.endsWith(".x.com") ||
      host.includes("twitter.com");
    const isUtilityDomain =
      host.includes("google.") ||
      host === "g.page" ||
      host.includes("maps.");
    const isWebsite = !host.includes("hotchocolatefest.com") && !isUtilityDomain;
    if (isSocial || isWebsite) {
      unique.add(link);
    }
  }
  return Array.from(unique);
}

function parseDateRange(text: string): { start: string; end: string } {
  const clean = normalizeWhitespace(text).replace(/^Available\s+/i, "");
  const cleaned = clean.replace(/\(.*?\)/g, "").trim();

  const fullMonthRange = cleaned.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*[–-]\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/,
  );
  if (fullMonthRange) {
    return {
      start: `${fullMonthRange[1]} ${fullMonthRange[2]}, ${fullMonthRange[5]}`,
      end: `${fullMonthRange[3]} ${fullMonthRange[4]}, ${fullMonthRange[5]}`,
    };
  }

  const sharedMonthRange = cleaned.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),\s*(\d{4})$/,
  );
  if (sharedMonthRange) {
    return {
      start: `${sharedMonthRange[1]} ${sharedMonthRange[2]}, ${sharedMonthRange[4]}`,
      end: `${sharedMonthRange[1]} ${sharedMonthRange[3]}, ${sharedMonthRange[4]}`,
    };
  }

  return { start: "", end: "" };
}

function parseDrinks(
  $: cheerio.CheerioAPI,
  vendorName: string,
): Drink[] {
  const sectionHtml = getSectionWidgetHtml($, "Drink Flavours");
  if (!sectionHtml) return [];

  const section$ = cheerio.load(`<div>${sectionHtml}</div>`);
  const drinks: Drink[] = [];
  const h3Nodes = section$("h3").toArray();

  for (let i = 0; i < h3Nodes.length; i += 1) {
    const h3 = h3Nodes[i];
    const headingText = normalizeWhitespace(section$(h3).text());
    const headingMatch = headingText.match(/^#?\s*(\d+)\s*[–-]\s*(.+)$/);
    if (!headingMatch) continue;

    const id = headingMatch[1].padStart(3, "0");
    const name = headingMatch[2].trim();

    const paragraphHtml: string[] = [];
    let availableLine = "";
    let cursor = section$(h3).next();
    while (cursor.length && cursor[0].tagName !== "h3") {
      if (cursor[0].tagName === "p") {
        const text = normalizeWhitespace(cursor.text());
        if (!availableLine && /^Available\s+/i.test(text)) {
          availableLine = text;
        } else if (text && text !== "\u00a0") {
          paragraphHtml.push(section$.html(cursor) ?? "");
        }
      }
      cursor = cursor.next();
    }

    const dateRange = parseDateRange(availableLine);
    const dietaryOptions = mapDietaryFromText(paragraphHtml.join(" "));

    drinks.push({
      id,
      name,
      availableStart: dateRange.start,
      availableEnd: dateRange.end,
      description: paragraphHtml.join(""),
      dietaryOptions,
      vendor: vendorName,
    });
  }

  return drinks;
}

function parseLocationBlock(
  blockHtml: string,
  neighbourhood: string,
): VendorLocation {
  const $ = cheerio.load(`<div>${blockHtml}</div>`);
  const title = normalizeWhitespace($("h3").first().text());

  const allText = normalizeWhitespace($("div").text().replace(/Directions$/i, ""));
  const addressMatch = allText.match(/Location:\s*(.+?)(?=Hours:|Tel:|Email:|$)/i);
  const hoursMatch = allText.match(/Hours:\s*(.+?)(?=Tel:|Email:|$)/i);
  const phoneMatch = allText.match(/Tel:\s*([^\s].+?)(?=Email:|$)/i);
  const emailMatch = allText.match(
    /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  );
  const mapsLink = $("a[href*='google'], a[href*='g.page'], a[href*='maps']")
    .first()
    .attr("href");

  return {
    name: title,
    address: addressMatch ? normalizeWhitespace(addressMatch[1]) : "",
    neighbourhood,
    hours: hoursMatch ? normalizeWhitespace(hoursMatch[1]) : "",
    phoneNumber: phoneMatch ? normalizeWhitespace(phoneMatch[1]) : "",
    email: emailMatch ? emailMatch[1] : "",
    googleMapsLink: mapsLink ? new URL(mapsLink, BASE_URL).toString() : "",
  };
}

function parseLocations(
  $: cheerio.CheerioAPI,
  neighbourhoods: string[],
): VendorLocation[] {
  const sectionHtml = getSectionWidgetHtml($, "Location and Hours");
  if (!sectionHtml) {
    return [
      {
        name: "",
        address: "",
        neighbourhood: neighbourhoods.join(", "),
        hours: "",
        phoneNumber: "",
        email: "",
        googleMapsLink: "",
      },
    ];
  }

  const section$ = cheerio.load(`<div>${sectionHtml}</div>`);
  const nodes = section$("h3, p").toArray();
  const chunks: string[] = [];
  let chunk = "";
  for (const node of nodes) {
    if (node.tagName === "h3" && chunk) {
      chunks.push(chunk);
      chunk = "";
    }
    chunk += section$.html(node) ?? "";
  }
  if (chunk) chunks.push(chunk);

  const fallbackNeighbourhood = neighbourhoods.join(", ");
  return chunks.map((block) => parseLocationBlock(block, fallbackNeighbourhood));
}

function parseVendorDescription($: cheerio.CheerioAPI): string {
  const aboutHtml = getSectionWidgetHtml($, "About Vendor");
  if (!aboutHtml) return "";

  const section$ = cheerio.load(`<div>${aboutHtml}</div>`);
  return normalizeWhitespace(section$("div").text());
}

async function scrapeVendor(
  meta: DirectoryVendorMeta,
): Promise<{ vendor: Vendor; drinks: Drink[] }> {
  const html = await fetchHtml(meta.url);
  const $ = cheerio.load(html);

  const name =
    normalizeWhitespace($("h1").first().text()) ||
    meta.name;

  const description = parseVendorDescription($);
  const socialLinks = extractSocialLinks($, "About Vendor");
  const locations = parseLocations($, meta.neighbourhoods);
  const drinks = parseDrinks($, name);

  const vendor: Vendor = {
    name,
    description,
    dietaryOptions: meta.dietaryOptions,
    openLate: meta.openLate,
    takeoutOnly: meta.takeoutOnly,
    limitedSeating: meta.limitedSeating,
    socialLinks,
    locations,
  };

  return { vendor, drinks };
}

async function scrapeAll(): Promise<OutputSchema> {
  const directoryHtml = await fetchHtml(DIRECTORY_URL);
  const directoryVendors = parseDirectoryVendors(directoryHtml);
  const vendors: Vendor[] = [];
  const drinks: Drink[] = [];

  for (let i = 0; i < directoryVendors.length; i += 1) {
    const meta = directoryVendors[i];
    process.stdout.write(
      `[${i + 1}/${directoryVendors.length}] Scraping ${meta.name}...\n`,
    );
    try {
      const result = await scrapeVendor(meta);
      vendors.push(result.vendor);
      drinks.push(...result.drinks);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`  -> Failed (${message})\n`);
    }
  }

  return { vendors, drinks };
}

async function main() {
  const outputArg =
    getArgValue("--output") ?? "data/hotchocolatefest-vendors-and-drinks.json";
  const outputPath = path.resolve(process.cwd(), outputArg);

  const data = await scrapeAll();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`Saved ${data.vendors.length} vendors and ${data.drinks.length} drinks`);
  console.log(`Output: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
