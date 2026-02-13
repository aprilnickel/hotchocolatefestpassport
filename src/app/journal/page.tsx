import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { journalItems, drinks, vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AddToJournalButton } from "@/components/drink-actions/add-to-journal-button";

export default async function JournalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const rows = await db
    .select({
      id: journalItems.id,
      drinkId: drinks.id,
      drinkName: drinks.name,
      drinkSlug: drinks.slug,
      flavourNotes: drinks.flavourNotes,
      vendorName: vendors.name,
      vendorSlug: vendors.slug,
      neighbourhood: vendors.neighbourhood,
      journaledAt: journalItems.journaledAt,
    })
    .from(journalItems)
    .innerJoin(drinks, eq(journalItems.drinkId, drinks.id))
    .innerJoin(vendors, eq(drinks.vendorId, vendors.id))
    .where(eq(journalItems.userId, session.user.id))
    .orderBy(desc(journalItems.journaledAt));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My journal</h1>
      <p className="mb-4 text-neutral-600">
        Drinks you&apos;ve added to your journal.
      </p>
      {rows.length === 0 ? (
        <p className="text-neutral-600">
          You haven&apos;t added any drinks to your journal yet. Try one from your{" "}
          <Link href="/wishlist" className="font-medium text-neutral-900 underline">
            wishlist
          </Link>{" "}
          or{" "}
          <Link href="/drinks" className="font-medium text-neutral-900 underline">
            browse drinks
          </Link>{" "}
          and add them to your journal when you&apos;ve tried them.
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
                  Journal · {r.journaledAt ? new Date(r.journaledAt).toLocaleDateString() : ""}
                </div>
              </Link>
              <AddToJournalButton drinkId={r.drinkId} inJournal={true} verbose />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
