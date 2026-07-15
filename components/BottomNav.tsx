"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, PlusCircle, User } from "lucide-react";

const ITEMS = [
  { href: "/",                label: "Home",    Icon: Home },
  { href: "/stats",           label: "Stats",   Icon: BarChart2 },
  { href: "/applications/new",label: "New",     Icon: PlusCircle },
  { href: "/settings",        label: "Account", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex safe-bottom">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 flex-1 py-2.5 text-xs font-medium transition-colors ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
            <div className={`relative p-1 rounded-xl transition-colors ${active ? "bg-indigo-50 dark:bg-indigo-900/30" : ""}`}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />}
            </div>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
