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
    <li className="flex items-start gap-3 rounded-lg border border-burgundy/50 p-4 shadow-md transition hover:border-burgundy/70 hover:shadow-lg">
      <Link
        href={`/drinks/${drink.slug}`}
        className="min-w-0 flex-1"
      >
        <div className="font-medium">{drink.name}</div>
        <div className="mt-1 text-sm">
          {drink.vendorName}
          {drink.neighbourhood ? ` · ${drink.neighbourhood}` : ""}
        </div>
        {drink.flavourNotes && (
          <div className="mt-1 text-sm opacity-80">
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
