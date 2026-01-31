import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Log the link in development. Set RESEND_API_KEY and add "resend" to send real emails.
        if (process.env.RESEND_API_KEY) {
          try {
            const { Resend } = await import("resend");
            const r = new Resend(process.env.RESEND_API_KEY);
            await r.emails.send({
              from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
              to: email,
              subject: "Sign in to Hot Chocolate Festival Passport",
              html: `Click to sign in: <a href="${url}">${url}</a>`,
            });
          } catch (e) {
            console.error("[Magic link] Resend error", e);
            console.log("[Magic link] Fallback URL:", email, url);
          }
        } else {
          console.log("[Magic link]", email, url);
        }
      },
      expiresIn: 60 * 5,
    }),
    nextCookies(),
  ],
});
