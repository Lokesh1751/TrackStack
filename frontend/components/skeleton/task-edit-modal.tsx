export function TaskModalSkeleton() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#7189D0]/50 p-4">
        <div className="w-full  rounded-3xl bg-white p-6 shadow-2xl animate-pulse">
          
          {/* HEADER */}
          <div className="mb-8 flex justify-between">
            <div>
              <div className="h-4 w-24 rounded bg-neutral-200" />
              <div className="mt-3 h-6 w-64 rounded bg-neutral-200" />
            </div>
            <div className="h-10 w-20 rounded-xl bg-neutral-200" />
          </div>
  
          {/* TASK DETAILS */}
          <div className="rounded-3xl bg-neutral-100 p-5">
            <div className="mb-4 h-5 w-40 rounded bg-neutral-200" />
  
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-10 rounded-2xl bg-neutral-200" />
              <div className="h-10 rounded-2xl bg-neutral-200" />
            </div>
  
            <div className="mt-4 h-24 rounded-2xl bg-neutral-200" />
  
            <div className="mt-4 flex gap-3">
              <div className="h-10 w-32 rounded-2xl bg-neutral-200" />
              <div className="h-10 w-32 rounded-2xl bg-neutral-200" />
            </div>
          </div>
  
          {/* ASSIGN SECTION */}
          <div className="mt-6 rounded-3xl bg-white p-6">
            <div className="mb-4 h-5 w-40 rounded bg-neutral-200" />
  
            <div className="flex gap-3">
              <div className="h-12 flex-1 rounded-2xl bg-neutral-200" />
              <div className="h-12 w-40 rounded-2xl bg-neutral-200" />
            </div>
  
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-full bg-neutral-200" />
              ))}
            </div>
          </div>
  
          {/* COMMENTS */}
          <div className="mt-6 rounded-3xl bg-neutral-100 p-5">
            <div className="mb-4 h-5 w-32 rounded bg-neutral-200" />
  
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-3 rounded-2xl bg-white p-4">
                <div className="h-4 w-1/3 rounded bg-neutral-200" />
                <div className="mt-2 h-3 w-full rounded bg-neutral-200" />
              </div>
            ))}
  
            <div className="mt-4 flex gap-3">
              <div className="h-10 flex-1 rounded-2xl bg-neutral-200" />
              <div className="h-10 w-24 rounded-2xl bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }