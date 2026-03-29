# Festival Data: Source and Re-seeding

## Where the data comes from

- **Official festival site**: [hotchocolatefest.com](https://hotchocolatefest.com) lists participating vendors, locations, and their special hot chocolate drinks each year.
- **This app** does not sync live with that site. Drink and vendor data is loaded via a **seed script** (small demo set) or a **scrape + import** pipeline so the app works offline and you control when to refresh.

## Demo data: seed

- **Placeholder data**: The seed script (`pnpm run db:seed`) loads a small set of example vendors and drinks defined in `src/scripts/seed.ts`. Use this for local development.

## Production data: scraper and import

For a real festival year, use the scraper to produce JSON from the official site, then import that JSON into Postgres.

1. **Scrape** (`src/scripts/scrape-hotchocolatefest.ts`)
   - Fetches the vendor directory and drink listings from hotchocolatefest.com, resolves location/neighbourhood data (including the virtual map where applicable), and writes a single normalized JSON file: `{ vendors: [...], drinks: [...] }`.
   - Run: `pnpm run data:scrape`
   - Optional output path: `pnpm run data:scrape -- --output data/your-file.json`. If omitted, the script writes `data/hotchocolatefest-vendors-and-drinks.json` (see terminal output for the resolved path).
   - Network access is required; the run may take a while because of HTTP and optional geocoding/cache behaviour documented in the script.

2. **Import** (`src/scripts/import-festival-data.ts`)
   - Reads that JSON file and inserts rows into `vendors`, `vendor_locations`, `vendor_urls`, and `drinks` (matching the current Drizzle schema).
   - Requires `DATABASE_URL`. With **`--force`**, it **deletes all vendors first** (cascades to drinks, wishlist entries for those drinks, journal entries, vendor locations, and vendor URLs)—plan accordingly.
   - Run: `pnpm run db:import -- --force --file path/to/your-scraped.json`
   - Example: `pnpm run db:import -- --force --file data/hotchocolatefest-vendors-and-drinks-scraped-20260324.json`

Together, **scrape → save JSON → migrate DB if needed → import with `--force --file`** is the supported path for refreshing production-style data. You can also obtain JSON by other means and import it as long as it matches the shape the importer expects (see `src/scripts/import-festival-data.ts` and the scraper’s output types).

## Re-seeding for a new festival year

1. **Option A – Scrape and import (recommended for full festival data)**
   - Run `pnpm run data:scrape` (optionally with `--output`) to write a new JSON file.
   - Run `pnpm run db:import -- --force --file path/to/that.json` with `DATABASE_URL` set.

2. **Option B – Replace seed data only**
   - Update `src/scripts/seed.ts`: change the `placeholderVendors` and `placeholderDrinks` arrays with the new year’s minimal demo data.
   - Clear existing festival data if needed, then run `pnpm run db:seed`. The seed script skips when vendors already exist unless you clear tables first.

3. **Option C – Clear and re-seed**
   - To avoid duplicates when using the seed, clear the `drinks` and `vendors` tables (or rely on import’s `--force` which clears vendors). Then run `pnpm run db:seed` or the import command above.

**User data (wishlist / journal)**

- Wishlist and journal rows are per user. Import with `--force` removes all vendors (and cascaded drinks, locations, URLs, and wishlist/journal rows tied to those drinks). The seed script only adds data when no vendors exist; it does not delete user rows by itself, but clearing tables or re-importing can cascade deletes as above.

## Data as of

- Consider adding a “Data as of [date]” or “Festival year” note in the UI or README so users know which festival edition the list reflects. You can store a simple key in the DB or in env (e.g. `FESTIVAL_YEAR=2026`) and display it in the app.
