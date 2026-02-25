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
        className={`btn-secondary text-sm disabled:opacity-50 ${className}`}
        aria-label="Remove from journal"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.7223 12.7585C14.7426 12.3448 14.4237 11.9929 14.01 11.9726C13.5963 11.9522 13.2444 12.2711 13.2241 12.6848L12.9999 17.2415C12.9796 17.6552 13.2985 18.0071 13.7122 18.0274C14.1259 18.0478 14.4778 17.7289 14.4981 17.3152L14.7223 12.7585Z" fill="currentColor"/>
          <path d="M9.98802 11.9726C9.5743 11.9929 9.25542 12.3448 9.27577 12.7585L9.49993 17.3152C9.52028 17.7289 9.87216 18.0478 10.2859 18.0274C10.6996 18.0071 11.0185 17.6552 10.9981 17.2415L10.774 12.6848C10.7536 12.2711 10.4017 11.9522 9.98802 11.9726Z" fill="currentColor"/>
          <path d="M10.249 2C9.00638 2 7.99902 3.00736 7.99902 4.25V5H5.5C4.25736 5 3.25 6.00736 3.25 7.25C3.25 8.28958 3.95503 9.16449 4.91303 9.42267L5.54076 19.8848C5.61205 21.0729 6.59642 22 7.78672 22H16.2113C17.4016 22 18.386 21.0729 18.4573 19.8848L19.085 9.42267C20.043 9.16449 20.748 8.28958 20.748 7.25C20.748 6.00736 19.7407 5 18.498 5H15.999V4.25C15.999 3.00736 14.9917 2 13.749 2H10.249ZM14.499 5V4.25C14.499 3.83579 14.1632 3.5 13.749 3.5H10.249C9.83481 3.5 9.49902 3.83579 9.49902 4.25V5H14.499ZM5.5 6.5C5.08579 6.5 4.75 6.83579 4.75 7.25C4.75 7.66421 5.08579 8 5.5 8H18.498C18.9123 8 19.248 7.66421 19.248 7.25C19.248 6.83579 18.9123 6.5 18.498 6.5H5.5ZM6.42037 9.5H17.5777L16.96 19.7949C16.9362 20.191 16.6081 20.5 16.2113 20.5H7.78672C7.38995 20.5 7.06183 20.191 7.03807 19.7949L6.42037 9.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
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
            <h2 id="confirm-remove-title" className="font-medium mb-2">
              {drinkName ? `Remove "${drinkName}" from journal?` : "Remove from journal?"}
            </h2>
            <p className="text-burgundy/80 text-sm mb-4">
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
