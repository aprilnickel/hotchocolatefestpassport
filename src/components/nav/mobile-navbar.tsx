"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { HomeIcon } from "@/components/icons/home-icon";
import { CoffeeMugIcon } from "@/components/icons/coffee-mug-icon";
import { BookmarkIcon } from "@/components/icons/bookmark-icon";
import { JournalIcon } from "@/components/icons/journal-icon";
import { HamburgerIcon } from "@/components/icons/hamburger-icon";
import useActivePage from "./useActivePage";

const mobileNavLinkClass = "flex min-w-0 flex-1 flex-col items-center justify-center border-t-2 transition-colors";
const mobileNavLinkClassActive = `${mobileNavLinkClass} -mt-3 border-white pt-3`;
const mobileNavLinkClassInactive = `${mobileNavLinkClass} min-h-[44px] border-transparent`;
const mobileMoreMenuLinkClass = "flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium w-full justify-start";
const iconClass = "size-7 shrink-0 text-white";

export function MobileNavbar() {
  const { data: session, isPending } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activePage = useActivePage();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex items-stretch border-t border-white/20 bg-burgundy py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          className={activePage === "home" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
          aria-label="Home"
          aria-current={activePage === "home" ? "page" : undefined}
        >
          <HomeIcon active={activePage === "home"} className={iconClass} />
        </Link>
        <Link
          href="/drinks"
          className={activePage === "drinks" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
          aria-label="Drinks"
          aria-current={activePage === "drinks" ? "page" : undefined}
        >
          <CoffeeMugIcon active={activePage === "drinks"} className={iconClass} />
        </Link>
        <Link
          href="/wishlist"
          className={activePage === "wishlist" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
          aria-label="Wishlist"
          aria-current={activePage === "wishlist" ? "page" : undefined}
        >
          <BookmarkIcon active={activePage === "wishlist"} className={iconClass} />
        </Link>
        <Link
          href="/journal"
          className={activePage === "journal" ? mobileNavLinkClassActive : mobileNavLinkClassInactive}
          aria-label="Journal"
          aria-current={activePage === "journal" ? "page" : undefined}
        >
          <JournalIcon active={activePage === "journal"} className={iconClass} secondaryColor="var(--color-burgundy)" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex min-w-0 flex-1 flex-col items-center justify-center"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <HamburgerIcon className={iconClass} />
        </button>
      </nav>

      {/* Mobile menu overlay: slide-up panel (Sign In / Sign Out etc.) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-hidden
          onClick={closeMobileMenu}
        />
      )}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white shadow-lg transition-transform duration-200 ease-out md:hidden pointer-events-none data-[open]:pointer-events-auto"
        data-open={mobileMenuOpen || undefined}
        style={{
          transform: mobileMenuOpen ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mx-auto my-2 h-1 w-12 rounded-full bg-burgundy/30" />
        <nav className="px-4 pb-6 pt-2">
          <ul className="flex flex-col gap-1">
            {isPending ? (
              <li>
                <span className="flex min-h-[44px] items-center text-sm opacity-70">
                  Loading…
                </span>
              </li>
            ) : session ? (
              <>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            window.location.href = "/";
                          },
                        },
                      });
                    }}
                    className={mobileMoreMenuLinkClass}
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link href="/sign-in" className={mobileMoreMenuLinkClass} onClick={closeMobileMenu}>
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
