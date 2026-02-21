"use client";

import { useMoreMenu } from "./more-menu-context";
import { MobileNavbar } from "./mobile-navbar";

/**
 * Wraps MobileNavbar in a fixed bottom strip that uses the same transform as AppWrapper.
 * Keeps the nav sticky at the viewport bottom and sliding in sync with the main content.
 */
export function MobileNavbarSlideWrapper() {
  const menu = useMoreMenu();
  const open = menu?.open ?? false;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out md:transition-none md:hidden"
      style={{ transform: open ? "translateX(-100%)" : "translateX(0)" }}
    >
      <MobileNavbar />
    </div>
  );
}
