"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TaskActionModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-48" />
          </div>

          <Skeleton className="h-6 w-6 rounded" />
        </div>

        {/* ASSIGN USER */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* MOVE TO SPRINT */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

      </div>
    </div>
  );
}