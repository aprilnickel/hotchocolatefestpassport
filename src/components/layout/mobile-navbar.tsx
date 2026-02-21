"use client";

import Link from "next/link";
import { HomeIcon } from "@/components/icons/home-icon";
import { CoffeeMugIcon } from "@/components/icons/coffee-mug-icon";
import { BookmarkIcon } from "@/components/icons/bookmark-icon";
import { JournalIcon } from "@/components/icons/journal-icon";
import { useActivePage } from "./active-page-context";

const mobileNavLinkClass = "flex min-w-0 flex-1 flex-col items-center justify-center border-t-2 transition-colors";
const mobileNavLinkClassActive = `${mobileNavLinkClass} -mt-3 border-white pt-3`;
const mobileNavLinkClassInactive = `${mobileNavLinkClass} min-h-[44px] border-transparent`;
const iconClass = "size-7 shrink-0 text-white";

export function MobileNavbar() {
  const { activePage } = useActivePage();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-stretch border-t border-white/20 bg-burgundy py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
      aria-label="Mobile navigation"
    >
      <Link
        href="/"
        className={activePage.slug === "home" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
        aria-label="Home"
        aria-current={activePage.slug === "home" ? "page" : undefined}
      >
        <HomeIcon active={activePage.slug === "home"} className={iconClass} />
      </Link>
      <Link
        href="/drinks"
        className={activePage.slug === "drinks" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
        aria-label="Drinks"
        aria-current={activePage.slug === "drinks" ? "page" : undefined}
      >
        <CoffeeMugIcon active={activePage.slug === "drinks"} className={iconClass} />
      </Link>
      <Link
        href="/wishlist"
        className={activePage.slug === "wishlist" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
        aria-label="Wishlist"
        aria-current={activePage.slug === "wishlist" ? "page" : undefined}
      >
        <BookmarkIcon active={activePage.slug === "wishlist"} className={iconClass} />
      </Link>
      <Link
        href="/journal"
        className={activePage.slug === "journal" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
        aria-label="Journal"
        aria-current={activePage.slug === "journal" ? "page" : undefined}
      >
        <JournalIcon active={activePage.slug === "journal"} className={iconClass} secondaryColor="var(--color-burgundy)" />
      </Link>
    </nav>
  );
}
