"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, User, LogOut } from "lucide-react";

export function UserMenu() {
  const [initials, setInitials] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      const name = user?.user_metadata?.full_name || user?.email || "";
      const parts = name.split(/[\s@._-]+/).filter(Boolean);
      const init = parts.length >= 2
        ? (parts[0][0] + parts[1][0])
        : (parts[0]?.[0] ?? "U");
      setInitials(init.toUpperCase());
    });
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-950">
          {initials || "·"}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/60 dark:shadow-slate-950 py-1.5 overflow-hidden">
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <User className="w-4 h-4 text-slate-400" />
              Account
            </Link>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-1" />
            <button
              onClick={async () => { setOpen(false); await signOut(); router.push("/login"); router.refresh(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
