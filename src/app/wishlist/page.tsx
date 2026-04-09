import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { RemoveFromWishlistButton } from "@/app/wishlist/remove-from-wishlist-button";
import { getWishlistItemsByUser } from "@/lib/queries";

export const metadata = {
  title: "Wishlist | Sip Fest Passport",
  description: "Find all the drinks you want to try here.",
};

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const items = await getWishlistItemsByUser(session.user.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold hidden md:block">My Wishlist</h1>
      {items?.length === 0 ? (
        <p>
          Your wishlist is empty. Browse{" "}
          <Link href="/drinks" className="font-medium underline">
            festival drinks
          </Link>{" "}
          and add some to try.
        </p>
      ) : (
        <ul className="space-y-3">
          {items?.map((item) => (
            <li
              key={item.id}
              className="relative flex items-center gap-3 rounded-lg border border-burgundy/50 p-4 shadow-md transition hover:border-burgundy/70 hover:shadow-lg"
            >
              <RemoveFromWishlistButton
                drinkId={item.drinkId}
                drinkName={`${item.drinkExternalId ? `#${item.drinkExternalId} — ` : ""}${item.drinkName}`}
                className="absolute top-2 right-2"
              />
              <Link
                href={`/drinks/${item.drinkSlug}`}
                className="min-w-0 flex-1 pr-8"
              >
                <div className="font-medium">
                  <span className="opacity-80 font-normal">{item.drinkExternalId ? `#${item.drinkExternalId} — ` : ""}</span>
                  {item.drinkName}
                </div>
                <div className="text-sm">
                  {item.vendorName}
                  {item.vendorNeighbourhoods.length > 0 ? ` · ${item.vendorNeighbourhoods.join(", ")}` : ""}
                </div>
                {item.flavourNotes && (
                  <div className="text-sm opacity-90 mt-1">
                    Flavour notes: <span className="italic opacity-80">{item.flavourNotes}</span>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
