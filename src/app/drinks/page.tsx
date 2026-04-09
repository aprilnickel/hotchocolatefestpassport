import {
  getDrinksWithVendors,
  getWishlistDrinkIds,
  type DrinkWithVendor,
} from "@/lib/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DrinkCard } from "./drink-card";

export const metadata = {
  title: "Drinks | Sip Fest Passport",
  description: "Browse all drinks offered at the Vancouver Hot Chocolate Festival.",
};

export default async function DrinksPage() {
  const [drinks, session] = await Promise.all([
    getDrinksWithVendors(),
    auth.api.getSession({ headers: await headers() }),
  ]);
  const wishlistIds = session?.user?.id
    ? await getWishlistDrinkIds(session.user.id)
    : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold hidden md:block">Festival Drinks</h1>
      {drinks.length === 0 ? (
        <p>
          There are no drinks yet. Check back later for updates.
        </p>
      ) : (
        <ul className="space-y-3">
          {drinks.map((d: DrinkWithVendor) => (
            <DrinkCard
              key={d.id}
              drink={d}
              inWishlist={wishlistIds?.has(d.id) ?? false}
              showWishlistButton={!!session?.user}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
