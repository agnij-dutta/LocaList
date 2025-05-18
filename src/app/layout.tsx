import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/NextAuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LocaList - Community Events Near You",
  description: "Discover and join local events in your community",
  keywords: ["local events", "community", "events", "activities", "local"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-b from-background-start-rgb to-background-end-rgb">
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
