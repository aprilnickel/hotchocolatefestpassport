"use client";

import { createContext, useContext, useState, useCallback } from "react";

type MoreMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const MoreMenuContext = createContext<MoreMenuContextValue | null>(null);

export function MoreMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <MoreMenuContext value={{ open, setOpen, toggle }}>
      {children}
    </MoreMenuContext>
  );
}

export function useMoreMenu() {
  const ctx = useContext(MoreMenuContext);
  if (!ctx) return null;
  return ctx;
}
