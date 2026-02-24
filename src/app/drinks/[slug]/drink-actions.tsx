"use client";

import { ToggleWishlistButton } from "@/app/drinks/[slug]/toggle-wishlist-button";
import { ToggleJournalButton } from "@/app/drinks/[slug]/toggle-journal-button";

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
      <ToggleWishlistButton drinkId={drinkId} inWishlist={inWishlist} verbose />
      <ToggleJournalButton drinkId={drinkId} inJournal={inJournal} verbose />
    </div>
  );
}
