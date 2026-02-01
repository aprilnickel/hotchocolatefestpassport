"use client";

import { AddToWishlistButton } from "@/components/drink-actions/add-to-wishlist-button";
import { AddToSipListButton } from "@/components/drink-actions/add-to-siplist-button";

export function DrinkActions({
  drinkId,
  inWishlist,
  isSipped,
}: {
  drinkId: string;
  inWishlist: boolean;
  isSipped: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <AddToWishlistButton drinkId={drinkId} inWishlist={inWishlist} verbose />
      <AddToSipListButton drinkId={drinkId} isSipped={isSipped} verbose />
    </div>
  );
}
