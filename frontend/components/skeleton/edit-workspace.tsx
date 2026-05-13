export function EditWorkspacePageSkeleton() {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
  
          {/* ========================= */}
          {/* WORKSPACE CARD */}
          {/* ========================= */}
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
  
            {/* HEADER */}
            <div className="border-b px-6 py-5 space-y-3">
              <div className="h-6 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-64 bg-slate-200 rounded" />
            </div>
  
            {/* BODY */}
            <div className="p-6 space-y-6">
  
              {/* LOGO */}
              <div className="flex items-center gap-5">
                <div className="h-24 w-24 rounded-2xl bg-slate-200 border" />
  
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-200 rounded" />
                </div>
              </div>
  
              {/* INPUTS */}
              <div className="space-y-4">
  
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-10 w-full bg-slate-200 rounded-xl" />
                </div>
  
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-10 w-full bg-slate-200 rounded-xl" />
                  <div className="h-3 w-48 bg-slate-200 rounded" />
                </div>
  
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                  <div className="h-24 w-full bg-slate-200 rounded-xl" />
                </div>
  
              </div>
            </div>
  
            {/* FOOTER */}
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <div className="h-10 w-24 bg-slate-200 rounded-xl" />
              <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            </div>
          </div>
  
          {/* ========================= */}
          {/* MEMBERS CARD */}
          {/* ========================= */}
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
  
            {/* HEADER */}
            <div className="border-b px-6 py-5 space-y-3">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-200 rounded" />
            </div>
  
            {/* LIST */}
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-200 rounded" />
                  </div>
  
                  <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
  
        </div>
      </div>
    );
  }