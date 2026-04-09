import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import DateSection from "./date-section";
import { getJournalEntriesByUser, type JournalEntryRow } from "@/lib/queries";

export const metadata = {
  title: "Journal | Sip Fest Passport",
  description: "Find all the drinks you've sipped here.",
};

export default async function JournalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const entries = await getJournalEntriesByUser(session.user.id);

  const byDate = entries.reduce<Record<string, JournalEntryRow[]>>((acc, r) => {
    const key = r.journaledAt ? new Date(r.journaledAt).toISOString().slice(0, 10) : "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const dateKeys = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold hidden md:block">My Journal</h1>
      <p className="mb-6">
        Find all the drinks you&apos;ve sipped here.
      </p>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-burgundy/50 bg-cream/50 p-6 text-center">
          <p className="text-burgundy/90">
            No entries yet. Try a drink from your{" "}
            <Link href="/wishlist" className="font-medium underline hover:no-underline">
              wishlist
            </Link>{" "}
            or{" "}
            <Link href="/drinks" className="font-medium underline hover:no-underline">
              browse drinks
            </Link>{" "}
            and add them to your journal once you&apos;ve tried them.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dateKeys.map((dateKey) => (
            <DateSection key={dateKey} dateKey={dateKey} entries={byDate[dateKey]} />
          ))}
        </div>
      )}
    </main>
  );
}
