import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h1 className="text-xl font-bold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block min-h-[44px] min-w-[44px] rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-800"
      >
        Go home
      </Link>
    </main>
  );
}
