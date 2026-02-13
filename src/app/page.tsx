import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Hot Chocolate Festival Passport</h1>
      <p className="mt-2 text-neutral-600">
        Your companion for the Vancouver Hot Chocolate Festival. Browse drinks,
        keep a wishlist, and keep a journal of what you&apos;ve tried.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href="/drinks"
          className="min-h-[44px] min-w-[44px] rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-800"
        >
          Browse drinks
        </Link>
        <Link
          href="/sign-in"
          className="min-h-[44px] min-w-[44px] rounded-lg border border-neutral-300 px-4 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
