import Link from "next/link";
import type { Vendor } from "@/lib/queries";

export function VendorCard({
  vendor,
}: {
  vendor: Vendor;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-burgundy/50 p-4 shadow-md transition hover:border-burgundy/70 hover:shadow-lg">
      <Link
        href={`/vendors/${vendor.slug}`}
        className="min-w-0 flex-1 cursor-pointer list-none"
      >
        <div className="font-medium">
          {vendor.name}
        </div>
        <div className="mt-3 border-t border-burgundy/20 pt-3">
          <ul className="space-y-1">
            {vendor.drinks.map((drink) => (
              <li key={drink.id}>
                <Link href={`/drinks/${drink.slug}`} className="text-sm font-medium underline hover:no-underline inline-link">
                  <span className="opacity-80 font-normal">{drink.externalId ? `#${drink.externalId} — ` : ""}</span>
                  {drink.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </li>
  );
}
