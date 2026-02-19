import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {!session && (
        <section className="mb-8 rounded-lg border border-burgundy/50 bg-cream/50 px-4 py-5">
          <p>
            Sign in to save drinks to your wishlist, and keep track of which
            drinks you&apos;ve sipped in your journal.
          </p>
          <Link href="/sign-in" className="mt-4 inline-block btn-primary">
            Sign in
          </Link>
        </section>
      )}
      <h1 className="text-2xl font-bold">Hot Chocolate Festival Passport</h1>
      <p className="mt-2">
        Your companion for the Vancouver Hot Chocolate Festival. Browse drinks,
        keep a wishlist, and keep a journal of what you&apos;ve sipped.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/drinks" className="btn-primary">
          Browse drinks
        </Link>
      </div>
    </main>
  );
}
