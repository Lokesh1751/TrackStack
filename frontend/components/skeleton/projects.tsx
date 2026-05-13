"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* CREATE PROJECT */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />

            <div className="flex justify-end">
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-[25%]" />
                <Skeleton className="h-4 w-[35%]" />
                <Skeleton className="h-4 w-[15%]" />
                <Skeleton className="h-8 w-20 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* MEMBERS */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="border-b px-6 py-5 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />

            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}