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
const VIRTUAL_MAP_URL = `${BASE_URL}/virtual-map/`;

/** Nominatim `address` object when `addressdetails=1` (keys vary by result). */
export type NominatimAddressDetails = Record<string, string>;

/**
 * Rows from the Google My Maps KML (virtual map iframe).
 * `resolvedAddressDetails` is filled via Nominatim reverse geocode (`addressdetails=1`).
 */
type VirtualMapPlacemark = {
  neighbourhood: string;
  placemarkName: string;
  lng: number;
  lat: number;
  resolvedAddressDetails: NominatimAddressDetails | null;
};

type ReverseGeocodeCacheFile = {
  mid: string;
  updatedAt: string;
  /** Key: "lat,lng"; value: Nominatim `address` object */
  addresses: Record<string, NominatimAddressDetails>;
};

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

/** Google My Maps id from the embed iframe on the virtual map page. */
function extractMapMidFromVirtualMapHtml(html: string): string {
  const m =
    html.match(/maps\/d\/u\/\d\/embed\?[^"']*mid=([^&"']+)/i) ??
    html.match(/[?&]mid=([a-zA-Z0-9_-]+)/);
  if (!m?.[1]) {
    throw new Error("Could not find Google My Maps mid in virtual-map page HTML");
  }
  return m[1];
}

async function fetchVirtualMapKmlAndMid(): Promise<{ kml: string; mid: string }> {
  const pageHtml = await fetchHtml(VIRTUAL_MAP_URL);
  const mid = extractMapMidFromVirtualMapHtml(pageHtml);
  const kmlUrl = `https://www.google.com/maps/d/kml?mid=${encodeURIComponent(mid)}&forcekml=1`;
  const res = await fetch(kmlUrl, {
    headers: {
      "User-Agent": "hotchocolatefestpassport-data-scraper/1.0",
      Accept: "application/vnd.google-earth.kml+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch map KML: HTTP ${res.status}`);
  }
  const kml = await res.text();
  return { kml, mid };
}

function coordCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Nominatim requires a valid User-Agent identifying the app (see usage policy). */
const NOMINATIM_USER_AGENT =
  "hotchocolatefestpassport-scraper/1.0 (festival data; +https://hotchocolatefest.com/)";

function normalizeNominatimAddress(
  raw: Record<string, unknown> | undefined,
): NominatimAddressDetails {
  if (!raw || typeof raw !== "object") return {};
  const out: NominatimAddressDetails = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) continue;
    const s = typeof v === "string" ? v : String(v);
    if (s.trim()) out[k] = s.trim();
  }
  return out;
}

async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<NominatimAddressDetails> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Nominatim reverse failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { address?: Record<string, unknown> };
  return normalizeNominatimAddress(data.address);
}

const REVERSE_GEOCODE_CACHE_PATH = path.join(
  process.cwd(),
  "data",
  "virtual-map-reverse-geocode-cache.json",
);

async function enrichPlacemarksWithReverseAddresses(
  placemarks: VirtualMapPlacemark[],
  mapMid: string,
): Promise<void> {
  let cache: ReverseGeocodeCacheFile = {
    mid: mapMid,
    updatedAt: new Date().toISOString(),
    addresses: {},
  };
  try {
    const raw = await fs.readFile(REVERSE_GEOCODE_CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<ReverseGeocodeCacheFile>;
    if (parsed.mid === mapMid && parsed.addresses) {
      cache = parsed as ReverseGeocodeCacheFile;
    }
  } catch {
    /* no cache */
  }

  const needFetch: VirtualMapPlacemark[] = [];
  for (const p of placemarks) {
    const key = coordCacheKey(p.lat, p.lng);
    const hit = cache.addresses[key];
    if (hit && Object.keys(hit).length > 0) {
      p.resolvedAddressDetails = hit;
    } else {
      needFetch.push(p);
    }
  }

  process.stdout.write(
    `  -> Reverse geocoding ${needFetch.length} coordinates (${placemarks.length - needFetch.length} cached); Nominatim max ~1 req/s…\n`,
  );

  for (let i = 0; i < needFetch.length; i++) {
    const p = needFetch[i];
    const key = coordCacheKey(p.lat, p.lng);
    try {
      const addr = await reverseGeocodeNominatim(p.lat, p.lng);
      p.resolvedAddressDetails =
        Object.keys(addr).length > 0 ? addr : null;
      if (p.resolvedAddressDetails) {
        cache.addresses[key] = p.resolvedAddressDetails;
      }
      cache.updatedAt = new Date().toISOString();
    } catch {
      p.resolvedAddressDetails = null;
    }
    await fs.writeFile(
      REVERSE_GEOCODE_CACHE_PATH,
      `${JSON.stringify(cache, null, 2)}\n`,
      "utf8",
    );
    if (i < needFetch.length - 1) {
      await sleep(1100); // adhere to Nominatim usage policy of 1 req/s (https://operations.osmfoundation.org/policies/nominatim/)
    }
  }

  for (const p of placemarks) {
    if (
      !p.resolvedAddressDetails ||
      Object.keys(p.resolvedAddressDetails).length === 0
    ) {
      const key = coordCacheKey(p.lat, p.lng);
      const hit = cache.addresses[key];
      if (hit && Object.keys(hit).length > 0) {
        p.resolvedAddressDetails = hit;
      }
    }
  }
}

/** Omit POI / country noise when reading Nominatim `address` fields. */
const NOMINATIM_ADDRESS_MATCH_SKIP = new Set([
  "amenity",
  "shop",
  "tourism",
  "country",
  "country_code",
  "ISO3166-2-lvl4",
  "state",
  "county",
]);

const NOMINATIM_ADDRESS_MATCH_ORDER = [
  "house_number",
  "road",
  "suburb",
  "neighbourhood",
  "quarter",
  "city",
  "town",
  "village",
  "postcode",
] as const;

/** Build one comparable string from Nominatim `address` fields (not `display_name`). */
function nominatimAddressToMatchLine(details: NominatimAddressDetails): string {
  const used = new Set<string>();
  const parts: string[] = [];
  for (const k of NOMINATIM_ADDRESS_MATCH_ORDER) {
    const v = details[k];
    if (v != null && String(v).trim()) {
      parts.push(String(v).trim());
      used.add(k);
    }
  }
  for (const [k, v] of Object.entries(details)) {
    if (used.has(k) || NOMINATIM_ADDRESS_MATCH_SKIP.has(k)) continue;
    if (v != null && String(v).trim()) {
      parts.push(String(v).trim());
    }
  }
  return parts.join(", ");
}

/** Match vendor `Location:` line to Nominatim structured `address`. */
function addressMatchScoreFromDetails(
  vendorAddress: string,
  details: NominatimAddressDetails | null,
): number {
  if (!details || Object.keys(details).length === 0) return 0;

  const hn = details.house_number?.trim().toLowerCase();
  const vn = primaryStreetNumber(vendorAddress);
  if (hn && vn && hn !== vn) return 0;

  const line = nominatimAddressToMatchLine(details);
  if (!line) return 0;
  return addressMatchScore(vendorAddress, line);
}

/** Normalize for token overlap / containment checks between vendor and geocoded lines. */
function normalizeAddressForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''′]/g, "'")
    .replace(/\s*&\s*/g, " and ")
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ADDRESS_TOKEN_STOP = new Set([
  "the",
  "at",
  "and",
  "or",
  "of",
  "in",
  "a",
  "an",
  "to",
]);

