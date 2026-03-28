import { type JournalEntryRow } from "@/lib/queries";
import JournalEntry from "./entry";

function formatSectionDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export default function DateSection({
  dateKey,
  entries,
}: {
  dateKey: string;
  entries: JournalEntryRow[];
}) {
  return (
    <section key={dateKey} className="space-y-2">
      <h2 className="text-sm font-medium uppercase tracking-wider text-burgundy/70 border-b border-burgundy/20 pb-1.5">
        {dateKey === "unknown" ? "Unknown date" : formatSectionDate(dateKey)}
      </h2>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <JournalEntry key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}
