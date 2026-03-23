import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/app/sign-in/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-2xl font-bold">
          Sign in to Sip Fest Passport
        </h1>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            Sign-in failed. Please try again.
          </p>
        )}
        <SignInForm />
        <p className="text-center text-sm opacity-80">
          Sign in with your Google account to save your wishlist and journal.
        </p>
      </div>
    </main>
  );
}
