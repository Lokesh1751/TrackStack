"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BacklogSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6 space-y-6">

      {/* HEADER */}
      <div className="rounded-3xl bg-white p-6 shadow-sm space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* TASK LIST */}
      <div className="rounded-3xl bg-white p-4 shadow-sm space-y-4">

        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex justify-between rounded-2xl border p-5"
          >
            {/* LEFT */}
            <div className="space-y-2 w-full">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-28" />
            </div>

            {/* RIGHT */}
            <div className="flex items-center">
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}