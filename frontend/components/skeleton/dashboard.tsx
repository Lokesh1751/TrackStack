export function DashboardPageSkeleton() {
    return (
      <div className="bg-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6 animate-pulse">
  
          {/* HEADER */}
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-7 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-64 bg-slate-200 rounded" />
            </div>
  
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          </div>
  
          {/* TABLE CARD */}
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="border-b p-4">
              <div className="h-5 w-40 bg-slate-200 rounded" />
            </div>
  
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 border-b"
                >
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
  
        </div>
      </div>
    );
  }