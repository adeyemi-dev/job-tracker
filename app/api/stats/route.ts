import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const apps = (await sql`SELECT status, platform, applied_date FROM applications`) as {
    status: string;
    platform: string | null;
    applied_date: string;
  }[];

  const total = apps.length;
  const now = new Date();
  const thisWeekStart = getMondayOf(now);
  const lastWeekStart = getMondayOf(new Date(now.getTime() - 7 * 86400000));

  const thisWeek = apps.filter((a) => a.applied_date >= thisWeekStart).length;
  const lastWeek = apps.filter(
    (a) => a.applied_date >= lastWeekStart && a.applied_date < thisWeekStart
  ).length;

  const byStatus: Record<string, number> = {};
  for (const a of apps) byStatus[a.status] = (byStatus[a.status] || 0) + 1;

  const byPlatform: Record<string, number> = {};
  for (const a of apps) {
    const p = a.platform || "Not specified";
    byPlatform[p] = (byPlatform[p] || 0) + 1;
  }

  const responded = apps.filter((a) =>
    ["Interview", "Offer", "Rejected", "Ghosted"].includes(a.status)
  ).length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  const offers = apps.filter((a) => a.status === "Offer").length;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  // Last 8 weeks
  const weeklyTrend: { week: string; label: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekDate = new Date(now.getTime() - i * 7 * 86400000);
    const weekStart = getMondayOf(weekDate);
    const nextWeekStart = getMondayOf(new Date(weekDate.getTime() + 7 * 86400000));
    const count = apps.filter(
      (a) => a.applied_date >= weekStart && a.applied_date < nextWeekStart
    ).length;
    const label = new Date(weekStart).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    weeklyTrend.push({ week: weekStart, label, count });
  }

  return NextResponse.json({
    total,
    thisWeek,
    lastWeek,
    byStatus,
    byPlatform,
    responseRate,
    offerRate,
    weeklyTrend,
    thisWeekStart,
  });
}
