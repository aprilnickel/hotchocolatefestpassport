"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const navLinkClass =
  "flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium inline-link";

export function DesktopNavbar() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-burgundy/20 bg-cream">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="font-semibold inline-link">
            Hot Chocolate Passport
          </Link>

          {/* Desktop nav: horizontal, visible from md up */}
          <nav className="hidden items-center gap-1 sm:gap-4 md:flex">
            <Link href="/drinks" className={navLinkClass}>
              Drinks
            </Link>
            <Link href="/wishlist" className={navLinkClass}>
              My Wishlist
            </Link>
            <Link href="/journal" className={navLinkClass}>
              My Journal
            </Link>
            {session ? (
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
    </>
  );
}
