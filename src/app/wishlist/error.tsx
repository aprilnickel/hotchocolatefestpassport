"use client";

import { useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";

export default function WishlistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    posthog.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h1 className="text-xl font-bold">Couldn’t load wishlist</h1>
      <p className="mt-2">{error.message}</p>
      <div className="mt-6 flex justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </main>
  );
}
