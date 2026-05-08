
import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "../globals.css";

import { QueryProvider } from "@/components/providers/query-provider";

import { Toaster } from "sonner";

import Header from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",

  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",

  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrackStack",

  description: "TrackStack authentication and dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-100">
        <QueryProvider>
          <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">{children}</main>
          </div>

          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
