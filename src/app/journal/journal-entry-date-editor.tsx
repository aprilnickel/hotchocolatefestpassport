"use client";

import { useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";

function parseInitialDate(d: Date | string | null): Date | undefined {
  if (!d) return undefined;
  return typeof d === "string" ? new Date(d) : d;
}

function formatDisplayDate(d: Date | string | null): string {
  if (!d) return "Pick a date";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JournalEntryDateEditor({
  value,
  className = "",
  onChange,
}: {
  value: Date | string | null;
  className?: string;
  onChange?: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseInitialDate(value), [value]);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <div className="journal-date-picker">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-sm border border-burgundy/30 bg-cream px-3 py-1.5 text-sm text-burgundy/80 hover:border-burgundy/60 hover:text-burgundy focus:outline-hidden focus:ring-2 focus:ring-burgundy/30 disabled:opacity-50 ${className}`}
          >
            <span className="shrink-0 text-burgundy/70" aria-hidden>
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </span>
            <span>{formatDisplayDate(value)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={8}
          className="z-50 rounded-lg border border-burgundy/30 bg-cream p-3 shadow-lg"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            className="text-sm text-burgundy"
            captionLayout="label"
            navLayout="around"
            animate
            showOutsideDays
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