function addressMatchTokens(s: string): Set<string> {
  const n = normalizeAddressForMatch(s);
  return new Set(
    n
      .split(/\s+/)
      .filter((t) => t.length > 1 && !ADDRESS_TOKEN_STOP.has(t)),
  );
}

/** First plausible civic number in the string (used to reject wrong placemarks). */
function primaryStreetNumber(s: string): string | undefined {
  const m = s.match(/\b(\d{1,5}[a-z]?)\b/i);
  return m ? m[1].toLowerCase() : undefined;
}

/**
 * Score how well a festival site address line matches a normalized address string
 * (e.g. built from Nominatim `address` fields).
 */
function addressMatchScore(vendorAddress: string, geocodedAddress: string): number {
  if (!vendorAddress || !geocodedAddress) return 0;

  const vNorm = normalizeAddressForMatch(vendorAddress);
  const gNorm = normalizeAddressForMatch(geocodedAddress);
  if (vNorm.length >= 8 && (gNorm.includes(vNorm) || vNorm.includes(gNorm))) {
    return 1;
  }

  const vn = primaryStreetNumber(vendorAddress);
  const gn = primaryStreetNumber(geocodedAddress);
  if (vn && gn && vn !== gn) {
    return 0;
  }

  const vTokens = addressMatchTokens(vendorAddress);
  const gTokens = addressMatchTokens(geocodedAddress);
  if (vTokens.size === 0 || gTokens.size === 0) return 0;

  let inter = 0;
  for (const t of vTokens) {
    if (gTokens.has(t)) inter += 1;
  }
  const union = vTokens.size + gTokens.size - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Pick neighbourhood from the placemark whose reverse-geocoded address best matches the vendor line.
 */
function resolveNeighbourhoodFromVirtualMap(
  vendorAddress: string,
  placemarks: VirtualMapPlacemark[],
  directoryFallback: string,
): string {
  const v = vendorAddress.trim();
  const fallback = directoryFallback.split(",")[0].trim();
  if (!v) {
    return fallback;
  }

  let best: { neighbourhood: string; score: number } | null = null;
  for (const p of placemarks) {
    const score = addressMatchScoreFromDetails(v, p.resolvedAddressDetails);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { neighbourhood: p.neighbourhood, score };
    }
  }

  const MIN_SCORE = 0.2;
  if (best && best.score >= MIN_SCORE) {
    return best.neighbourhood;
  }

  return fallback;
}

