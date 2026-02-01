"use client";

import { useState, useTransition } from "react";
import { addToWishlist, removeFromWishlist } from "@/app/actions/wishlist";

export function AddToWishlistButton({ drinkId, inWishlist: initialInWishlist, verbose = false }: { drinkId: string, inWishlist: boolean, verbose?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);

  const toggleWishlist = () => {
    const next = !inWishlist;
    setInWishlist(next);
    startTransition(async () => {
      const result = next
        ? await addToWishlist(drinkId)
        : await removeFromWishlist(drinkId);
      if (!result.success) {
        setInWishlist(!next);
      }
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggleWishlist}
      className="min-h-[44px] min-w-[44px] rounded-lg border border-neutral-300 p-2 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 inline-flex items-center gap-2"
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {inWishlist ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
        </svg>
      )}
      {verbose && (inWishlist ? "Remove from wishlist" : "Add to wishlist")}
    </button>
  );
}
