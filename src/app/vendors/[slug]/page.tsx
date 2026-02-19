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
        className="mb-4 inline-block text-sm font-medium inline-link"
      >
        ← All drinks
      </Link>
      <article className="rounded-lg border border-burgundy/50 p-6 shadow-md">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        {vendor.neighbourhood && (
          <p className="mt-2">{vendor.neighbourhood}</p>
        )}
        {vendor.address && (
          <p className="mt-1 text-sm opacity-80">{vendor.address}</p>
        )}
        {vendor.url && (
          <a
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium underline inline-link"
          >
            Visit website
          </a>
        )}
        <h2 className="mt-6 text-lg font-semibold">
          Drinks at this vendor
        </h2>
        <ul className="mt-2 space-y-2">
          {vendorDrinks.map((d) => (
            <li key={d.id}>
              <Link
                href={`/drinks/${d.slug}`}
                className="hover:underline inline-link"
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
