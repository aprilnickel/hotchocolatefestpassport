"use client";

import { useMoreMenu } from "./more-menu-context";

/**
 * Wraps the main app (everything that is NOT the more menu panel).
 * When the more menu panel is open, this wrapper shifts left so the panel can slide in from the right.
 */
export function AppWrapper({ children }: { children: React.ReactNode }) {
  const menu = useMoreMenu();
  const open = menu?.open ?? false;

  return (
    <div
      className="min-h-screen w-full transition-transform duration-300 ease-out md:translate-x-0!"
      style={{ transform: open ? "translateX(-100%)" : "translateX(0)" }}
    >
      {children}
    </div>
  );
}
