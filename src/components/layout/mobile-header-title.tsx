import Link from "next/link";
import { useActivePage } from "./active-page-context";

export function MobileHeaderTitle() {
  const { activePage } = useActivePage();

  return (
    <div className="flex md:hidden">
      <Link href="/" className="font-semibold inline-link" aria-label={activePage.headerTitle}>
        {activePage.headerTitle}
      </Link>
    </div>
  );
}
