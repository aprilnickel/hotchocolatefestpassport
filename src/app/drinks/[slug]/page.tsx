import { notFound } from "next/navigation";
import Link from "next/link";
import { getDrinkBySlug } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { wishlistItems, journalEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DrinkActions } from "./drink-actions";

export default async function DrinkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const drink = await getDrinkBySlug(slug);
  if (!drink) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  let inWishlist = false;
  let inJournal = false;
  if (session?.user?.id) {
    const [wl] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, session.user.id),
          eq(wishlistItems.drinkId, drink.id)
        )
      )
      .limit(1);
    const [j] = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, session.user.id),
          eq(journalEntries.drinkId, drink.id)
        )
      )
      .limit(1);
    inWishlist = !!wl;
    inJournal = !!j;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/drinks"
        className="mb-4 inline-block text-sm font-medium inline-link"
      >
        ← All drinks
      </Link>
      <article className="rounded-lg border border-burgundy/50 p-6 shadow-md">
        <h1 className="text-2xl">
          <span className="opacity-80 font-normal">{drink.externalId ? `#${drink.externalId} — ` : ""}</span>
          <span className="font-bold">{drink.name}</span>
        </h1>
        <p className="mt-2">
          <Link
            href={`/vendors/${drink.vendor.slug}`}
            className="font-medium hover:underline"
          >
            {drink.vendor.name}
          </Link>
          {drink.vendor.vendorLocations.length > 0 && (
            <span className="opacity-80"> · {drink.vendor.vendorLocations.map((location) => location.neighbourhood).join(", ")}</span>
          )}
        </p>
        {drink.flavourNotes && (
          <p className="mt-2 text-sm">
            <span className="font-medium">Flavour notes:</span> <span className="italic opacity-80">{drink.flavourNotes}</span>
          </p>
        )}
        {drink.description && (
          <div
            className="mt-2 [&_p+p]:mt-2"
            dangerouslySetInnerHTML={{ __html: drink.description }}
          />
        )}
        {session?.user && (
          <div className="mt-6">
            <DrinkActions
              drinkId={drink.id}
              inWishlist={inWishlist}
              inJournal={inJournal}
            />
          </div>
        )}
      </article>
    </main>
  );
}
