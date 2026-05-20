"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* AVATAR */}
            <Skeleton className="h-28 w-28 rounded-3xl" />

            {/* INFO */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-56 rounded-lg" />

              <Skeleton className="h-4 w-72 rounded-lg" />

              <Skeleton className="h-4 w-48 rounded-lg" />

              <div className="flex gap-3 pt-2">
                <Skeleton className="h-9 w-28 rounded-xl" />

                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border shadow-sm p-5 space-y-3"
            >
              <Skeleton className="h-4 w-24 rounded-lg" />

              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>

        {/* PROFILE + TASKS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* PROFILE DETAILS */}
          <div className="xl:col-span-1 bg-white rounded-3xl border shadow-sm p-6 space-y-5">
            <Skeleton className="h-6 w-40 rounded-lg" />

            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-lg" />

                <Skeleton className="h-5 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* TASKS */}
          <div className="xl:col-span-2 bg-white rounded-3xl border shadow-sm p-6">
            <Skeleton className="h-6 w-48 rounded-lg mb-5" />

            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-52 rounded-lg" />

                    <Skeleton className="h-4 w-32 rounded-lg" />
                  </div>

                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROJECTS */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <Skeleton className="h-6 w-40 rounded-lg mb-5" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40 rounded-lg" />

                    <Skeleton className="h-4 w-56 rounded-lg" />
                  </div>

                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16 rounded-2xl" />

                  <Skeleton className="h-16 rounded-2xl" />

                  <Skeleton className="h-16 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMMENTS */}
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <Skeleton className="h-6 w-48 rounded-lg mb-5" />

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-2xl p-4 space-y-3"
              >
                <Skeleton className="h-4 w-64 rounded-lg" />

                <Skeleton className="h-4 w-40 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}