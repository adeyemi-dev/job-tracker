"use client";

import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmModal";
import { BottomNav } from "@/components/BottomNav";
import { UserMenu } from "@/components/UserMenu";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme');
            var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
          } catch(e){}
        `}} />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-200 pb-16 sm:pb-0">
        <ToastProvider><ConfirmProvider>
        {isLoginPage ? null : <nav className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Stats
              </a>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="/applications/new"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New</span>
              </a>
              <UserMenu />
            </div>
          </div>
        </nav>}
        <main className={isLoginPage ? "" : "max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8"}>
          {children}
        </main>
        {!isLoginPage && <footer className="border-t border-slate-200/80 dark:border-slate-800 mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              Developed by{" "}
              <span className="font-semibold text-slate-500 dark:text-slate-500">Afeez Laguda</span>
            </p>
          </div>
        </footer>}
        <BottomNav />
        </ConfirmProvider></ToastProvider>
      </body>
    </html>
  );
}
