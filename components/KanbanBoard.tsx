"use client";

import { useState } from "react";
import Link from "next/link";
import { Application, ALL_STATUSES, Status, STATUS_COLORS, STATUS_DOT, avatarColor, CURRENCY_SYMBOL, Currency } from "@/lib/types";
import { updateApp } from "@/lib/store";

interface Props {
  apps: Application[];
  onAppsChange: (apps: Application[]) => void;
}

function formatSalary(app: Application): string | null {
  if (!app.salary_min && !app.salary_max) return null;
  const sym = app.currency ? (CURRENCY_SYMBOL[app.currency as Currency] ?? app.currency) : "£";
  const fmt = (n: number) => sym + n.toLocaleString();
  if (app.salary_min && app.salary_max) return `${fmt(app.salary_min)} – ${fmt(app.salary_max)}`;
  if (app.salary_min) return `From ${fmt(app.salary_min)}`;
  return `Up to ${fmt(app.salary_max!)}`;
}

export function KanbanBoard({ apps, onAppsChange }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<Status | null>(null);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, status: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverStatus(status);
  }

  async function handleDrop(e: React.DragEvent, status: Status) {
    e.preventDefault();
    if (!draggingId) return;
    const app = apps.find((a) => a.id === draggingId);
    if (!app || app.status === status) { setDraggingId(null); setOverStatus(null); return; }
    onAppsChange(apps.map((a) => a.id === draggingId ? { ...a, status } : a));
    setDraggingId(null);
    setOverStatus(null);
    await updateApp(draggingId, { status });
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverStatus(null);
  }

  const byStatus = (status: Status) => apps.filter((a) => a.status === status);

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex gap-3 min-w-max">
        {ALL_STATUSES.map((status) => {
          const col = byStatus(status);
          const isOver = overStatus === status;
          return (
            <div
              key={status}
              className={`flex flex-col w-52 shrink-0 rounded-xl border transition-colors ${
                isOver
                  ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
              onDragLeave={() => setOverStatus(null)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{status}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums ml-1">{col.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2 min-h-[120px]">
                {col.map((app) => {
                  const initials = app.company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
                  const salary = formatSalary(app);
                  const isDragging = draggingId === app.id;
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 cursor-grab active:cursor-grabbing select-none transition-all ${
                        isDragging ? "opacity-40 scale-95" : "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(app.company)}`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">{app.company}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{app.role}</p>
                        </div>
                      </div>
                      {(salary || app.work_type) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {salary && (
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{salary}</span>
                          )}
                          {app.work_type && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{app.work_type}</span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                          {new Date(app.applied_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <Link
                          href={`/applications/${app.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {col.length === 0 && (
                  <div className={`flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-600 py-4 rounded-lg border-2 border-dashed transition-colors ${
                    isOver ? "border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-slate-700"
                  }`}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
