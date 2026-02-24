import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { journalItems, drinks, vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { RemoveFromJournalButton } from "@/components/drink-actions/remove-from-journal-button";

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
      <h1 className="mb-6 text-2xl font-bold hidden md:block">My Journal</h1>
      <p className="mb-4">
        Find all the drinks you&apos;ve sipped here.
      </p>
      {rows.length === 0 ? (
        <p>
          You haven&apos;t added any drinks to your journal yet. Try one from your{" "}
          <Link href="/wishlist" className="font-medium underline">
            wishlist
          </Link>{" "}
          or{" "}
          <Link href="/drinks" className="font-medium underline">
            browse drinks
          </Link>{" "}
          and add them to your journal when you&apos;ve tried them.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="relative flex items-center gap-3 rounded-lg border border-burgundy/50 p-4 shadow-md transition hover:border-burgundy/70 hover:shadow-lg"
            >
              <RemoveFromJournalButton
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
                <div className="mt-1 text-xs opacity-70">
                  Sipped on · {r.journaledAt ? new Date(r.journaledAt).toLocaleDateString() : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
