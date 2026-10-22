import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { CatalogProvider } from "@/lib/catalog";
import { LanguageProvider } from "@/lib/language";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oakline — Thoughtfully made goods for everyday living",
  description:
    "Durable materials, simple shapes and fair prices for the rooms you actually use.",
};

// The root layout wraps every page in the app.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#12141a]">
        {/* Providers hold data used across the whole site (catalogue + cart + language). */}
        <LanguageProvider>
          <CatalogProvider>
            <CartProvider>{children}</CartProvider>
          </CatalogProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
