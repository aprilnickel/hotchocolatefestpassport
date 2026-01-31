import { notFound } from "next/navigation";
import Link from "next/link";
import { getVendorBySlug, getDrinksByVendorId } from "@/lib/queries";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const vendorDrinks = await getDrinksByVendorId(vendor.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/drinks"
        className="mb-4 inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        ← All drinks
      </Link>
      <article className="rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-neutral-900">{vendor.name}</h1>
        {vendor.neighbourhood && (
          <p className="mt-2 text-neutral-600">{vendor.neighbourhood}</p>
        )}
        {vendor.address && (
          <p className="mt-1 text-sm text-neutral-500">{vendor.address}</p>
        )}
        {vendor.url && (
          <a
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
          >
            Visit website
          </a>
        )}
        <h2 className="mt-6 text-lg font-semibold text-neutral-900">
          Drinks at this vendor
        </h2>
        <ul className="mt-2 space-y-2">
          {vendorDrinks.map((d) => (
            <li key={d.id}>
              <Link
                href={`/drinks/${d.slug}`}
                className="text-neutral-700 hover:underline"
              >
                {d.name}
                {d.flavourNotes ? ` — ${d.flavourNotes}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
