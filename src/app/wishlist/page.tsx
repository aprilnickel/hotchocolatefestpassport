import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { wishlistItems, drinks, vendors } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { RemoveFromWishlistButton } from "@/components/drink-actions/remove-from-wishlist-button";

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const rows = await db
    .select({
      id: wishlistItems.id,
      drinkId: drinks.id,
      drinkName: drinks.name,
      drinkSlug: drinks.slug,
      flavourNotes: drinks.flavourNotes,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      neighbourhood: vendors.neighbourhood,
    })
    .from(wishlistItems)
    .innerJoin(drinks, eq(wishlistItems.drinkId, drinks.id))
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(wishlistItems.userId, session.user.id))
    .orderBy(asc(drinks.name));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold hidden md:block">My Wishlist</h1>
      {rows.length === 0 ? (
        <p>
          Your wishlist is empty. Browse{" "}
          <Link href="/drinks" className="font-medium underline">
            festival drinks
          </Link>{" "}
          and add some to try.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="relative flex items-center gap-3 rounded-lg border border-burgundy/50 p-4 shadow-md transition hover:border-burgundy/70 hover:shadow-lg"
            >
              <RemoveFromWishlistButton
                drinkId={r.drinkId}
                drinkName={r.drinkName}
                className="absolute top-2 right-2"
              />
              <Link
                href={`/drinks/${r.drinkSlug}`}
                className="min-w-0 flex-1 pr-8"
              >
                <div className="font-medium">{r.drinkName}</div>
                <div className="text-sm">
                  {r.vendorName}
                  {r.neighbourhood ? ` · ${r.neighbourhood}` : ""}
                </div>
                {r.flavourNotes && (
                  <div className="text-sm opacity-80">{r.flavourNotes}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
