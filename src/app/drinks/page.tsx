import Link from "next/link";
import { getDrinksWithVendors } from "@/lib/queries";

export default async function DrinksPage() {
  const drinks = await getDrinksWithVendors();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Festival drinks</h1>
      {drinks.length === 0 ? (
        <p className="text-neutral-600">
          No drinks loaded yet. Run <code className="rounded bg-neutral-100 px-1">pnpm run db:seed</code> to add
          placeholder data.
        </p>
      ) : (
        <ul className="space-y-3">
          {drinks.map((d) => (
            <li key={d.id}>
              <Link
                href={`/drinks/${d.slug}`}
                className="block rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm"
              >
                <div className="font-medium text-neutral-900">{d.name}</div>
                <div className="mt-1 text-sm text-neutral-600">
                  {d.vendorName}
                  {d.neighbourhood ? ` · ${d.neighbourhood}` : ""}
                </div>
                {d.flavourNotes && (
                  <div className="mt-1 text-sm text-neutral-500">
                    {d.flavourNotes}
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
