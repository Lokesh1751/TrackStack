"use client";

export function SprintPageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6 animate-pulse">
      {/* HEADER SKELETON */}
      <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-10 w-72 rounded-xl bg-neutral-200" />
            <div className="h-4 w-96 rounded-xl bg-neutral-200" />
          </div>

          <div className="flex gap-2">
            <div className="h-12 w-32 rounded-2xl bg-neutral-200" />
            <div className="h-12 w-36 rounded-2xl bg-neutral-200" />
          </div>
        </div>

        {/* CREATE SPRINT SKELETON */}
        <div className="mt-8 rounded-3xl border border-neutral-200 bg-neutral-50 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-neutral-200" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-neutral-200" />
              <div className="h-4 w-64 rounded bg-neutral-200" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-14 rounded-2xl bg-neutral-200" />
            <div className="h-14 rounded-2xl bg-neutral-200" />
            <div className="h-14 rounded-2xl bg-neutral-200" />
            <div className="h-14 rounded-2xl bg-neutral-200" />
          </div>

          <div className="h-14 w-48 rounded-2xl bg-neutral-200" />
        </div>
      </div>

      {/* SPRINT CARDS SKELETON */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-neutral-200 bg-white p-6 space-y-5"
          >
            {/* top */}
            <div className="flex justify-between">
              <div className="space-y-3">
                <div className="h-6 w-24 rounded-full bg-neutral-200" />
                <div className="h-7 w-40 rounded bg-neutral-200" />
                <div className="h-4 w-64 rounded bg-neutral-200" />
              </div>

              <div className="h-10 w-10 rounded-2xl bg-neutral-200" />
            </div>

            {/* info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-24 rounded-2xl bg-neutral-100" />
              <div className="h-24 rounded-2xl bg-neutral-100" />
            </div>

            {/* actions */}
            <div className="flex gap-3">
              <div className="h-10 w-32 rounded-2xl bg-neutral-200" />
              <div className="h-10 w-32 rounded-2xl bg-neutral-200" />
              <div className="h-10 w-28 rounded-2xl bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}