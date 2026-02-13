"use client";

import { AddToWishlistButton } from "@/components/drink-actions/add-to-wishlist-button";
import { AddToJournalButton } from "@/components/drink-actions/add-to-journal-button";

export function DrinkActions({
  drinkId,
  inWishlist,
  inJournal,
}: {
  drinkId: string;
  inWishlist: boolean;
  inJournal: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <AddToWishlistButton drinkId={drinkId} inWishlist={inWishlist} verbose />
      <AddToJournalButton drinkId={drinkId} inJournal={inJournal} verbose />
    </div>
  );
}
