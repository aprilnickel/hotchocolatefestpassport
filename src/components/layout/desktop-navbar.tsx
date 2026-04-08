"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const navLinkClass =
  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm px-2 text-sm font-medium text-burgundy hover:bg-burgundy/10";

export function DesktopNavbar() {
  const { data: session } = authClient.useSession();

  /* Desktop nav: horizontal, visible from md up */
  return (
    <nav className="hidden items-center gap-1 sm:gap-4 md:flex">
      <Link href="/drinks" className={navLinkClass}>
        Drinks
      </Link>
      <Link href="/vendors" className={navLinkClass}>
        Vendors
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
  );
}
