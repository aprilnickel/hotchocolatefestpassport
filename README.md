# Hot Chocolate Festival Passport

Companion web app for the Vancouver Hot Chocolate Festival. Browse drinks, maintain a wishlist, and mark drinks as tasted.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and auth variables.
2. Run `pnpm install`.
3. Run `git init` if starting from scratch.
4. Run `pnpm run db:push` (or `db:migrate`) then `pnpm run db:seed`.
5. Run `pnpm run dev`.

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

## Deployment (Vercel)

1. Create a PostgreSQL database (Neon, Supabase, or Railway) and set `DATABASE_URL` in Vercel.
2. Set `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`) and `BETTER_AUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`).
3. Set `NEXT_PUBLIC_APP_URL` to the same production URL if you use the auth client (e.g. magic link redirects).
4. Deploy: connect the repo to Vercel and deploy. Run migrations once: either `pnpm run db:push` against production `DATABASE_URL` or apply the SQL in `drizzle/0000_initial.sql` manually.
5. Run `pnpm run db:seed` once against production (or import your festival data).
6. Optional: add error monitoring (e.g. Vercel Analytics or Sentry).
