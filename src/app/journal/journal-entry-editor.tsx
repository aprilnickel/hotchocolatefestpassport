"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { RemoveFromJournalButton } from "@/app/journal/journal-entry-delete-button";
import { JournalEntryDateEditor } from "@/app/journal/journal-entry-date-editor";
import { updateJournalDate } from "@/app/actions/journal";

function toYYYYMMDD(d: Date | null): string {
  if (!d) return "";
  const date = d;
  return date.toISOString().slice(0, 10);
}

export function JournalEntryEditor({
  drinkId,
  drinkName,
  journaledAt,
  editMode,
  onEditModeChange,
}: {
  drinkId: string;
  drinkName: string;
  journaledAt: Date | string | null;
  editMode: boolean;
  onEditModeChange: (value: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const initialDate = useMemo(() => {
    if (!journaledAt) return null;
    return typeof journaledAt === "string" ? new Date(journaledAt) : journaledAt;
  }, [journaledAt]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  useEffect(() => {
    if (!editMode) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEditModeChange(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [editMode, onEditModeChange]);

  // Keep local selected date in sync when opening the editor
  useEffect(() => {
    if (editMode) {
      setSelectedDate(initialDate);
    }
  }, [editMode, initialDate]);

  const handleSave = () => {
    if (!selectedDate) {
      onEditModeChange(false);
      return;
    }
    const iso = toYYYYMMDD(selectedDate);
    if (!iso) {
      onEditModeChange(false);
      return;
    }

    startTransition(async () => {
      const result = await updateJournalDate(drinkId, iso);
      if (!result.success) {
        toast.error(result.error ?? "Couldn't update date");
      } else {
        toast.success("Date updated");
        onEditModeChange(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      {editMode &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-edit-modal-title"
            onClick={() => onEditModeChange(false)}
          >
            <div
              className="bg-cream border border-burgundy/30 rounded-lg shadow-lg p-5 max-w-sm w-full max-h-[calc(100vh-2rem)] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="journal-edit-modal-title" className="font-medium mb-4">
                Edit journal entry
              </h2>
              <p className="text-sm text-burgundy/80 mb-4">{drinkName}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-burgundy/80 mb-1">Date</label>
                  <JournalEntryDateEditor
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date ?? null)}
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-2 justify-end">
                  <RemoveFromJournalButton
                    drinkId={drinkId}
                    drinkName={drinkName}
                  />
                  <button
                    type="button"
                    onClick={() => onEditModeChange(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="btn-primary disabled:opacity-50"
                    disabled={pending}
                  >
                    {pending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function JournalEntryEditButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm p-1.5 text-burgundy/70 hover:bg-burgundy/10 hover:text-burgundy focus:outline-hidden focus:ring-2 focus:ring-burgundy/30 disabled:opacity-50 ${className}`}
      aria-label="Edit entry"
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  );
}
