export function LoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-indigo-100 dark:bg-indigo-950 overflow-hidden">
      <div className="h-full bg-indigo-500 animate-loading-bar" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 animate-pulse">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          <div className="h-7 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-7 w-14 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-slate-400 dark:text-slate-500">Loading your applications…</span>
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
