"use client";

import { useEffect, useState } from "react";
import { LoadingBar } from "@/components/Skeleton";
import { ALL_STATUSES, STATUS_COLORS, STATUS_DOT, Status, CURRENCY_SYMBOL, Currency } from "@/lib/types";
import { getApps, getInterviews } from "@/lib/store";

interface StatsData {
  total: number;
  thisWeek: number;
  lastWeek: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  platformResponseRate: { platform: string; total: number; responded: number; rate: number }[];
  responseRate: number;
  offerRate: number;
  avgDaysToHear: number | null;
  funnel: { stage: string; count: number; color: string }[];
  weeklyTrend: { week: string; label: string; count: number }[];
  thisWeekStart: string;
  salaryByStatus: { status: Status; avgMin: number | null; avgMax: number | null; count: number }[];
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
              <rect x={x} y={H - barH} width={32} height={barH} rx="4"
                fill={isCurrent ? "#6366f1" : "#e0e7ff"}
                className={isCurrent ? "" : "dark:fill-indigo-900/60"} />
              {w.count > 0 && (
                <text x={x + 16} y={H - barH - 5} textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400" style={{ fontSize: 9 }}>{w.count}</text>
              )}
              <text x={x + 16} y={H + 16} textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 8 }}>{w.label}</text>
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

