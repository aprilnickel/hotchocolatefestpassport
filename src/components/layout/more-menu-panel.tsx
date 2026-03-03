"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { AboutIcon } from "@/components/icons/about-icon";
import { LightbulbIcon } from "@/components/icons/lightbulb-icon";
import { BugIcon } from "@/components/icons/bug-icon";
import { SignInIcon } from "@/components/icons/sign-in-icon";
import { SignOutIcon } from "@/components/icons/sign-out-icon";
import { useMoreMenu } from "./more-menu-context";

export function MoreMenuPanel() {
  const menu = useMoreMenu();
  const { data: session } = authClient.useSession();

  if (!menu) return null;

  const { open, setOpen } = menu;
  const close = () => setOpen(false);

  return (
    <>
      {/* Backdrop: desktop only, closes menu when clicking outside sidebar */}
      <div
        className="fixed inset-0 z-30 bg-black/30 opacity-0 transition-opacity duration-300 ease-out pointer-events-none data-[open]:opacity-100 data-[open]:pointer-events-auto hidden md:block"
        data-open={open || undefined}
        onClick={close}
        aria-hidden={!open}
      />
      <div
        className="fixed inset-0 z-40 flex flex-col bg-burgundy shadow-lg transition-transform duration-300 ease-out pointer-events-none data-[open]:pointer-events-auto md:inset-y-0 md:right-0 md:left-auto md:w-80 md:max-w-[85vw]"
        data-open={open || undefined}
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        aria-hidden={!open}
        aria-label="More menu"
      >
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex min-h-[44px] items-center justify-end px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={close}
            className="flex size-10 items-center justify-center rounded text-cream hover:bg-cream hover:text-burgundy"
            aria-label="Close menu"
          >
            <span className="text-2xl leading-none" aria-hidden>×</span>
          </button>
        </div>
        <div className="flex flex-1 flex-col px-4 pb-6 pt-2">
          <nav>
            <ul className="flex flex-col gap-1">
              <li>
                <Link href="/about" className="more-menu-btn" onClick={close}>
                  <AboutIcon />
                  About
                </Link>
              </li>
              <li>
                <button type="button" className="more-menu-btn posthog-feedback-btn-feature-request">
                  <LightbulbIcon />
                  Request a feature
                </button>
              </li>
              <li>
                <button type="button" className="more-menu-btn posthog-feedback-btn-bug-report">
                  <BugIcon />
                  Report a bug
                </button>
              </li>
              {session ? (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            window.location.href = "/";
                          },
                        },
                      });
                    }}
                    className="more-menu-btn"
                  >
                    <SignOutIcon />
                    Sign Out
                  </button>
                </li>
              ) : (
                <li>
                  <Link href="/sign-in" className="more-menu-btn" onClick={close}>
                    <SignInIcon />
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <footer className="mt-auto pt-6 text-center text-sm text-cream/80">
            <a href="https://aprildawne.com/" target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] min-w-[44px] size-10 items-center rounded gap-2 px-4 w-full justify-center hover:bg-cream hover:text-burgundy">
              Made with{" "}
              <span className="inline-flex align-middle" role="img" aria-label="love">
                <svg className="size-4 inline-block" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
              {" "}by{" "}
              <span className="hover:underline">aprildawne.com</span>
            </a>
          </footer>
        </div>
      </div>
    </div>
    </>
  );
}
