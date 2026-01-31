import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { tastedItems, drinks, vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { UnmarkTastedButton } from "./unmark-button";

export default async function ProgressPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const rows = await db
    .select({
      id: tastedItems.id,
      drinkId: drinks.id,
      drinkName: drinks.name,
      drinkSlug: drinks.slug,
      flavourNotes: drinks.flavourNotes,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      neighbourhood: vendors.neighbourhood,
      tastedAt: tastedItems.tastedAt,
    })
    .from(tastedItems)
    .innerJoin(drinks, eq(tastedItems.drinkId, drinks.id))
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(tastedItems.userId, session.user.id))
    .orderBy(desc(tastedItems.tastedAt));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My progress</h1>
      <p className="mb-4 text-neutral-600">
        Drinks you&apos;ve marked as tasted.
      </p>
      {rows.length === 0 ? (
        <p className="text-neutral-600">
          You haven&apos;t marked any drinks as tasted yet. Try one from your{" "}
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
                  Tasted {r.tastedAt ? new Date(r.tastedAt).toLocaleDateString() : ""}
                </div>
              </Link>
              <UnmarkTastedButton drinkId={r.drinkId} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
