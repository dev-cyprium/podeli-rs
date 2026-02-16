export function ItemsGridSkeleton() {
  return (
    <section id="ponuda" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted"></div>
          <div className="h-5 w-32 animate-pulse rounded-lg bg-muted"></div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="relative">
              <div className="aspect-square animate-pulse rounded-xl bg-muted" />
              <div className="space-y-1.5 pt-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
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
