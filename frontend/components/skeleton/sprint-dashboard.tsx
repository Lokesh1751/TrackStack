import { Skeleton } from "@/components/ui/skeleton";

export function SprintDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      {/* HEADER */}
      <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-72 rounded-xl" />

            <Skeleton className="mt-3 h-4 w-48 rounded-lg" />
          </div>

          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />

                <Skeleton className="h-8 w-20" />
              </div>

              <Skeleton className="h-14 w-14 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* BURNDOWN */}
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <Skeleton className="h-6 w-48" />

            <Skeleton className="mt-2 h-4 w-64" />
          </div>

          <Skeleton className="h-[350px] w-full rounded-2xl" />
        </div>

        {/* PIE CHART */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <Skeleton className="h-6 w-40" />

            <Skeleton className="mt-2 h-4 w-52" />
          </div>

          <div className="flex h-[350px] items-center justify-center">
            <Skeleton className="h-56 w-56 rounded-full" />
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* VELOCITY */}
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <Skeleton className="h-6 w-44" />

            <Skeleton className="mt-2 h-4 w-56" />
          </div>

          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </div>

        {/* SUMMARY */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <Skeleton className="h-6 w-44" />

            <Skeleton className="mt-2 h-4 w-40" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"
              >
                <Skeleton className="h-4 w-24" />

                <Skeleton className="h-5 w-14" />
              </div>
            ))}

            <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
              <Skeleton className="h-5 w-28" />

              <Skeleton className="mt-3 h-4 w-full" />

              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}