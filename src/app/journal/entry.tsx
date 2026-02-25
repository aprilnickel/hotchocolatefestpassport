"use client";

import { useState } from "react";
import Link from "next/link";
import { JournalEntryEditor, JournalEntryEditButton } from "@/app/journal/journal-entry-editor";
import { JournalEntryRow } from "./page";

export default function JournalEntry({
  entry,
}: {
  entry: JournalEntryRow;
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <li
      key={entry.id}
      className="relative flex flex-col rounded-r-lg border-l-2 border-burgundy/50 bg-cream/40 py-3 pl-4 pr-10 transition hover:border-burgundy hover:bg-cream/70 sm:flex-row sm:items-center sm:gap-4"
    >
      <JournalEntryEditButton
        onClick={() => setEditMode(true)}
        className="absolute top-2 right-2"
      />
      <Link
        href={`/drinks/${entry.drinkSlug}`}
        className="min-w-0 flex-1"
      >
        <div className="font-medium">{entry.drinkName}</div>
        <div className="text-sm">
          {entry.vendorName}
          {entry.neighbourhood ? ` · ${entry.neighbourhood}` : ""}
        </div>
        {entry.flavourNotes && (
          <div className="text-sm opacity-90 mt-1">
          Flavour notes: <span className="italic opacity-80">{entry.flavourNotes}</span>
        </div>
        )}
      </Link>
      <JournalEntryEditor
        drinkId={entry.drinkId}
        drinkName={entry.drinkName}
        journaledAt={entry.journaledAt}
        editMode={editMode}
        onEditModeChange={setEditMode}
      />
    </li>
  );
}
