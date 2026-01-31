"use client";

import { useTransition } from "react";
import { unmarkSipped } from "@/app/actions/sipped";

export function UnmarkSippedButton({ drinkId }: { drinkId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => unmarkSipped(drinkId))}
      className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
    >
      Unmark
    </button>
  );
}
