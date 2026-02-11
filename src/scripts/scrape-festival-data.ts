/**
 * One-off scraper for hotchocolatefest.com.
 * Fetches vendor directory, each vendor page (locations, social), and list of flavours.
 * Run: pnpm exec tsx src/scripts/scrape-festival-data.ts
 * Writes: festival-data.json
 */
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

const BASE = "https://hotchocolatefest.com";

type Location = {
  address: string;
  neighbourhood: string;
  hours: string;
  tel: string;
  email: string;
  googleMapsLink: string;
};

type Vendor = {
  name: string;
  dietaryOptions: string[];
  openLate: boolean;
  takeoutOnly: boolean;
  socialLinks: string[];
  locations: Location[];
};

type Drink = {
  id: string;
  name: string;
  availableDateStart: string;
  availableDateEnd: string;
  description: string;
  dietaryOptions: string;
  vendorName: string;
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "HotChocolateFestPassport/1.0 (data import)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function normalizeName(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/&#038;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8216;/g, "'")
    .trim();
}

const MONTH_NAMES: Record<string, string> = {
  January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
  July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
};

function parseDateRange(text: string): { start: string; end: string } {
  // "Available January 17 – 29, 2026" or "January 17 – February 14, 2026" or "January 17 – 31, 2026"
  const match = text.match(
    /(?:Available\s+)?(\w+)\s+(\d{1,2})\s*[–-]\s*(\w+\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}(?:,\s*\d{4})?)/i
  );
  if (!match) return { start: "", end: "" };
  const startMonth = match[1].trim();
  const startDay = match[2].trim();
  let endPart = match[3].trim(); // e.g. "29, 2026" or "February 14, 2026"
  const yearMatch = text.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : "2026";
  const toIso = (monthStr: string, dayStr: string, y: string) => {
    const mon = MONTH_NAMES[monthStr] || "01";
    const day = dayStr.padStart(2, "0");
    return `${y}-${mon}-${day}`;
  };
  const start = toIso(startMonth, startDay, year);
  const endDayMonthMatch = endPart.match(/^(\w+)\s+(\d{1,2}),?\s*(\d{4})?$/);
  if (endDayMonthMatch) {
    return { start, end: toIso(endDayMonthMatch[1], endDayMonthMatch[2], endDayMonthMatch[3] || year) };
  }
  const endDayOnly = endPart.match(/^(\d{1,2}),?\s*(\d{4})?$/);
  if (endDayOnly) {
    return { start, end: toIso(startMonth, endDayOnly[1], endDayOnly[2] || year) };
  }
  return { start, end: endPart };
}

async function scrapeVendorDirectory(): Promise<{ name: string; slug: string; vegan: boolean; glutenFree: boolean; dairyFree: boolean; openLate: boolean; takeoutOnly: boolean }[]> {
  const html = await fetchHtml(`${BASE}/vendor-directory/`);
  const $ = cheerio.load(html);
  const vendors: { name: string; slug: string; vegan: boolean; glutenFree: boolean; dairyFree: boolean; openLate: boolean; takeoutOnly: boolean }[] = [];
  $("a[href*='/vendors/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const slugMatch = href.match(/\/vendors\/([^/]+)\/?$/);
    if (!slugMatch) return;
    const slug = slugMatch[1];
    const nameEl = $(el).find("h4").first();
    const name = normalizeName(nameEl.text().trim() || $(el).text().trim());
    if (!name || name.length < 2) return;
    const card = $(el).closest("div").length ? $(el).closest("div") : $(el).parent();
    const cardHtml = card.length ? card.html() || "" : "";
    const vegan = /Vegan|vegan/.test(cardHtml) || $(el).find('img[alt*="Vegan"]').length > 0;
    const glutenFree = /Gluten[- ]?[Ff]ree|gluten-free/.test(cardHtml) || $(el).find('img[alt*="Gluten"]').length > 0;
    const dairyFree = /Dairy[- ]?[Ff]ree|dairy-free/.test(cardHtml) || $(el).find('img[alt*="Dairy"]').length > 0;
    const openLate = /Open Late|open late/.test(cardHtml) || $(el).find('img[alt*="Open Late"]').length > 0;
    const takeoutOnly = /Takeout|Take-out|takeout/.test(cardHtml) || $(el).find('img[alt*="Takeout"], img[alt*="Take-out"]').length > 0;
    if (!vendors.some((v) => v.slug === slug)) {
      vendors.push({ name, slug, vegan, glutenFree, dairyFree, openLate, takeoutOnly });
    }
  });
  return vendors;
}

