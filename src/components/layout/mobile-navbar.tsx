"use client";

import Link from "next/link";
import { HomeIcon } from "@/components/icons/home-icon";
import { CoffeeMugIcon } from "@/components/icons/coffee-mug-icon";
import { StorefrontIcon } from "@/components/icons/storefront-icon";
import { BookmarkIcon } from "@/components/icons/bookmark-icon";
import { JournalIcon } from "@/components/icons/journal-icon";
import { useActivePage } from "./active-page-context";

const mobileNavLinkClass = "flex min-w-0 flex-1 flex-col items-center justify-center border-t-2 transition-colors";
const mobileNavLinkClassActive = `${mobileNavLinkClass} -mt-3 border-white pt-3 -mb-3 pb-3`;
const mobileNavLinkClassInactive = `${mobileNavLinkClass} min-h-[44px] border-transparent`;

const linkData = [
  { href: "/", slug: "home", label: "Home", icon: HomeIcon },
  { href: "/drinks", slug: "drinks", label: "Drinks", icon: CoffeeMugIcon },
  { href: "/vendors", slug: "vendors", label: "Vendors", icon: StorefrontIcon },
  { href: "/wishlist", slug: "wishlist", label: "Wishlist", icon: BookmarkIcon },
  { href: "/journal", slug: "journal", label: "Journal", icon: JournalIcon },
];

export function MobileNavbar() {
  const { activePage } = useActivePage();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-stretch border-t border-white/20 bg-burgundy py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
      aria-label="Mobile navigation"
    >
      {linkData.map((link) => (
        <Link
          key={link.slug}
          href={link.href}
          className={activePage.slug === link.slug ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
          aria-label={link.label}
          aria-current={activePage.slug === link.slug ? "page" : undefined}
        >
          <link.icon active={activePage.slug === link.slug} className="size-7 shrink-0 text-white" />
        </Link>
      ))}
    </nav>
  );
}
