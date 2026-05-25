// components/shared/notifications/notifications-skeleton.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-[#edf1f7] bg-white p-4"
        >
          <div className="flex items-start gap-4">
            {/* ICON */}
            <Skeleton className="h-11 w-11 rounded-2xl" />

            {/* CONTENT */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                  <Skeleton className="h-3 w-52 rounded-md" />
                </div>

                <Skeleton className="h-6 w-12 rounded-full" />
              </div>

              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28 rounded-md" />

                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}