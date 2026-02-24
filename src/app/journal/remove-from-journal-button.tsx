"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { removeFromJournal } from "@/app/actions/journal";

export function RemoveFromJournalButton({
  drinkId,
  drinkName,
  className = "",
}: {
  drinkId: string;
  drinkName?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const performRemove = useCallback(() => {
    setShowConfirm(false);
    startTransition(async () => {
      const result = await removeFromJournal(drinkId);
      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
      } else {
        toast.success("Removed from journal");
      }
    });
  }, [drinkId]);

  useEffect(() => {
    if (!showConfirm) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [showConfirm]);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setShowConfirm(true)}
        className={`rounded-full p-1.5 text-burgundy/70 hover:text-burgundy hover:bg-burgundy/10 disabled:opacity-50 transition ${className}`}
        aria-label="Remove from journal"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z" fill="currentColor"/>
        </svg>
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-title"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-cream border border-burgundy/30 rounded-lg shadow-lg p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-remove-title" className="font-medium text-espresso mb-2">
              {drinkName ? `Remove "${drinkName}" from journal?` : "Remove from journal?"}
            </h2>
            <p className="text-espresso/80 text-sm mb-4">
              {drinkName
                ? `${drinkName} will be removed from your journal. You can add it back anytime.`
                : "This drink will be removed from your journal. You can add it back anytime."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performRemove}
                disabled={pending}
                className="btn-primary disabled:opacity-50"
              >
                {pending ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
