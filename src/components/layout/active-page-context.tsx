"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

type ActivePage = {
  slug: 'home' | 'drinks' | 'wishlist' | 'journal' | 'not-found';
  title: string;
  headerTitle: string;
};

const pageMap: Record<string, ActivePage> = {
  home: { slug: 'home', title: 'Home', headerTitle: 'Hot Chocolate Festival Passport' },
  drinks: { slug: 'drinks', title: 'Drinks', headerTitle: 'Festival Drinks' },
  wishlist: { slug: 'wishlist', title: 'Wishlist', headerTitle: 'My Wishlist' },
  journal: { slug: 'journal', title: 'Journal', headerTitle: 'My Journal' },
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
    switch (pathname) {
      case "/":
        setActivePage(pageMap.home);
        break;
      case "/drinks":
        setActivePage(pageMap.drinks);
        break;
      case "/wishlist":
        setActivePage(pageMap.wishlist);
        break;
      case "/journal":
        setActivePage(pageMap.journal);
        break;
      default:
        setActivePage(pageMap.notFound);
        break;
    }
  }, [pathname]);

  return (
    <ActivePageContext value={{ activePage, setActivePage }}>
      {children}
    </ActivePageContext>
  );
}

export function useActivePage() {
  const ctx = useContext(ActivePageContext);
  if (!ctx) return null;
  return ctx;
}
