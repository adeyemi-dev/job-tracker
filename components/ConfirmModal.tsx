"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface Opts { title?: string; message: string; confirmLabel?: string; danger?: boolean; }
type Resolve = (v: boolean) => void;
type ConfirmFn = (opts: Opts) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ opts: Opts; resolve: Resolve } | null>(null);

  const confirm = useCallback((opts: Opts): Promise<boolean> => {
    return new Promise((resolve) => setPending({ opts, resolve }));
  }, []);

  function handle(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-full max-w-sm">
            {pending.opts.title && (
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{pending.opts.title}</h3>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400">{pending.opts.message}</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => handle(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handle(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl text-white transition-colors ${
                  pending.opts.danger !== false ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {pending.opts.confirmLabel ?? "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() { return useContext(ConfirmContext); }
