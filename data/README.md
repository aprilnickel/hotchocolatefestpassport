# Festival Data Scraper

This directory contains the scraped festival data from hotchocolatefest.com.

## Files

- `festival-data.json` - Structured JSON file containing vendor and drink information

## JSON Structure

The JSON file contains two main arrays:

### Vendors

Each vendor has:
- `name` - Vendor name
- `slug` - URL-friendly identifier
- `dietaryOptions` - Object with boolean flags:
  - `vegan`
  - `glutenFree`
  - `dairyFree`
- `openLate` - Boolean indicating if open late
- `takeoutOnly` - Boolean indicating if takeout only
- `socialLinks` - Object with URLs:
  - `website`
  - `instagram`
  - `facebook`
- `locations` - Array of location objects:
  - `address`
  - `neighbourhood`
  - `hours`
  - `tel`
  - `email`
  - `googleMapsLink`

### Drinks

Each drink has:
- `id` - Unique identifier
- `name` - Drink name
- `availableDateStart` - ISO date string
- `availableDateEnd` - ISO date string
- `description` - Full description
- `flavourNotes` - Comma-separated flavour notes
- `dietaryOptions` - Same structure as vendor dietary options
- `vendorName` - Name of the vendor offering this drink

## Updating the Data

### Option 1: Run the Scraper

```bash
pnpm run scrape:festival
```

This will fetch the latest data from hotchocolatefest.com and update `festival-data.json`.

### Option 2: Manual Update

Manually edit `festival-data.json` with data from the official festival website.

## Importing into Database

After updating the JSON file, you can import it into the database by:

1. Updating `src/scripts/seed.ts` to read from this JSON file
2. Running the seed script: `pnpm run db:seed`

See [docs/DATA.md](../docs/DATA.md) for more details on seeding the database.
