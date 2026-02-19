import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="mt-2">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="mt-6 inline-block btn-primary">
        Go home
      </Link>
    </main>
  );
}
