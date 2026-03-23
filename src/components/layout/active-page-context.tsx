"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

type ActivePage = {
  slug: 'home' | 'drinks' | 'wishlist' | 'journal' | 'about' | 'not-found';
  title: string;
  headerTitle: string;
};

const pageMap: Record<string, ActivePage> = {
  home: { slug: 'home', title: 'Home', headerTitle: 'Sip Fest Passport' },
  drinks: { slug: 'drinks', title: 'Drinks', headerTitle: 'Festival Drinks' },
  wishlist: { slug: 'wishlist', title: 'Wishlist', headerTitle: 'My Wishlist' },
  journal: { slug: 'journal', title: 'Journal', headerTitle: 'My Journal' },
  about: { slug: 'about', title: 'About', headerTitle: 'About' },
  notFound: { slug: 'not-found', title: 'Not Found', headerTitle: 'Not Found' },
};

type ActivePageContextValue = {
  activePage: ActivePage;
  setActivePage: (activePage: ActivePage) => void;
};

const ActivePageContext = createContext<ActivePageContextValue | null>(null);

export function ActivePageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activePage, setActivePage] = useState<ActivePage>(pageMap.home);

  useEffect(() => {
    if (pathname === "/") {
      setActivePage(pageMap.home);
    } else if (pathname.startsWith("/drinks")) {
      setActivePage(pageMap.drinks);
    } else if (pathname === "/wishlist") {
      setActivePage(pageMap.wishlist);
    } else if (pathname === "/journal") {
      setActivePage(pageMap.journal);
    } else if (pathname === "/about") {
      setActivePage(pageMap.about);
    } else {
      setActivePage(pageMap.notFound);
    }
  }, [pathname]);

  return (
    <ActivePageContext value={{ activePage, setActivePage }}>
      {children}
    </ActivePageContext>
  );
}

export function useActivePage(): ActivePageContextValue {
  const ctx = useContext(ActivePageContext);
  if (!ctx) {
    throw new Error("useActivePage must be used within ActivePageProvider");
  }
  return ctx;
}
