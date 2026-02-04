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
        {children}
        <Toaster richColors closeButton position="bottom-right" />
      </body>
    </html>
  );
}
