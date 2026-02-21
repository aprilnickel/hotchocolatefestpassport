"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useMoreMenu } from "./more-menu-context";

const moreMenuLinkClass =
  "flex min-h-[44px] min-w-[44px] items-center rounded px-2 text-sm font-medium w-full justify-start text-cream";

export function MoreMenuPanel() {
  const menu = useMoreMenu();
  const { data: session, isPending } = authClient.useSession();

  if (!menu) return null;

  const { open, setOpen } = menu;
  const close = () => setOpen(false);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-burgundy shadow-lg transition-transform duration-300 ease-out pointer-events-none data-[open]:pointer-events-auto"
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
            className="flex size-10 items-center justify-center rounded-full text-cream hover:bg-burgundy-dark"
            aria-label="Close menu"
          >
            <span className="text-2xl leading-none" aria-hidden>×</span>
          </button>
        </div>
        <div className="px-4 pb-6 pt-2">
          <nav>
            <ul className="flex flex-col gap-1">
              {isPending ? (
                <li>
                  <span className="flex min-h-[44px] items-center text-sm opacity-70">
                    Loading…
                  </span>
                </li>
              ) : session ? (
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
                    className={moreMenuLinkClass}
                  >
                    Sign Out
                  </button>
                </li>
              ) : (
                <li>
                  <Link href="/sign-in" className={moreMenuLinkClass} onClick={close}>
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