async function scrapeVendorPage(slug: string, directoryMeta: { name: string; vegan: boolean; glutenFree: boolean; dairyFree: boolean; openLate: boolean; takeoutOnly: boolean }): Promise<{ locations: Location[]; socialLinks: string[] }> {
  const html = await fetchHtml(`${BASE}/vendors/${slug}/`);
  const $ = cheerio.load(html);
  const locations: Location[] = [];
  const socialLinks: string[] = [];

  $("a[href*='goo.gl/maps'], a[href*='google.com/maps']").each((_, el) => {
    const mapUrl = $(el).attr("href") || "";
    let block = $(el).parent();
    while (block.length) {
      const t = block.text();
      const locCount = (t.match(/Location:\s*/gi) || []).length;
      if (locCount === 1 && /Location:\s*/i.test(t)) break;
      block = block.parent();
    }
    if (!block.length) block = $(el).parent();
    const text = block.text().replace(/\s+/g, " ");
    let neighbourhood = "";
    block.find("strong").first().each((_, s) => { neighbourhood = normalizeName($(s).text().trim()); });
    if (!neighbourhood) block.prevAll("h3, h4").first().each((_, h) => { neighbourhood = normalizeName($(h).text().trim()); });
    const addressMatch = text.match(/Location:\s*([^H]+?)(?=Hours:)/i);
    const hoursMatch = text.match(/Hours:\s*([^T]+?)(?=Tel(?:ephone)?:)/i) || text.match(/Hours:\s*([^E]+?)(?=Email:)/i);
    const telMatch = text.match(/Tel(?:ephone)?:\s*([^E]+?)(?=Email:)/i) || text.match(/Tel:\s*([\d\-N\/A\s]+)/i);
    const emailMatch = text.match(/Email:\s*([^\s]+@[^\s]+?)(?=\s*Directions|\s*Location:|$)/i) || text.match(/Email:\s*([^\s]+@[^\s]+)/i);
    let email = emailMatch ? emailMatch[1].trim() : "";
    if (email) email = email.replace(/Directions$/i, "").trim();
    const addr = addressMatch ? normalizeName(addressMatch[1]) : "";
    if (!neighbourhood && addr) {
      const m = addr.match(/^([^,]+)/);
      if (m) neighbourhood = normalizeName(m[1]).slice(0, 60);
    }
    locations.push({
      address: addr,
      neighbourhood: neighbourhood || "—",
      hours: hoursMatch ? normalizeName(hoursMatch[1]) : "",
      tel: telMatch ? normalizeName(telMatch[1]) : "",
      email,
      googleMapsLink: mapUrl,
    });
  });

  if (locations.length > 0 && locations.every((loc) => !loc.address && loc.googleMapsLink)) {
    const fullHtml = $.html();
    const mapLinks = $("a[href*='goo.gl/maps'], a[href*='google.com/maps']").toArray();
    const hrefPositions: number[] = [];
    mapLinks.forEach((el) => {
      const href = $(el).attr("href") || "";
      const idx = fullHtml.indexOf(href);
      if (idx >= 0) hrefPositions.push(idx);
    });
    locations.length = 0;
    mapLinks.forEach((el, idx) => {
      const mapUrl = $(el).attr("href") || "";
      const start = idx > 0 ? hrefPositions[idx - 1] : Math.max(0, fullHtml.indexOf("Location and Hours"));
      const end = hrefPositions[idx] !== undefined ? hrefPositions[idx] + mapUrl.length + 20 : fullHtml.length;
      const blockHtml = fullHtml.slice(start, end);
      const text = cheerio.load(blockHtml).text().replace(/\s+/g, " ");
      const addressMatch = text.match(/Location:\s*([^H]+?)(?=Hours:)/i);
      const hoursMatch = text.match(/Hours:\s*([^T]+?)(?=Tel:)/i) || text.match(/Hours:\s*([^E]+?)(?=Email:)/i);
      const telMatch = text.match(/Tel(?:ephone)?:\s*([^E]+?)(?=Email:)/i) || text.match(/Tel:\s*([\d\-N\/A\s]+)/i);
      const emailMatch = text.match(/Email:\s*([^\s]+@[^\s]+?)(?=Directions|Location:)/i) || text.match(/Email:\s*([^\s]+@[^\s]+)/i);
      let neighbourhood = "";
      const strongMatch = blockHtml.match(/<strong[^>]*>([^<]+)<\/strong>/);
      if (strongMatch) neighbourhood = normalizeName(strongMatch[1]);
      const addr = addressMatch ? normalizeName(addressMatch[1]) : "";
      if (!neighbourhood && addr) {
        const m = addr.match(/^([^,]+)/);
        if (m) neighbourhood = normalizeName(m[1]).slice(0, 60);
      }
      locations.push({
        address: addr,
        neighbourhood: neighbourhood || "—",
        hours: hoursMatch ? normalizeName(hoursMatch[1]) : "",
        tel: telMatch ? normalizeName(telMatch[1]) : "",
        email: emailMatch ? emailMatch[1].replace(/Directions$/i, "").trim() : "",
        googleMapsLink: mapUrl,
      });
    });
  }

  $("a[href*='instagram.com'], a[href*='facebook.com'], a[href*='twitter.com'], a[href*='x.com']").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !socialLinks.includes(href)) socialLinks.push(href);
  });
  const aboutSection = $("h2, h3").filter((_, el) => /About|Vendor/.test($(el).text())).first();
  if (aboutSection.length) {
    aboutSection.nextAll().find("a[href^='http']").each((_, el) => {
      const href = $(el).attr("href");
      if (href && (href.includes("instagram") || href.includes("facebook") || href.includes("twitter") || href.includes("x.com")) && !socialLinks.includes(href)) {
        socialLinks.push(href);
      }
    });
  }

  return { locations, socialLinks };
}

