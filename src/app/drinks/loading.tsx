export default function DrinksLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-neutral-200" />
      <ul className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
          </li>
        ))}
      </ul>
    </main>
  );
}
