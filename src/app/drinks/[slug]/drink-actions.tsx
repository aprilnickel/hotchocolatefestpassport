"use client";

import { useTransition } from "react";
import { addToWishlist, removeFromWishlist } from "@/app/actions/wishlist";
import { markSipped, unmarkSipped } from "@/app/actions/sipped";

export function DrinkActions({
  drinkId,
  inWishlist,
  isSipped,
}: {
  drinkId: string;
  inWishlist: boolean;
  isSipped: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            if (inWishlist) {
              await removeFromWishlist(drinkId);
            } else {
              await addToWishlist(drinkId);
            }
          });
        }}
        className="min-h-[44px] min-w-[44px] rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            if (isSipped) {
              await unmarkSipped(drinkId);
            } else {
              await markSipped(drinkId);
            }
          });
        }}
        className="min-h-[44px] min-w-[44px] rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {isSipped ? "Unmark sipped" : "Mark as sipped"}
      </button>
    </div>
  );
}
