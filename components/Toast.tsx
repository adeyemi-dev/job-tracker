"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType; }
interface ToastCtx { showToast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });

const CONFIG = {
  success: { Icon: CheckCircle2, wrap: "bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-emerald-100/60 dark:shadow-slate-950", icon: "text-emerald-500", text: "text-slate-800 dark:text-slate-100" },
  error:   { Icon: XCircle,      wrap: "bg-white dark:bg-slate-900 border border-red-200    dark:border-red-800    shadow-red-100/40    dark:shadow-slate-950", icon: "text-red-500",     text: "text-slate-800 dark:text-slate-100" },
  info:    { Icon: Info,         wrap: "bg-white dark:bg-slate-900 border border-slate-200  dark:border-slate-700  shadow-slate-100/60  dark:shadow-slate-950", icon: "text-indigo-400",  text: "text-slate-800 dark:text-slate-100" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-5 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        {toasts.map((t) => {
          const { Icon, wrap, icon, text } = CONFIG[t.type];
          return (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200 ${wrap}`}>
              <Icon className={`w-4 h-4 shrink-0 ${icon}`} />
              <span className={text}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
