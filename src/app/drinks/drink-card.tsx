"use client";

import Link from "next/link";
import type { DrinkWithVendor } from "@/lib/queries";
import { ToggleWishlistButton } from "@/app/drinks/[slug]/toggle-wishlist-button";

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
        <div className="font-medium">
          <span className="opacity-80 font-normal">{drink.externalId ? `#${drink.externalId} — ` : ""}</span>
          {drink.name}
        </div>
        <div className="text-sm">
          {drink.vendorName}
          {drink.vendorNeighbourhoods.length > 0 ? ` · ${drink.vendorNeighbourhoods.join(", ")}` : ""}
        </div>
        {drink.flavourNotes && (
          <div className="text-sm opacity-90 mt-1">
          Flavour notes: <span className="italic opacity-80">{drink.flavourNotes}</span>
        </div>
        )}
      </Link>
      {showWishlistButton && (
        <ToggleWishlistButton drinkId={drink.id} inWishlist={inWishlist} />
      )}
    </li>
  );
}
