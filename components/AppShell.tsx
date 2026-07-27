"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { BarChart2, Plus, ChevronUp } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {!isLoginPage && (
        <nav className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="/" className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-300 dark:shadow-indigo-900">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-[15px] tracking-tight">JobTracker</span>
              </a>
              <a href="/stats"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                <BarChart2 className="w-4 h-4" />
                Stats
              </a>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="/applications/new"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </a>
              <UserMenu />
            </div>
          </div>
        </nav>
      )}

      <main className={isLoginPage ? "" : "max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8"}>
        {children}
      </main>

      {!isLoginPage && (
        <footer className="border-t border-slate-200/80 dark:border-slate-800 mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              Developed by{" "}
              <span className="font-semibold text-slate-500 dark:text-slate-500">Afeez Laguda</span>
            </p>
          </div>
        </footer>
      )}

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-50 w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-indigo-100 dark:hover:shadow-indigo-950 transition-all duration-200 active:scale-95 ${showTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <ChevronUp className="w-4 h-4" />
      </button>
    </>
  );
}
