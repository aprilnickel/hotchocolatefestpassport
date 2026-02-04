"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-neutral-900">
          Hot Chocolate Passport
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          {isPending ? (
            <span className="flex min-h-[44px] items-center text-sm text-neutral-500">
              Loading…
            </span>
          ) : session ? (
            <>
              <Link
                href="/drinks"
                className="flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                Drinks
              </Link>
              <Link
                href="/wishlist"
                className="flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                My Wishlist
              </Link>
              <Link
                href="/sips"
                className="flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
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
                className="flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
