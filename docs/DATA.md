# Festival Data: Source and Re-seeding

## Where the data comes from

- **Official festival site**: [hotchocolatefest.com](https://hotchocolatefest.com) lists participating vendors, locations, and their special hot chocolate drinks each year.
- **This app** does not sync live with that site. Drink and vendor data is loaded via a **seed script** (or manual import) so the app works offline and you control when to refresh.
- **Festival data JSON**: A structured JSON file at `data/festival-data.json` contains vendor and drink information that can be imported into the database.

## Current seed

- **Placeholder data**: The seed script (`pnpm run db:seed`) loads a small set of example vendors and drinks defined in `src/scripts/seed.ts`. Use this for local development.
- **Production**: For a real festival year, replace the placeholder arrays in `seed.ts` with data from the official site (manual copy, CSV, or a one-off scrape), or add a JSON/CSV file and update the seed to read from it.

## Festival data JSON structure

The `data/festival-data.json` file contains:

### Vendors
- `name`: Vendor name
- `slug`: URL-friendly identifier
- `dietaryOptions`: Boolean flags for vegan, gluten-free, dairy-free
- `openLate`: Whether vendor is open late
- `takeoutOnly`: Whether vendor only offers takeout
- `socialLinks`: Website, Instagram, Facebook URLs
- `locations`: Array of location objects with:
  - `address`: Full street address
  - `neighbourhood`: Area/neighbourhood name
  - `hours`: Operating hours
  - `tel`: Phone number
  - `email`: Email address
  - `googleMapsLink`: Google Maps URL

### Drinks
- `id`: Unique drink identifier
- `name`: Drink name
- `availableDateStart`: Start date (ISO format)
- `availableDateEnd`: End date (ISO format)
- `description`: Full description
- `flavourNotes`: Comma-separated flavour notes
- `dietaryOptions`: Boolean flags for vegan, gluten-free, dairy-free
- `vendorName`: Name of the vendor offering this drink

## Re-seeding for a new festival year

1. **Option A – Scrape and import from JSON**

   - Run the scraper script to fetch data from hotchocolatefest.com:
     ```
     pnpm run scrape:festival
     ```
   - Or manually update the JSON file at `data/festival-data.json` with the new year's data.
   - Update `src/scripts/seed.ts` to read from `data/festival-data.json` instead of using placeholder data.
   - Clear existing festival data (vendors and drinks), then run the seed:
     ```
     pnpm run db:seed
     ```

2. **Option B – Replace seed data directly**

   - Update `src/scripts/seed.ts`: change the `placeholderVendors` and `placeholderDrinks` arrays with the new year's data from hotchocolatefest.com.
   - Clear existing festival data (vendors and drinks), then run the seed again (see below).

3. **Option C – Clear and re-seed**

   - To avoid duplicates, clear the `drinks` and `vendors` tables (and optionally run the migration from scratch). Then run:
     - `pnpm run db:seed`
   - If you use the same script for the new year's data, make sure the script is idempotent or that you've cleared old rows first.

4. **User data**
   - Wishlist and sipped data are per user and are not removed by re-seeding. Only `vendors` and `drinks` are replaced/updated by the seed. If a drink or vendor is removed, existing wishlist/sipped rows may reference deleted IDs; the schema uses `ON DELETE CASCADE` for drink/vendor so removing a drink removes its wishlist/sipped rows.

## Data as of

- Consider adding a "Data as of [date]" or "Festival year" note in the UI or README so users know which festival edition the list reflects. You can store a simple key in the DB or in env (e.g. `FESTIVAL_YEAR=2026`) and display it in the app.
