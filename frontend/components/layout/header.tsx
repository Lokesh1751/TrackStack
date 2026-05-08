// components/layout/header.tsx

"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/useToast";

import { logout } from "@/lib/api";

export default function Header() {
  const router = useRouter();

  const toast = useToast();

  const logoutMutation = useMutation({
    mutationFn: logout,

    onSuccess: (data: any) => {
      toast.success("Logged out successfully");

      router.push("/");
    },

    onError: (error: Error) => {
      toast.error("Logout failed", {
        description: error.message,
      });
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
        {/* Left */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#7189D0] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            TS
          </div>

          <div>
            <h1 className="font-semibold text-lg leading-none">TrackStack</h1>

            <p className="text-xs text-slate-500">Workspace Project Manager</p>
          </div>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/profile")}>
            Profile
          </Button>

          <Button
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