/**
 * Parse KML from Google My Maps (linked from the virtual map iframe).
 * Folder names match sidebar neighbourhood labels, e.g. "Westside / Kerrisdale".
 * Point coordinates are KML order: longitude, latitude (optional altitude).
 */
function parseKmlPlacemarks(kml: string): VirtualMapPlacemark[] {
  const $ = cheerio.load(kml, { xml: { xmlMode: true } });
  const rows: VirtualMapPlacemark[] = [];

  $("Folder").each((_i, folderEl) => {
    const $folder = $(folderEl);
    const neighbourhood = normalizeWhitespace(
      $folder.children("name").first().text(),
    );
    if (!neighbourhood || neighbourhood === "Hot Chocolate Fest 2026") {
      return;
    }

    $folder.children("Placemark").each((_j, pmEl) => {
      const $pm = $(pmEl);
      const placemarkName = normalizeWhitespace($pm.children("name").first().text());
      if (!placemarkName) {
        return;
      }

      const coordText = normalizeWhitespace($pm.find("coordinates").first().text());
      const parts = coordText
        .split(/[,\s]+/)
        .map((x) => parseFloat(x))
        .filter((n) => !Number.isNaN(n));
      if (parts.length < 2) {
        return;
      }
      const lng = parts[0];
      const lat = parts[1];

      rows.push({
        neighbourhood,
        placemarkName,
        lng,
        lat,
        resolvedAddressDetails: null,
      });
    });
  });

  return rows;
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
      host.includes("twitter.com") ||
      host.includes("youtube.com") ||
      host.includes("youtu.be");
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
  placemarks: VirtualMapPlacemark[],
  directoryFallbackNeighbourhood: string,
): VendorLocation {
  const $ = cheerio.load(`<div>${blockHtml}</div>`);
  const title = normalizeWhitespace($("h3").first().text());

  const root = $("div").first();
  const detailsParagraph = root
    .find("p")
    .filter((_i, el) => /Location:/i.test($(el).text()))
    .first();
  const detailsText = (() => {
    if (detailsParagraph.length) {
      return normalizeWhitespace(detailsParagraph.text());
    }
    const clone = root.clone();
    clone.find("a").each((_i, el) => {
      if (normalizeWhitespace($(el).text()) === "Directions") {
        $(el).remove();
      }
    });
    return normalizeWhitespace(clone.text());
  })();

  // Phone lines may use "Tel:", "Telephone:", or "Daily Telephone:" (longest label first in alternations).
  const phoneLabel = "(?:Daily Telephone|Telephone|Tel)";

  const addressMatch = detailsText.match(
    new RegExp(
      `Location:\\s*(.+?)(?=Hours:|${phoneLabel}:|Email:|$)`,
      "i",
    ),
  );
  const hoursMatch = detailsText.match(
    new RegExp(`Hours:\\s*(.+?)(?=${phoneLabel}:|Email:|$)`, "i"),
  );
  const phoneMatch = detailsText.match(
    new RegExp(`${phoneLabel}:\\s*([^\\s].+?)(?=Email:|$)`, "i"),
  );

  const emailParagraph = root
    .find("p")
    .filter((_i, el) => /Email:/i.test($(el).text()))
    .first();
  const emailSourceText = emailParagraph.length
    ? normalizeWhitespace(emailParagraph.text())
    : detailsText;
  const emailMatch = emailSourceText.match(
    /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  );

  const mapsLink = root
    .find("a")
    .filter((_i, el) => normalizeWhitespace($(el).text()) === "Directions")
    .first()
    .attr("href");

  const address = addressMatch ? normalizeWhitespace(addressMatch[1]) : "";
  const neighbourhood = resolveNeighbourhoodFromVirtualMap(
    address,
    placemarks,
    directoryFallbackNeighbourhood,
  );

  return {
    name: title,
    address,
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
  placemarks: VirtualMapPlacemark[],
): VendorLocation[] {
  const directoryFallbackNeighbourhood = neighbourhoods.join(", ");
  const sectionHtml = getSectionWidgetHtml($, "Location and Hours");
  if (!sectionHtml) {
    return [
      {
        name: "",
        address: "",
        neighbourhood: resolveNeighbourhoodFromVirtualMap(
          "",
          placemarks,
          directoryFallbackNeighbourhood,
        ),
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

  return chunks.map((block) =>
    parseLocationBlock(block, placemarks, directoryFallbackNeighbourhood),
  );
}

function parseVendorDescription($: cheerio.CheerioAPI): string {
  const aboutHtml = getSectionWidgetHtml($, "About Vendor");
  if (!aboutHtml) return "";

  const section$ = cheerio.load(`<div>${aboutHtml}</div>`);
  return normalizeWhitespace(section$("div").text());
}

async function scrapeVendor(
  meta: DirectoryVendorMeta,
  placemarks: VirtualMapPlacemark[],
): Promise<{ vendor: Vendor; drinks: Drink[] }> {
  const html = await fetchHtml(meta.url);
  const $ = cheerio.load(html);

  const name =
    normalizeWhitespace($("h1").first().text()) ||
    meta.name;

  const description = parseVendorDescription($);
  const socialLinks = extractSocialLinks($, "About Vendor");
  const locations = parseLocations($, meta.neighbourhoods, placemarks);
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
  process.stdout.write("Loading virtual map (KML) for neighbourhood lookup...\n");
  const { kml, mid } = await fetchVirtualMapKmlAndMid();
  const placemarks = parseKmlPlacemarks(kml);
  process.stdout.write(
    `  -> ${placemarks.length} map placemarks in ${new Set(placemarks.map((p) => p.neighbourhood)).size} neighbourhoods\n`,
  );
  await enrichPlacemarksWithReverseAddresses(placemarks, mid);

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
      const result = await scrapeVendor(meta, placemarks);
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
