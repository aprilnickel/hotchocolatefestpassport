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
        <nav className="flex items-center gap-4">
          {isPending ? (
            <span className="text-sm text-neutral-500">Loading…</span>
          ) : session ? (
            <>
              <Link
                href="/drinks"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Drinks
              </Link>
              <Link
                href="/wishlist"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                My wishlist
              </Link>
              <Link
                href="/progress"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                My progress
              </Link>
              <button
                type="button"
                onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => window.location.href = "/" } })}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
