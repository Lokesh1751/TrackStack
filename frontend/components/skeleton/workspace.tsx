export function WorkspacePageSkeleton() {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className=" mx-auto px-4 md:px-6 py-8 space-y-6 animate-pulse">
  
          {/* =========================
              HEADER (EXACT STRUCTURE)
          ========================= */}
          <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
  
            {/* BANNER */}
            <div className="h-40 bg-slate-200" />
  
            <div className="px-8 pb-8">
              <div className="-mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
  
                {/* LEFT */}
                <div className="flex items-end gap-5">
  
                  {/* LOGO */}
                  <div className="h-28 w-28 rounded-3xl bg-slate-200 border-4 border-white shadow-md" />
  
                  {/* TEXT */}
                  <div className="mb-4 space-y-3">
                    <div className="h-6 w-64 rounded bg-slate-200" />
                    <div className="h-4 w-80 rounded bg-slate-200" />
  
                    {/* BADGES */}
                    <div className="flex gap-2 mt-4">
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                      <div className="h-6 w-28 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
  
                {/* RIGHT BUTTONS */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-32 rounded-2xl bg-slate-200" />
                  <div className="h-10 w-32 rounded-2xl bg-slate-200" />
                </div>
  
              </div>
            </div>
          </div>
  
          {/* =========================
              STATS (EXACT STRUCTURE)
          ========================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
  
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border shadow-sm p-6 space-y-3">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-8 w-16 rounded bg-slate-200" />
              </div>
            ))}
  
          </div>
  
          {/* =========================
              WORKSPACE DETAILS
          ========================= */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
  
            <div className="border-b px-6 py-5 space-y-2">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-72 bg-slate-200 rounded" />
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
  
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                </div>
              ))}
  
            </div>
          </div>
  
          {/* =========================
              MEMBERS
          ========================= */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
  
            <div className="border-b px-6 py-5 flex items-center justify-between">
  
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-72 bg-slate-200 rounded" />
              </div>
  
              <div className="h-10 w-36 rounded-2xl bg-slate-200" />
  
            </div>
  
            <div className="divide-y">
  
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
  
                  <div className="h-4 w-40 bg-slate-200 rounded" />
  
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
  
                </div>
              ))}
  
            </div>
          </div>
  
          {/* =========================
              PROJECTS
          ========================= */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
  
            <div className="border-b px-6 py-5 flex items-center justify-between">
  
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-72 bg-slate-200 rounded" />
              </div>
  
              <div className="h-10 w-36 rounded-2xl bg-slate-200" />
  
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-6">
  
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-2xl p-5 space-y-3">
  
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-200 rounded" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded" />
  
                  <div className="flex justify-between pt-3">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                  </div>
  
                </div>
              ))}
  
            </div>
          </div>
  
        </div>
      </div>
    );
  }