async function computeStats(): Promise<StatsData> {
  const apps = await getApps();
  const now = new Date();
  const thisWeekStart = getMondayOf(now);
  const lastWeekStart = getMondayOf(new Date(now.getTime() - 7 * 86400000));

  const total = apps.length;
  const thisWeek = apps.filter((a) => a.applied_date >= thisWeekStart).length;
  const lastWeek = apps.filter((a) => a.applied_date >= lastWeekStart && a.applied_date < thisWeekStart).length;

  const byStatus: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const platformResponded: Record<string, number> = {};

  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    const p = a.platform || "Not specified";
    byPlatform[p] = (byPlatform[p] || 0) + 1;
    if (["Phone Screen", "Interview", "Offer"].includes(a.status)) {
      platformResponded[p] = (platformResponded[p] || 0) + 1;
    }
  }

  const platformResponseRate = Object.entries(byPlatform)
    .map(([platform, total]) => ({
      platform,
      total,
      responded: platformResponded[platform] || 0,
      rate: Math.round(((platformResponded[platform] || 0) / total) * 100),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const responded = apps.filter((a) => ["Phone Screen", "Interview", "Offer", "Rejected", "Ghosted"].includes(a.status)).length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((apps.filter((a) => a.status === "Offer").length / total) * 100) : 0;

  // Avg days to hear back: use status_history if available, else first interview date
  const daysToHearList: number[] = [];
  for (const a of apps) {
    if (a.status_history?.length > 1) {
      // First transition away from initial status
      const first = a.status_history[1];
      const applied = new Date(a.applied_date);
      const heard = new Date(first.changed_at);
      const days = Math.round((heard.getTime() - applied.getTime()) / 86400000);
      if (days >= 0 && days <= 365) daysToHearList.push(days);
    } else {
      // Fall back to first interview if available
      const ivs = await getInterviews(a.id);
      if (ivs.length > 0) {
        const days = Math.round((new Date(ivs[0].date).getTime() - new Date(a.applied_date).getTime()) / 86400000);
        if (days >= 0 && days <= 365) daysToHearList.push(days);
      }
    }
  }
  const avgDaysToHear = daysToHearList.length > 0
    ? Math.round(daysToHearList.reduce((s, n) => s + n, 0) / daysToHearList.length)
    : null;

  // Funnel: cumulative pipeline stages (apps that reached AT LEAST this stage)
  const FUNNEL_STAGES: { stage: string; statuses: Status[]; color: string }[] = [
    { stage: "Applied",      statuses: ["Applied", "Phone Screen", "Interview", "Offer", "Rejected", "Ghosted", "Withdrawn"], color: "#6366f1" },
    { stage: "Phone Screen", statuses: ["Phone Screen", "Interview", "Offer"], color: "#a78bfa" },
    { stage: "Interview",    statuses: ["Interview", "Offer"], color: "#f59e0b" },
    { stage: "Offer",        statuses: ["Offer"], color: "#10b981" },
  ];

  // Use status_history to check if app ever reached each stage (more accurate)
  const funnel = FUNNEL_STAGES.map(({ stage, statuses, color }) => {
    const count = apps.filter((a) => {
      const history: { status: Status }[] = a.status_history ?? [{ status: a.status }];
      return history.some((h) => (statuses as string[]).includes(h.status));
    }).length;
    return { stage, count, color };
  });

  const weeklyTrend: StatsData["weeklyTrend"] = [];
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 86400000);
    const weekStart = getMondayOf(weekDate);
    const nextWeekStart = getMondayOf(new Date(weekDate.getTime() + 7 * 86400000));
    const count = apps.filter((a) => a.applied_date >= weekStart && a.applied_date < nextWeekStart).length;
    const label = new Date(weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    weeklyTrend.push({ week: weekStart, label, count });
  }

  // Salary by status
  const salaryBuckets: Record<string, { mins: number[]; maxes: number[] }> = {};
  for (const a of apps) {
    if (a.salary_min || a.salary_max) {
      if (!salaryBuckets[a.status]) salaryBuckets[a.status] = { mins: [], maxes: [] };
      if (a.salary_min) salaryBuckets[a.status].mins.push(a.salary_min);
      if (a.salary_max) salaryBuckets[a.status].maxes.push(a.salary_max);
    }
  }
  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : null;
  const salaryByStatus = ALL_STATUSES
    .filter((s) => salaryBuckets[s])
    .map((s) => ({
      status: s,
      avgMin: avg(salaryBuckets[s].mins),
      avgMax: avg(salaryBuckets[s].maxes),
      count: Math.max(salaryBuckets[s].mins.length, salaryBuckets[s].maxes.length),
    }));

  return { total, thisWeek, lastWeek, byStatus, byPlatform, platformResponseRate, responseRate, offerRate, avgDaysToHear, funnel, weeklyTrend, thisWeekStart, salaryByStatus };
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => { computeStats().then(setData); }, []);

  if (!data) return (
    <>
      <LoadingBar />
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading stats…</p>
      </div>
    </>
  );

  if (data.total === 0) return (
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
  const funnelMax = data.funnel[0]?.count || 1;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Your progress</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A snapshot of your job search activity</p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Total applied</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.total}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">all time</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">This week</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.thisWeek}</p>
          <p className={`text-xs mt-1 flex items-center gap-1 ${weekDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : weekDelta < 0 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-slate-500"}`}>
            {weekDelta > 0 && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>}
            {weekDelta < 0 && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>}
            {weekDelta === 0 ? "same as last week" : `${Math.abs(weekDelta)} vs last week`}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Response rate</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.responseRate}<span className="text-lg font-semibold text-slate-400 dark:text-slate-500">%</span></p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">phone screen or beyond</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          {data.avgDaysToHear !== null ? (
            <>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Avg. days to hear back</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{data.avgDaysToHear}<span className="text-lg font-semibold text-indigo-300 dark:text-indigo-700">d</span></p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">from apply to response</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Offer rate</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.offerRate}<span className="text-lg font-semibold text-emerald-400/70">%</span></p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">converted to offer</p>
            </>
          )}
        </div>
      </div>

      {/* Funnel + Weekly charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Hiring funnel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hiring funnel</p>
            <span className="text-xs text-slate-400 dark:text-slate-500">conversion rates</span>
          </div>
          <div className="space-y-3">
            {data.funnel.map(({ stage, count, color }, i) => {
              const pct = funnelMax > 0 ? Math.round((count / funnelMax) * 100) : 0;
              const convPct = i > 0 && data.funnel[i - 1].count > 0
                ? Math.round((count / data.funnel[i - 1].count) * 100)
                : null;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{stage}</span>
                      {convPct !== null && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">({convPct}% of prev)</span>
                      )}
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>{count}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {data.funnel[0].count > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              Overall offer rate: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round((data.funnel[3].count / data.funnel[0].count) * 100)}%
              </span> of applications reach offer
            </p>
          )}
        </div>

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
      </div>

      {/* Salary by status */}
      {data.salaryByStatus.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm mb-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Salary by status</p>
          <div className="space-y-3">
            {data.salaryByStatus.map(({ status, avgMin, avgMax }) => {
              const sym = "£";
              const fmt = (n: number) => sym + n.toLocaleString();
              const label = avgMin && avgMax ? `${fmt(avgMin)} – ${fmt(avgMax)}` : avgMax ? `Up to ${fmt(avgMax)}` : avgMin ? `From ${fmt(avgMin)}` : null;
              const maxVal = avgMax ?? avgMin ?? 0;
              const globalMax = Math.max(...data.salaryByStatus.map((s) => s.avgMax ?? s.avgMin ?? 0), 1);
              const pct = Math.round((maxVal / globalMax) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{status}</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{label}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 dark:bg-emerald-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            Average salary range for applications with salary data, grouped by status
          </p>
        </div>
      )}

      {/* Status breakdown + Platform response rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: s === "Applied" ? "#38bdf8" : s === "Phone Screen" ? "#a78bfa" : s === "Interview" ? "#fbbf24" : s === "Offer" ? "#34d399" : s === "Rejected" ? "#f87171" : s === "Ghosted" ? "#a1a1aa" : "#9ca3af" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform response rates */}
        {data.platformResponseRate.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Platform response rate</p>
              <span className="text-xs text-slate-400 dark:text-slate-500">phone screen+</span>
            </div>
            <div className="space-y-3">
              {data.platformResponseRate.map(({ platform, total, responded, rate }) => (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{platform}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{responded}/{total}</span>
                      <span className={`text-xs font-bold tabular-nums w-10 text-right ${rate >= 20 ? "text-emerald-600 dark:text-emerald-400" : rate >= 10 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${rate >= 20 ? "bg-emerald-500" : rate >= 10 ? "bg-amber-500" : "bg-slate-400"}`}
                      style={{ width: `${rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              Green ≥ 20% · Amber ≥ 10% · Grey &lt; 10%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
