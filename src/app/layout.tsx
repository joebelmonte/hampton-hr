import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  title: "Hampton Home Run League",
  description: "Live standings for the Hampton Home Run League.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Script id="restore-theme" strategy="beforeInteractive">{`try { const theme = localStorage.getItem("hampton-theme"); if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme; } catch {}`}</Script>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
