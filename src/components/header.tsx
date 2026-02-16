"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { HomeIcon } from "@/components/icons/home-icon";
import { CoffeeMugIcon } from "@/components/icons/coffee-mug-icon";
import { BookmarkIcon } from "@/components/icons/bookmark-icon";
import { JournalIcon } from "@/components/icons/journal-icon";
import { HamburgerIcon } from "@/components/icons/hamburger-icon";

const navLinkClass =
  "flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900";
const mobileNavLinkClass = `${navLinkClass} w-full justify-start`;
const iconClass = "size-7 shrink-0";

export function Header() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isHome = pathname === "/";
  const isDrinks = pathname.startsWith("/drinks");
  const isWishlist = pathname.startsWith("/wishlist");
  const isJournal = pathname.startsWith("/journal");

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="font-semibold text-neutral-900">
            Hot Chocolate Passport
          </Link>

          {/* Desktop nav: horizontal, visible from md up */}
          <nav className="hidden items-center gap-1 sm:gap-4 md:flex">
            <Link href="/drinks" className={navLinkClass}>
              Drinks
            </Link>
            {isPending ? (
              <span className="flex min-h-[44px] items-center text-sm text-neutral-500">
                Loading…
              </span>
            ) : session ? (
              <>
                <Link href="/wishlist" className={navLinkClass}>
                  My Wishlist
                </Link>
                <Link href="/journal" className={navLinkClass}>
                  My Journal
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = "/";
                        },
                      },
                    });
                  }}
                  className={navLinkClass}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/sign-in" className={navLinkClass}>
                Sign In
              </Link>
            )}
          </nav>

          {/* Desktop: no hamburger; mobile nav is in bottom bar */}
          <div className="w-10 md:hidden" aria-hidden />
        </div>
      </header>

      {/* Mobile bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-neutral-200 bg-white py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-neutral-600 hover:text-neutral-900"
          aria-label="Home"
          aria-current={isHome ? "page" : undefined}
        >
          <HomeIcon active={isHome} className={iconClass} />
        </Link>
        <Link
          href="/drinks"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-neutral-600 hover:text-neutral-900"
          aria-label="Drinks"
        >
          <CoffeeMugIcon active={isDrinks} className={iconClass} />
        </Link>
        <Link
          href="/wishlist"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-neutral-600 hover:text-neutral-900"
          aria-label="Wishlist"
        >
          <BookmarkIcon active={isWishlist} className={iconClass} />
        </Link>
        <Link
          href="/journal"
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-neutral-600 hover:text-neutral-900"
          aria-label="Journal"
        >
          <JournalIcon active={isJournal} className={iconClass} />
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center text-neutral-600 hover:text-neutral-900"
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
        <div className="mx-auto my-2 h-1 w-12 rounded-full bg-neutral-200" />
        <nav className="px-4 pb-6 pt-2">
          <ul className="flex flex-col gap-1">
            {isPending ? (
              <li>
                <span className="flex min-h-[44px] items-center text-sm text-neutral-500">
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
                    className={mobileNavLinkClass}
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link href="/sign-in" className={mobileNavLinkClass} onClick={closeMobileMenu}>
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
