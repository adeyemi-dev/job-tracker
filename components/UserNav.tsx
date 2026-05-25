"use client";

import { useSession, signOut } from "next-auth/react";

export function UserNav() {
  const { data: session } = useSession();
  if (!session) return null;

  const initials = (session.user?.name ?? session.user?.email ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
          {initials}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
          {session.user?.name ?? session.user?.email}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
