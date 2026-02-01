import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { sippedItems, drinks, vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AddToSipListButton } from "@/components/drink-actions/add-to-siplist-button";

export default async function SipListPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const rows = await db
    .select({
      id: sippedItems.id,
      drinkId: drinks.id,
      drinkName: drinks.name,
      drinkSlug: drinks.slug,
      flavourNotes: drinks.flavourNotes,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      neighbourhood: vendors.neighbourhood,
      sippedAt: sippedItems.sippedAt,
    })
    .from(sippedItems)
    .innerJoin(drinks, eq(sippedItems.drinkId, drinks.id))
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(sippedItems.userId, session.user.id))
    .orderBy(desc(sippedItems.sippedAt));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My sips</h1>
      <p className="mb-4 text-neutral-600">
        Drinks you&apos;ve marked as sipped.
      </p>
      {rows.length === 0 ? (
        <p className="text-neutral-600">
          You haven&apos;t marked any drinks as sipped yet. Try one from your{" "}
          <Link href="/wishlist" className="font-medium text-neutral-900 underline">
            wishlist
          </Link>{" "}
          or{" "}
          <Link href="/drinks" className="font-medium text-neutral-900 underline">
            browse drinks
          </Link>{" "}
          and mark them when you&apos;ve tried them.
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
                <div className="mt-1 text-xs text-neutral-400">
                  Sipped {r.sippedAt ? new Date(r.sippedAt).toLocaleDateString() : ""}
                </div>
              </Link>
              <AddToSipListButton drinkId={r.drinkId} isSipped={true} verbose />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
