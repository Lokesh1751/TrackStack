"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getCurrentUser, logout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>TrackStack Dashboard</CardTitle>
          <CardDescription>
            You are logged in and viewing a protected route.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">User ID:</span>{" "}
              {data?.user?.id ?? "Unavailable"}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {data?.user?.email ?? "Unavailable"}
            </p>
          </div>
          <Button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go back</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
