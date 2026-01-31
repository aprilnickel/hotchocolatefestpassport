"use client";

import { useTransition } from "react";
import { addToWishlist, removeFromWishlist } from "@/app/actions/wishlist";
import { markTasted, unmarkTasted } from "@/app/actions/tasted";

export function DrinkActions({
  drinkId,
  inWishlist,
  isTasted,
}: {
  drinkId: string;
  inWishlist: boolean;
  isTasted: boolean;
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
            if (isTasted) {
              await unmarkTasted(drinkId);
            } else {
              await markTasted(drinkId);
            }
          });
        }}
        className="min-h-[44px] min-w-[44px] rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {isTasted ? "Unmark tasted" : "Mark as tasted"}
      </button>
    </div>
  );
}
