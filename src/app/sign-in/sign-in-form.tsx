"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const { data, error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/",
      errorCallbackURL: "/sign-in?error=1",
    });
    if (error) {
      setStatus("error");
      setMessage(error.message ?? "Something went wrong.");
      return;
    }
    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        disabled={status === "loading" || status === "sent"}
      />
      <button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="w-full rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
      >
        {status === "loading"
          ? "Sending…"
          : status === "sent"
            ? "Check your email"
            : "Send magic link"}
      </button>
      {message && (
        <p
          className={`text-sm ${status === "error" ? "text-red-600" : "text-neutral-600"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
