"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastAction { label: string; onClick: () => void; }
interface Toast { id: number; message: string; type: ToastType; action?: ToastAction; }
interface ToastCtx { showToast: (message: string, type?: ToastType, action?: ToastAction) => void; }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });

const CONFIG = {
  success: { Icon: CheckCircle2, wrap: "bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-emerald-100/60 dark:shadow-slate-950", icon: "text-emerald-500", text: "text-slate-800 dark:text-slate-100", action: "text-emerald-700 dark:text-emerald-400" },
  error:   { Icon: XCircle,      wrap: "bg-white dark:bg-slate-900 border border-red-200    dark:border-red-800    shadow-red-100/40    dark:shadow-slate-950", icon: "text-red-500",     text: "text-slate-800 dark:text-slate-100", action: "text-red-700    dark:text-red-400" },
  info:    { Icon: Info,         wrap: "bg-white dark:bg-slate-900 border border-slate-200  dark:border-slate-700  shadow-slate-100/60  dark:shadow-slate-950", icon: "text-indigo-400",  text: "text-slate-800 dark:text-slate-100", action: "text-indigo-600 dark:text-indigo-400" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", action?: ToastAction) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    const timeout = action ? 5000 : 3500;
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), timeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-5 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        {toasts.map((t) => {
          const { Icon, wrap, icon, text, action: actionCls } = CONFIG[t.type];
          return (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200 ${wrap}`}>
              <Icon className={`w-4 h-4 shrink-0 ${icon}`} />
              <span className={text}>{t.message}</span>
              {t.action && (
                <button
                  onClick={t.action.onClick}
                  className={`text-xs font-bold underline ml-2 cursor-pointer shrink-0 ${actionCls}`}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
export type { ToastType };
