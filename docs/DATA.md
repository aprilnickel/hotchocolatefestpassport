# Festival Data: Source and Re-seeding

## Where the data comes from

- **Official festival site**: [hotchocolatefest.com](https://hotchocolatefest.com) lists participating vendors, locations, and their special hot chocolate drinks each year.
- **This app** does not sync live with that site. Drink and vendor data is loaded via a **seed script** (or manual import) so the app works offline and you control when to refresh.

## Scraped festival data (JSON)

- **`festival-data.json`** at the project root contains scraped vendor and drink data from hotchocolatefest.com, suitable for importing into the database.
- **Structure**: `vendors` (name, dietaryOptions, openLate, takeoutOnly, socialLinks, locations with address/neighbourhood/hours/tel/email/googleMapsLink) and `drinks` (id, name, availableDateStart, availableDateEnd, description, dietaryOptions, vendorName).
- **To regenerate**: Run `pnpm exec tsx src/scripts/scrape-festival-data.ts` (requires network). The script fetches the vendor directory, each vendor page for locations and social links, and the list of flavours. Drink descriptions may be empty depending on the site’s HTML structure; you can fill them from the [List of Flavours](https://hotchocolatefest.com/list-of-flavours/) if needed.

## Current seed

- **Placeholder data**: The seed script (`pnpm run db:seed`) loads a small set of example vendors and drinks defined in `src/scripts/seed.ts`. Use this for local development.
- **Production**: For a real festival year, use the scraped `festival-data.json` (see above) or replace the placeholder arrays in `seed.ts` with data from the official site. Update the seed to read from the JSON file if you use it.

## Re-seeding for a new festival year

1. **Option A – Replace seed data**

   - Update `src/scripts/seed.ts`: change the `placeholderVendors` and `placeholderDrinks` arrays (or switch to reading from a JSON/CSV file) with the new year’s data from hotchocolatefest.com.
   - Clear existing festival data (vendors and drinks), then run the seed again (see below).

2. **Option B – Clear and re-seed**

   - To avoid duplicates, clear the `drinks` and `vendors` tables (and optionally run the migration from scratch). Then run:
     - `pnpm run db:seed`
   - If you use the same script for the new year’s data, make sure the script is idempotent or that you’ve cleared old rows first.

3. **User data**
   - Wishlist and sipped data are per user and are not removed by re-seeding. Only `vendors` and `drinks` are replaced/updated by the seed. If a drink or vendor is removed, existing wishlist/sipped rows may reference deleted IDs; the schema uses `ON DELETE CASCADE` for drink/vendor so removing a drink removes its wishlist/sipped rows.

## Data as of

- Consider adding a “Data as of [date]” or “Festival year” note in the UI or README so users know which festival edition the list reflects. You can store a simple key in the DB or in env (e.g. `FESTIVAL_YEAR=2026`) and display it in the app.
