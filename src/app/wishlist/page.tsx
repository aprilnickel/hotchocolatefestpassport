import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { wishlistItems, drinks, vendors } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { AddToWishlistButton } from "@/components/drink-actions/add-to-wishlist-button";

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
      <h1 className="mb-6 text-2xl font-bold">My wishlist</h1>
      {rows.length === 0 ? (
        <p className="text-neutral-600">
          Your wishlist is empty. Browse{" "}
          <Link href="/drinks" className="font-medium text-neutral-900 underline">
            festival drinks
          </Link>{" "}
          and add some to try.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <Link
                href={`/drinks/${r.drinkSlug}`}
                className="min-w-0 flex-1"
              >
                <div className="font-medium text-neutral-900">{r.drinkName}</div>
                <div className="text-sm text-neutral-600">
                  {r.vendorName}
                  {r.neighbourhood ? ` · ${r.neighbourhood}` : ""}
                </div>
                {r.flavourNotes && (
                  <div className="text-sm text-neutral-500">{r.flavourNotes}</div>
                )}
              </Link>
              <AddToWishlistButton drinkId={r.drinkId} inWishlist={true} verbose />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
