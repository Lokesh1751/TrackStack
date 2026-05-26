import type { Metadata } from "next";

import Header from "@/components/layout/header";

export const metadata: Metadata = {
  title: "TrackStack",
  description: "TrackStack authentication and dashboard",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100  flex flex-col"> 
      <Header />

      <main className="flex-1">{children}</main>
    </div>
  );
}