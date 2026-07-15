"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

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

  const isDanger = pending?.opts.danger !== false;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto ${isDanger ? "bg-red-100 dark:bg-red-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"}`}>
              {isDanger
                ? <AlertTriangle className="w-6 h-6 text-red-500" />
                : <HelpCircle className="w-6 h-6 text-indigo-500" />
              }
            </div>
            {pending.opts.title && (
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-center mb-1">{pending.opts.title}</h3>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">{pending.opts.message}</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handle(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handle(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl text-white transition-colors ${isDanger ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {pending.opts.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() { return useContext(ConfirmContext); }
