import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const useActivePage = () => {
  const pathname = usePathname();
  const [activePage, setActivePage] = useState<'home' | 'drinks' | 'wishlist' | 'journal'>('home');

  useEffect(() => {
    if (pathname === "/") {
      setActivePage('home');
    } else if (pathname === "/drinks") {
      setActivePage('drinks');
    } else if (pathname === "/wishlist") {
      setActivePage('wishlist');
    } else if (pathname === "/journal") {
      setActivePage('journal');
    }
  }, [pathname]);

  return activePage;
};

export default useActivePage;