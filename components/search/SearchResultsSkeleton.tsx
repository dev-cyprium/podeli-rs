export function SearchResultsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-2xl bg-card shadow-md"
        >
          <div className="flex h-48 w-full items-center justify-center bg-muted">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted"></div>
          </div>
          <div className="p-5">
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted"></div>
            <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-muted"></div>
            <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-muted"></div>
            <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-muted"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
