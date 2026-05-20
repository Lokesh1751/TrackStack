// components/layout/header.tsx

"use client";

import Link from "next/link";

import { useRouter, usePathname } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import {
  User,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/useToast";

import { logout } from "@/lib/api";

export default function Header() {
  const router = useRouter();

  const pathname = usePathname();

  const toast = useToast();
  const isLoggedIn = localStorage?.getItem("userId");

  const logoutMutation = useMutation({
    mutationFn: logout,

    onSuccess: () => {
      toast.success("Logged out successfully");
      localStorage.clear();
    },

    onError: (error: Error) => {
      toast.error("Logout failed", {
        description: error.message,
      });
    },
  });


  return (
    <header className="sticky top-0 z-50 border-b border-[#dfe5f1] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] items-center justify-between px-4 md:px-6">
        {/* ================================================= */}
        {/* LEFT */}
        {/* ================================================= */}

        <div className="flex items-center gap-10">
          {/* LOGO */}
          <Link href="/" className="group flex items-center gap-3 transition">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#7189D0] to-[#8EA3E2] shadow-lg shadow-[#7189D0]/25">
              <span className="text-sm font-black tracking-wider text-white">
                TS
              </span>
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight text-[#1f2937]">
                TrackStack
              </h1>

              <p className="flex items-center gap-1 text-xs text-[#7189D0]">
                <Sparkles className="h-3 w-3" />
                Agile Workspace Platform
              </p>
            </div>
          </Link>
        </div>

        {/* ================================================= */}
        {/* RIGHT */}
        {/* ================================================= */}

        <div className="flex items-center gap-3">
          {/* PROFILE */}
          <Button
            variant="outline"
            onClick={() => router.push("/profile")}
            className="hidden h-11 rounded-2xl border-[#dfe5f1] bg-white px-5 text-sm font-medium text-[#4b5563] transition hover:border-[#7189D0] hover:bg-[#f4f7ff] hover:text-[#7189D0] sm:flex"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>

          {/* LOGOUT */}
          <Button
            disabled={logoutMutation.isPending}
            onClick={() =>
              isLoggedIn ? logoutMutation.mutate() : router.push("/login")
            }
            className="h-11 rounded-2xl bg-[#7189D0] px-5 text-sm font-semibold text-white shadow-md shadow-[#7189D0]/20 transition hover:bg-[#6279bc]"
          >
            <LogOut className="mr-2 h-4 w-4" />

            {logoutMutation.isPending
              ? "Logging out..."
              : isLoggedIn
                ? "Logout"
                : "Login"}
          </Button>
        </div>
      </div>
    </header>
  );
}
