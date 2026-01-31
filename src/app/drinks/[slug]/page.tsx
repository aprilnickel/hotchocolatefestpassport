import { notFound } from "next/navigation";
import Link from "next/link";
import { getDrinkBySlug } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { wishlistItems, tastedItems } from "@/db/schema";
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
  let isTasted = false;
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
    const [t] = await db
      .select()
      .from(tastedItems)
      .where(
        and(
          eq(tastedItems.userId, session.user.id),
          eq(tastedItems.drinkId, drink.id)
        )
      )
      .limit(1);
    inWishlist = !!wl;
    isTasted = !!t;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/drinks"
        className="mb-4 inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        ← All drinks
      </Link>
      <article className="rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-neutral-900">{drink.name}</h1>
        <p className="mt-2">
          <Link
            href={`/vendors/${drink.vendorSlug}`}
            className="font-medium text-neutral-700 hover:underline"
          >
            {drink.vendorName}
          </Link>
          {drink.neighbourhood && (
            <span className="text-neutral-500"> · {drink.neighbourhood}</span>
          )}
        </p>
        {drink.flavourNotes && (
          <p className="mt-2 text-sm text-neutral-600">
            <span className="font-medium">Flavour notes:</span> {drink.flavourNotes}
          </p>
        )}
        {drink.description && (
          <p className="mt-2 text-neutral-700">{drink.description}</p>
        )}
        {session?.user && (
          <div className="mt-6">
            <DrinkActions
              drinkId={drink.id}
              inWishlist={inWishlist}
              isTasted={isTasted}
            />
          </div>
        )}
      </article>
    </main>
  );
}
