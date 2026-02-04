"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const navLinkClass =
  "flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900";
const mobileNavLinkClass = `${navLinkClass} w-full justify-start`;

export function Header() {
  const { data: session, isPending } = authClient.useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
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
              <Link href="/sips" className={navLinkClass}>
                My Sips
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

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? (
            // lineicons.com xmark
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z" fill="#323544"/>
            </svg>
          ) : (
            // lineicons.com menu-hamburger-1
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5625 6C3.5625 5.58579 3.89829 5.25 4.3125 5.25H20.3125C20.7267 5.25 21.0625 5.58579 21.0625 6C21.0625 6.41421 20.7267 6.75 20.3125 6.75L4.3125 6.75C3.89829 6.75 3.5625 6.41422 3.5625 6Z" fill="#323544"/>
              <path d="M3.5625 18C3.5625 17.5858 3.89829 17.25 4.3125 17.25L20.3125 17.25C20.7267 17.25 21.0625 17.5858 21.0625 18C21.0625 18.4142 20.7267 18.75 20.3125 18.75L4.3125 18.75C3.89829 18.75 3.5625 18.4142 3.5625 18Z" fill="#323544"/>
              <path d="M4.3125 11.25C3.89829 11.25 3.5625 11.5858 3.5625 12C3.5625 12.4142 3.89829 12.75 4.3125 12.75L20.3125 12.75C20.7267 12.75 21.0625 12.4142 21.0625 12C21.0625 11.5858 20.7267 11.25 20.3125 11.25L4.3125 11.25Z" fill="#323544"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav panel: slides down */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out md:hidden"
        style={{ gridTemplateRows: mobileNavOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <nav
            className="border-t border-neutral-200 bg-white"
            aria-hidden={!mobileNavOpen}
          >
            <ul className="flex flex-col gap-1 px-4 py-4">
              <li>
                <Link href="/drinks" className={mobileNavLinkClass} onClick={closeMobileNav}>
                  Drinks
                </Link>
              </li>
              {isPending ? (
                <li>
                  <span className="flex min-h-[44px] items-center text-sm text-neutral-500">
                    Loading…
                  </span>
                </li>
              ) : session ? (
                <>
                  <li>
                    <Link href="/wishlist" className={mobileNavLinkClass} onClick={closeMobileNav}>
                      My Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link href="/sips" className={mobileNavLinkClass} onClick={closeMobileNav}>
                      My Sips
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileNav();
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
                  <Link href="/sign-in" className={mobileNavLinkClass} onClick={closeMobileNav}>
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
