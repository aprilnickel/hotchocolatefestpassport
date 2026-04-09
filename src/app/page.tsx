import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CoffeeMugIcon } from "@/components/icons/coffee-mug-icon";
import { BookmarkIcon } from "@/components/icons/bookmark-icon";
import { JournalIcon } from "@/components/icons/journal-icon";
import { StorefrontIcon } from "@/components/icons/storefront-icon";

const cardClass =
  "flex flex-col items-center gap-3 rounded-xl border border-burgundy/30 p-6 shadow-md transition hover:border-burgundy/50 hover:shadow-lg";

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
      <h1 className="text-2xl font-bold">Sip Fest Passport</h1>
      <p className="mt-2">
        Your companion for the Vancouver Hot Chocolate Festival. Browse drinks,
        keep a wishlist, and keep a journal of what you&apos;ve sipped.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { href: "/drinks", Icon: CoffeeMugIcon, label: "Browse Drinks" },
          { href: "/vendors", Icon: StorefrontIcon, label: "Browse Vendors" },
          { href: "/wishlist", Icon: BookmarkIcon, label: "Wishlist" },
          { href: "/journal", Icon: JournalIcon, label: "Journal" },
        ].map(({ href, Icon, label }) => (
          <li key={href}>
            <Link href={href} className={cardClass}>
              <Icon active={false} className="size-10 text-burgundy" />
              <span className="font-medium">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
