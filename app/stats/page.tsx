"use client";

import { useEffect, useState } from "react";
import { ALL_STATUSES, STATUS_COLORS, STATUS_DOT, Status } from "@/lib/types";
import { getApps } from "@/lib/store";

interface StatsData {
  total: number;
  thisWeek: number;
  lastWeek: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  responseRate: number;
  offerRate: number;
  weeklyTrend: { week: string; label: string; count: number }[];
  thisWeekStart: string;
}

function WeeklyChart({ trend, thisWeekStart }: { trend: StatsData["weeklyTrend"]; thisWeekStart: string }) {
  const max = Math.max(...trend.map((w) => w.count), 1);
  const H = 80;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${trend.length * 40} ${H + 24}`} className="w-full overflow-visible" style={{ height: 120 }}>
        {trend.map((w, i) => {
          const barH = Math.max((w.count / max) * H, w.count > 0 ? 4 : 0);
          const x = i * 40 + 4;
          const isCurrent = w.week === thisWeekStart;
          return (
            <g key={w.week}>
              <rect
                x={x} y={H - barH} width={32} height={barH}
                rx="4"
                fill={isCurrent ? "#6366f1" : "#e0e7ff"}
                className={isCurrent ? "" : "dark:fill-indigo-900/60"}
              />
              {w.count > 0 && (
                <text x={x + 16} y={H - barH - 5} textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400" style={{ fontSize: 9 }}>
                  {w.count}
                </text>
              )}
              <text x={x + 16} y={H + 16} textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 8 }}>
                {w.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().slice(0, 10);
}

function computeStats(): StatsData {
  const apps = getApps();
  const now = new Date();
  const thisWeekStart = getMondayOf(now);
  const lastWeekStart = getMondayOf(new Date(now.getTime() - 7 * 86400000));

  const total = apps.length;
  const thisWeek = apps.filter((a) => a.applied_date >= thisWeekStart).length;
  const lastWeek = apps.filter((a) => a.applied_date >= lastWeekStart && a.applied_date < thisWeekStart).length;

  const byStatus: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    const p = a.platform || "Not specified";
    byPlatform[p] = (byPlatform[p] || 0) + 1;
  }

  const responded = apps.filter((a) => ["Interview", "Offer", "Rejected", "Ghosted"].includes(a.status)).length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((apps.filter((a) => a.status === "Offer").length / total) * 100) : 0;

  const weeklyTrend: StatsData["weeklyTrend"] = [];
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 86400000);
    const weekStart = getMondayOf(weekDate);
    const nextWeekStart = getMondayOf(new Date(weekDate.getTime() + 7 * 86400000));
    const count = apps.filter((a) => a.applied_date >= weekStart && a.applied_date < nextWeekStart).length;
    const label = new Date(weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    weeklyTrend.push({ week: weekStart, label, count });
  }

  return { total, thisWeek, lastWeek, byStatus, byPlatform, responseRate, offerRate, weeklyTrend, thisWeekStart };
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => { setData(computeStats()); }, []);

  if (!data || data.total === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">No data yet</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500">Add some applications to see your stats.</p>
    </div>
  );

  const weekDelta = data.thisWeek - data.lastWeek;
  const topPlatforms = Object.entries(data.byPlatform)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxPlatform = Math.max(...topPlatforms.map(([, n]) => n), 1);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Your progress</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A snapshot of your job search activity</p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Total */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Total applied</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.total}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">all time</p>
        </div>

        {/* This week */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">This week</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.thisWeek}</p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${weekDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : weekDelta < 0 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
            {weekDelta > 0 ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
            ) : weekDelta < 0 ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            ) : null}
            {weekDelta === 0 ? "same as last week" : `${Math.abs(weekDelta)} vs last week`}
          </p>
        </div>

        {/* Response rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Response rate</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.responseRate}<span className="text-lg font-semibold text-slate-400 dark:text-slate-500">%</span></p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">got a response</p>
        </div>

        {/* Offer rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Offer rate</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.offerRate}<span className="text-lg font-semibold text-emerald-400/70">%</span></p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">converted to offer</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Weekly activity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Weekly activity</p>
            <span className="text-xs text-slate-400 dark:text-slate-500">last 8 weeks</span>
          </div>
          <WeeklyChart trend={data.weeklyTrend} thisWeekStart={data.thisWeekStart} />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> current week
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 dark:bg-indigo-900/60 inline-block ml-2" /> past weeks
            </span>
          </p>
        </div>

        {/* Status breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Status breakdown</p>
          <div className="space-y-3">
            {ALL_STATUSES.map((s: Status) => {
              const count = data.byStatus[s] || 0;
              const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
              if (count === 0) return null;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{pct}%</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s]}`}>{count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: s === "Applied" ? "#38bdf8"
                          : s === "Phone Screen" ? "#a78bfa"
                          : s === "Interview" ? "#fbbf24"
                          : s === "Offer" ? "#34d399"
                          : s === "Rejected" ? "#f87171"
                          : s === "Ghosted" ? "#a1a1aa"
                          : "#9ca3af",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform breakdown */}
      {topPlatforms.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Applications by platform</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {topPlatforms.map(([platform, count]) => {
              const pct = Math.round((count / maxPlatform) * 100);
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{platform}</span>
                    <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
