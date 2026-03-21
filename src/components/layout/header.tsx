"use client";

import { HamburgerIcon } from "@/components/icons/hamburger-icon";
import { useMoreMenu } from "./more-menu-context";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileHeaderTitle } from "./mobile-header-title";
import { DesktopHeaderTitle } from "./desktop-header-title";

export function Header() {
  const menu = useMoreMenu();
  const moreMenuOpen = menu?.open ?? false;
  const toggleMoreMenu = () => menu?.toggle();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-burgundy/20 bg-cream">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <MobileHeaderTitle />
          <DesktopHeaderTitle />

          <DesktopNavbar />

          {/* Hamburger: opens more menu (top right on mobile, right side on desktop) */}
          <button
            type="button"
            onClick={toggleMoreMenu}
            className="flex size-10 shrink-0 items-center justify-center rounded-sm text-burgundy hover:bg-burgundy/10"
            aria-label={moreMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={moreMenuOpen}
          >
            <HamburgerIcon className="size-6" />
          </button>
        </div>
      </header>
    </>
  );
}
