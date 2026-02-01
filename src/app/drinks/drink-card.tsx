"use client";

import Link from "next/link";
import type { DrinkWithVendor } from "@/lib/queries";
import { AddToWishlistButton } from "@/components/drink-actions/add-to-wishlist-button";

export function DrinkCard({
  drink,
  inWishlist,
  showWishlistButton,
}: {
  drink: DrinkWithVendor;
  inWishlist: boolean;
  showWishlistButton: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm">
      <Link
        href={`/drinks/${drink.slug}`}
        className="min-w-0 flex-1"
      >
        <div className="font-medium text-neutral-900">{drink.name}</div>
        <div className="mt-1 text-sm text-neutral-600">
          {drink.vendorName}
          {drink.neighbourhood ? ` · ${drink.neighbourhood}` : ""}
        </div>
        {drink.flavourNotes && (
          <div className="mt-1 text-sm text-neutral-500">
            {drink.flavourNotes}
          </div>
        )}
      </Link>
      {showWishlistButton && (
        <AddToWishlistButton drinkId={drink.id} inWishlist={inWishlist} />
      )}
    </li>
  );
}
