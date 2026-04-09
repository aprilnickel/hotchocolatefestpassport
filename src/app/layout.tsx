import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { MobileNavbarSlideWrapper } from "@/components/layout/mobile-navbar-slide-wrapper";
import { MoreMenuProvider } from "@/components/layout/more-menu-context";
import { MoreMenuPanel } from "@/components/layout/more-menu-panel";
import { AppWrapper } from "@/components/layout/app-wrapper";
import { Work_Sans } from 'next/font/google';
import "./globals.css";
import { ActivePageProvider } from "@/components/layout/active-page-context";
import { cn } from "@/lib/utils";

const workSans = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable:'--font-sans',
})

export const metadata: Metadata = {
  title: "Sip Fest Passport",
  description: "Your companion for the Vancouver Hot Chocolate Festival",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", workSans.variable)}>
      <body className={`antialiased bg-cream text-burgundy ${workSans.className}`}>
        <ActivePageProvider>
          <MoreMenuProvider>
            <MoreMenuPanel />
            <AppWrapper>
              <Header />
              <main className="pb-20 md:pb-0">{children}</main>
            </AppWrapper>
            <MobileNavbarSlideWrapper />
          </MoreMenuProvider>
        </ActivePageProvider>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
