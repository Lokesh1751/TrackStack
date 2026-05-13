export function TaskBoardSkeleton() {
    return (
      <div className="min-h-screen bg-neutral-100 p-6">
        {/* HEADER SKELETON */}
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm animate-pulse">
          <div className="h-8 w-1/3 rounded bg-neutral-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-neutral-200" />
        </div>
  
        {/* CREATE TASK SKELETON */}
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm animate-pulse">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-2xl bg-neutral-200" />
            ))}
          </div>
        </div>
  
        {/* FILTER SKELETON */}
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm animate-pulse">
          <div className="h-5 w-1/3 rounded bg-neutral-200" />
          <div className="mt-4 h-10 w-full rounded-2xl bg-neutral-200" />
        </div>
  
        {/* BOARD SKELETON */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="rounded-3xl bg-white p-4 shadow-sm animate-pulse">
              <div className="mb-4 flex justify-between">
                <div className="h-4 w-1/3 rounded bg-neutral-200" />
                <div className="h-5 w-10 rounded-full bg-neutral-200" />
              </div>
  
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-3xl border p-5">
                    <div className="h-4 w-1/4 rounded bg-neutral-200" />
                    <div className="mt-2 h-5 w-2/3 rounded bg-neutral-200" />
                    <div className="mt-3 h-3 w-full rounded bg-neutral-200" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }