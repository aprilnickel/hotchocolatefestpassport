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
                <svg className="size-4 inline-block" viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M32 57.6c-.8 0-1.6-.3-2.2-.8c-2.3-2-4.6-3.9-6.6-5.6c-5.8-4.9-10.9-9.2-14.4-13.4C4.8 33 3 28.6 3 23.7c0-4.7 1.6-9.1 4.6-12.3s7.1-5 11.6-5c3.3 0 6.4 1.1 9.1 3.1c1.1.8 2 1.8 2.9 2.9c.4.5 1.1.5 1.5 0c.9-1.1 1.9-2 2.9-2.9c2.7-2.1 5.8-3.1 9.1-3.1c4.5 0 8.6 1.8 11.6 5s4.6 7.6 4.6 12.3c0 4.9-1.8 9.3-5.8 14c-3.5 4.2-8.6 8.5-14.4 13.4c-2 1.7-4.3 3.6-6.6 5.6c-.5.6-1.3.9-2.1.9" />
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
