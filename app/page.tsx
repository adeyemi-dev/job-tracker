"use client";

import { useEffect, useState } from "react";
import { Application, ALL_STATUSES, Status, STATUS_DOT, isOverdue } from "@/lib/types";
import { ApplicationCard } from "@/components/ApplicationCard";
import { getApps, deleteApp } from "@/lib/store";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️", sub: "Let's find that dream role today." };
  if (h < 17) return { text: "Good afternoon", emoji: "🎯", sub: "Keep pushing — the right job is out there." };
  return { text: "Good evening", emoji: "🌙", sub: "Reflect on today's progress." };
}

const STAT_STATUSES: { label: string; key: Status | "Active"; color: string; bg: string; darkBg: string; darkColor: string; icon: React.ReactNode }[] = [
  {
    label: "Active", key: "Active",
    color: "text-indigo-700", bg: "bg-indigo-50",
    darkColor: "dark:text-indigo-300", darkBg: "dark:bg-indigo-900/30",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    label: "Interviews", key: "Interview",
    color: "text-amber-700", bg: "bg-amber-50",
    darkColor: "dark:text-amber-300", darkBg: "dark:bg-amber-900/30",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    label: "Offers", key: "Offer",
    color: "text-emerald-700", bg: "bg-emerald-50",
    darkColor: "dark:text-emerald-300", darkBg: "dark:bg-emerald-900/30",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    label: "Rejected", key: "Rejected",
    color: "text-red-700", bg: "bg-red-50",
    darkColor: "dark:text-red-300", darkBg: "dark:bg-red-900/30",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  },
];

