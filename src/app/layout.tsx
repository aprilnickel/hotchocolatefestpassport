import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hot Chocolate Festival Passport",
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
    <html lang="en">
      <body className="antialiased">
        <Header />
        <main className="pb-20 md:pb-0">{children}</main>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
