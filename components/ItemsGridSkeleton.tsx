export function ItemsGridSkeleton() {
  return (
    <section id="ponuda" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200"></div>
          <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-200"></div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md"
            >
              {/* Image skeleton */}
              <div className="relative flex h-48 w-full items-center justify-center bg-slate-100">
                <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200"></div>
              </div>

              {/* Content skeleton */}
              <div className="flex h-full flex-col p-5">
                {/* Title and category */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200"></div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200"></div>
                </div>

                {/* Location */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200"></div>
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-200"></div>
                </div>

                {/* Divider and bottom section */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200"></div>
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-200"></div>
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded bg-slate-200"></div>
                </div>

                {/* Buttons */}
                <div className="mt-4 flex gap-2">
                  <div className="h-9 flex-1 animate-pulse rounded-lg bg-slate-200"></div>
                  <div className="h-9 flex-1 animate-pulse rounded-lg bg-slate-200"></div>
                </div>
              </div>

              {/* Shimmer overlay */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
