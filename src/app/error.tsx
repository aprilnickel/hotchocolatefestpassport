"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h1 className="text-xl font-bold text-neutral-900">Something went wrong</h1>
      <p className="mt-2 text-neutral-600">{error.message}</p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] min-w-[44px] rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="min-h-[44px] min-w-[44px] rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