export default function Dashboard() {
  const [allApps, setAllApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Status | "All">("All");
  const [search, setSearch] = useState("");

  useEffect(() => { setAllApps(getApps()); }, []);

  function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return;
    deleteApp(id);
    setAllApps((prev) => prev.filter((a) => a.id !== id));
  }

  const q = search.toLowerCase().trim();
  const displayed = allApps
    .filter((a) => filter === "All" || a.status === filter)
    .filter((a) => !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));

  const overdueApps = allApps.filter(
    (a) => isOverdue(a.followup_date) && !["Saved", "In Progress", "Rejected", "Withdrawn", "Ghosted"].includes(a.status)
  );

  const activeCount = allApps.filter((a) => !["Rejected", "Withdrawn", "Offer", "Ghosted"].includes(a.status)).length;
  const countFor = (s: Status) => allApps.filter((a) => a.status === s).length;

  const greeting = getGreeting();

  return (
    <div>
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
        {/* Decorative SVG background */}
        <svg className="absolute right-0 top-0 h-full opacity-10" viewBox="0 0 300 200" fill="none">
          <circle cx="250" cy="30" r="80" stroke="white" strokeWidth="2" />
          <circle cx="280" cy="100" r="50" stroke="white" strokeWidth="1.5" />
          <circle cx="150" cy="-20" r="100" stroke="white" strokeWidth="1" />
          <path d="M200 160 Q250 100 300 140" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="220" cy="170" r="6" fill="white" />
          <circle cx="270" cy="50" r="4" fill="white" />
          <circle cx="190" cy="30" r="3" fill="white" />
        </svg>
        {/* Floating dots */}
        <svg className="absolute left-4 bottom-4 opacity-20 animate-float-slow" width="60" height="60" viewBox="0 0 60 60">
          {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => (
            <circle key={`${r}-${c}`} cx={c*14+7} cy={r*14+7} r="2" fill="white" />
          )))}
        </svg>

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {greeting.text} {greeting.emoji}
              </h1>
              <p className="text-indigo-200 mt-1 text-sm">{greeting.sub}</p>
            </div>
            {allApps.length > 0 && (
              <div className="hidden sm:block text-right">
                <p className="text-4xl font-bold text-white">{allApps.length}</p>
                <p className="text-indigo-200 text-xs mt-0.5">application{allApps.length !== 1 ? "s" : ""} tracked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      {allApps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {STAT_STATUSES.map(({ label, key, color, bg, darkColor, darkBg, icon }) => {
            const count = key === "Active" ? activeCount : countFor(key as Status);
            return (
              <div key={key} className={`${bg} ${darkBg} rounded-xl p-4 border border-transparent`}>
                <div className={`${color} ${darkColor} mb-2 opacity-70`}>{icon}</div>
                <p className={`text-2xl font-bold ${color} ${darkColor}`}>{count}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Overdue follow-ups banner */}
      {overdueApps.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-amber-800">
              {overdueApps.length} follow-up{overdueApps.length > 1 ? "s" : ""} overdue
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {overdueApps.map((a) => (
              <a key={a.id} href={`/applications/${a.id}`}
                className="flex items-center justify-between text-sm text-amber-700 hover:text-amber-900 hover:underline">
                <span>{a.company} — {a.role}</span>
                <span className="text-xs text-amber-500 tabular-nums">{a.followup_date}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {allApps.length > 0 && (
        <div className="relative mb-4">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-900 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {(["All", ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
              filter === s
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {s !== "All" && (
              <span className={`w-1.5 h-1.5 rounded-full ${filter === s ? "bg-white/70" : STATUS_DOT[s as Status]}`} />
            )}
            {s}
            {s !== "All" && (
              <span className={`text-xs rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${filter === s ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                {countFor(s as Status)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 && allApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {/* Illustrated empty state SVG */}
          <div className="relative mb-6">
            <svg width="220" height="160" viewBox="0 0 220 160" fill="none" className="opacity-90 dark:opacity-70">
              {/* Ground shadow */}
              <ellipse cx="110" cy="148" rx="70" ry="8" fill="#e0e7ff" className="dark:opacity-20" />
              {/* Briefcase body */}
              <rect x="55" y="68" width="110" height="72" rx="10" fill="#6366f1" />
              <rect x="55" y="68" width="110" height="72" rx="10" fill="url(#briefcaseGrad)" />
              {/* Briefcase handle */}
              <path d="M85 68 Q85 52 110 52 Q135 52 135 68" stroke="#818cf8" strokeWidth="5" fill="none" strokeLinecap="round" />
              {/* Briefcase latch */}
              <rect x="97" y="98" width="26" height="14" rx="4" fill="#4f46e5" />
              <rect x="103" y="103" width="14" height="4" rx="2" fill="#818cf8" />
              {/* Center divider line */}
              <line x1="55" y1="102" x2="165" y2="102" stroke="#4f46e5" strokeWidth="2" />
              {/* Floating document 1 */}
              <g className="animate-float-slow" style={{ transformOrigin: "170px 45px" }}>
                <rect x="150" y="20" width="40" height="50" rx="5" fill="white" stroke="#c7d2fe" strokeWidth="1.5" />
                <line x1="158" y1="32" x2="182" y2="32" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="158" y1="39" x2="182" y2="39" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="158" y1="46" x2="175" y2="46" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="158" y1="53" x2="178" y2="53" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
              </g>
              {/* Floating document 2 */}
              <g className="animate-float" style={{ transformOrigin: "32px 55px" }}>
                <rect x="12" y="30" width="40" height="50" rx="5" fill="white" stroke="#c7d2fe" strokeWidth="1.5" />
                <line x1="20" y1="42" x2="44" y2="42" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="49" x2="44" y2="49" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="56" x2="37" y2="56" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="40" cy="34" r="5" fill="#818cf8" />
                <path d="M37.5 34 L39.5 36 L42.5 31.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>
              {/* Star sparkles */}
              <circle cx="195" cy="90" r="3" fill="#a5b4fc" opacity="0.8" />
              <circle cx="20" cy="110" r="2.5" fill="#818cf8" opacity="0.6" />
              <circle cx="185" cy="130" r="2" fill="#6366f1" opacity="0.5" />
              <path d="M200 60 L202 55 L204 60 L209 62 L204 64 L202 69 L200 64 L195 62 Z" fill="#e0e7ff" opacity="0.9" />
              <path d="M10 75 L11.5 71 L13 75 L17 76.5 L13 78 L11.5 82 L10 78 L6 76.5 Z" fill="#c7d2fe" opacity="0.8" />
              <defs>
                <linearGradient id="briefcaseGrad" x1="55" y1="68" x2="165" y2="140" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1.5">No applications yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs">Start tracking your job search by adding your first application. It only takes a few seconds.</p>
          <a href="/applications/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-950">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add first application
          </a>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {q ? `No results for "${search}".` : <>No <span className="font-medium">{filter}</span> applications.</>}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((app) => (
            <ApplicationCard key={app.id} app={app} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