async function scrapeFlavours(): Promise<Drink[]> {
  const drinks: Drink[] = [];
  let page = 1;
  let hasMore = true;
  const seenIds = new Set<string>();

  while (hasMore) {
    const url = page === 1 ? `${BASE}/list-of-flavours/` : `${BASE}/list-of-flavours/page/${page}/`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    let foundOnPage = 0;

    $("h3, h4").each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const match = text.match(/^#(\d+)\s*[–\-]\s*(.+)$/);
      if (!match) return;
      const idNum = match[1];
      const name = normalizeName(match[2]);
      const id = `#${idNum.padStart(3, "0")}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);

      let body = $el.nextUntil("h3, h4").text();
      if (!body.trim()) {
        const $parent = $el.parent();
        body = $parent.text();
      }
      body = body.trim();
      const availableMatch = body.match(/Available\s+[^\n]+?(?=\s|$)/i) || body.match(/(January|February|March)[^\n]+?\d{4}/);
      const dateText = availableMatch ? availableMatch[0] : "";
      const { start, end } = parseDateRange(dateText + " " + body);

      const vendorLink = $el.nextAll().find('a[href*="/vendors/"]').first();
      let vendorName = normalizeName(vendorLink.text().trim());

      let description = body
        .replace(/Available\s+[^\n]+/i, "")
        .replace(/\[[\w\s’'&]+\]\([^)]+\)/g, "")
        .replace(/^\s*#\d+[^\n]*/m, "")
        .trim();
      const dietaryLine = description.match(/\*([^*]+)\*/);
      let dietaryOptions = "";
      if (dietaryLine) {
        dietaryOptions = normalizeName(dietaryLine[1]);
        description = description.replace(/\*[^*]+\*/g, "").trim();
      }
      description = normalizeName(description).replace(/\s+/g, " ");

      drinks.push({
        id,
        name: `${id} – ${name}`,
        availableDateStart: start,
        availableDateEnd: end,
        description,
        dietaryOptions,
        vendorName,
      });
      foundOnPage++;
    });

    if (foundOnPage === 0) hasMore = false;
    else page++;
    if (page > 20) hasMore = false;
  }

  return drinks.sort((a, b) => parseInt(a.id.replace(/#/, ""), 10) - parseInt(b.id.replace(/#/, ""), 10));
}

async function main() {
  console.log("Fetching vendor directory...");
  const directoryVendors = await scrapeVendorDirectory();
  console.log(`Found ${directoryVendors.length} vendors.`);

  const vendors: Vendor[] = [];
  for (let i = 0; i < directoryVendors.length; i++) {
    const v = directoryVendors[i];
    process.stdout.write(`\rVendor ${i + 1}/${directoryVendors.length}: ${v.slug}`);
    const { locations, socialLinks } = await scrapeVendorPage(v.slug, v);
    const dietaryOptions: string[] = [];
    if (v.vegan) dietaryOptions.push("vegan");
    if (v.glutenFree) dietaryOptions.push("gluten-free");
    if (v.dairyFree) dietaryOptions.push("dairy-free");
    vendors.push({
      name: v.name,
      dietaryOptions,
      openLate: v.openLate,
      takeoutOnly: v.takeoutOnly,
      socialLinks,
      locations,
    });
  }
  console.log("");

  console.log("Fetching list of flavours...");
  const drinks = await scrapeFlavours();
  console.log(`Found ${drinks.length} drinks.`);

  const out = {
    vendors,
    drinks,
    scrapedAt: new Date().toISOString(),
  };

  const outPath = path.join(process.cwd(), "festival-data.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
