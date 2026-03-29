# ☕ Sip Fest Passport

Companion web app for the Vancouver Hot Chocolate Festival. Browse drinks, maintain a wishlist, and maintain a journal of drinks you've tried.

As a long-time enjoyer of Vancouver's Hot Chocolate Festival,

## 🌱 Upcoming Features

- sign in with Apple
- support for multiple "sip fest" events (multi-tenant)
- search & filter drinks
- add a note to your journal entry
- and more!

## 🧾 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

In short:

- You are free to use, modify, and run this project
- If you modify the code and make it available to users (including via a hosted service), you must also make your source code available under the same license
- Any derivative work must also be licensed under AGPLv3

For full details, see the [./LICENSE](LICENSE) file.

## 🔁 Contributions & Forks

If you:

- fork this project
- run your own instance
- or build new features

You are encouraged (but not required) to:

- contribute improvements back
- share what you’ve built
- open a PR or start a discussion

If you’re running a public instance, AGPL requires that your source code be made available to your users.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and auth variables.
2. Run `pnpm install`.
3. Run `pnpm run db:push` (or `db:migrate`) then `pnpm run db:seed`.
4. Run `pnpm run dev`.

## Scripts

- `pnpm run dev` — Start dev server (Turbopack)
- `pnpm run build` / `pnpm run start` — Production
- `pnpm run db:generate` — Generate Drizzle migrations
- `pnpm run db:push` — Push schema to DB (dev)
- `pnpm run db:migrate` — Run migrations
- `pnpm run db:seed` — Seed vendors and drinks
- `pnpm run db:studio` — Drizzle Studio

## Festival data

See [docs/DATA.md](docs/DATA.md) for where drink/vendor data comes from and how to re-seed for new festival years.

### Scrape latest festival vendor/drink data

Use the scraper to pull live data from [hotchocolatefest.com](https://hotchocolatefest.com/) and write a JSON file containing `vendors` and `drinks` arrays.

1. Install dependencies:
   - `pnpm install`
2. Run scraper (default output path):
   - `pnpm run data:scrape`
3. Optional custom output path:
   - `pnpm run data:scrape -- --output data/hotchocolatefest.json`

Default output file:

- `data/hotchocolatefest-vendors-and-drinks.json`

Notes:

- **Neighbourhood** (per location, a single value) comes from the official [Virtual Map](https://hotchocolatefest.com/virtual-map/) Google My Maps **KML** (same pins as the embedded map). For each placemark, coordinates are **reverse geocoded** with [OpenStreetMap Nominatim](https://nominatim.org/) to an address string; that string is **matched** to the vendor page’s `Location:` line (token overlap + street number check). Results are cached in `data/virtual-map-reverse-geocode-cache.json` (keyed by map id + coordinates) so re-runs do not re-hit Nominatim for every point. Respect Nominatim’s usage policy (the script waits ~1s between uncached requests). If no address match clears the threshold, the scraper falls back to the first area from the vendor directory listing.
- Dietary options and service flags (`openLate`, `takeoutOnly`) come from the Vendor Directory.
- Drink date ranges are parsed from each vendor page's "Available ..." line.

## Deployment (Vercel)

1. Create a PostgreSQL database (Neon, Supabase, or Railway) and set `DATABASE_URL` in Vercel.
2. Set `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`) and `BETTER_AUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`).
3. Set `NEXT_PUBLIC_APP_URL` to the same production URL if you use the auth client (e.g. magic link redirects).
4. Deploy: connect the repo to Vercel and deploy. Run migrations once: either `pnpm run db:push` against production `DATABASE_URL` or apply the SQL in `drizzle/0000_initial.sql` manually.
5. Run `pnpm run db:seed` once against production (or import your festival data).
6. Optional: add error monitoring (e.g. Vercel Analytics or Sentry).
