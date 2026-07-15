"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Application, ALL_STATUSES, Status, STATUS_COLORS, STATUS_DOT, avatarColor, isOverdue, CURRENCY_SYMBOL, Currency } from "@/lib/types";

function formatSalary(app: Application): string | null {
  if (!app.salary_min && !app.salary_max) return null;
  const sym = app.currency ? (CURRENCY_SYMBOL[app.currency as Currency] ?? app.currency) : "£";
  const fmt = (n: number) => sym + n.toLocaleString();
  if (app.salary_min && app.salary_max) return `${fmt(app.salary_min)} – ${fmt(app.salary_max)}`;
  if (app.salary_min) return `From ${fmt(app.salary_min)}`;
  return `Up to ${fmt(app.salary_max!)}`;
}

interface Props {
  app: Application;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  onStarToggle: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}

export function ApplicationCard({ app, onDelete, onStatusChange, onStarToggle, selected, onSelect }: Props) {
  const router = useRouter();
  const initials = app.company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const overdue = isOverdue(app.followup_date) && !["Rejected", "Withdrawn", "Ghosted"].includes(app.status);
  const salary = formatSalary(app);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      onClick={() => router.push(`/applications/${app.id}`)}
      className={`group bg-white dark:bg-slate-900 rounded-xl border p-4 sm:p-5 hover:shadow-md dark:hover:shadow-slate-900 transition-all duration-200 cursor-pointer ${
        overdue
          ? "border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10"
          : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Checkbox (bulk select) */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={(e) => onSelect(app.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
          />
        )}
        {/* Avatar */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(app.company)}`}>
          {initials}
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); onStarToggle(app.id); }}
              title={app.starred ? "Unstar" : "Star"}
              className={`shrink-0 transition-colors ${app.starred ? "text-amber-400 hover:text-amber-300" : "text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400"}`}
            >
              <svg className="w-4 h-4" fill={app.starred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] leading-snug">{app.company}</h3>

            {/* Clickable status badge with dropdown */}
            <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpen((o) => !o)}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-80 ${STATUS_COLORS[app.status]}`}
              >
                {app.status}
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute left-0 top-full mt-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-slate-950 py-1 min-w-[150px]">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { onStatusChange(app.id, s); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/60 ${s === app.status ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"}`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                      {s}
                      {s === app.status && (
                        <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {app.platform && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                {app.platform}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{app.role}</p>
          {(salary || app.work_type || app.contract_type) && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {salary && <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{salary}</span>}
              {app.work_type && <span className="text-xs text-slate-400 dark:text-slate-500">{app.work_type}</span>}
              {app.contract_type && <span className="text-xs text-slate-400 dark:text-slate-500">{app.contract_type}</span>}
            </div>
          )}
          {app.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {app.tags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* Date — shown below role on mobile only */}
          <p className="sm:hidden text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
            {new Date(app.applied_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {overdue && <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">· Follow up overdue</span>}
          </p>
        </div>

        {/* Date + actions (desktop) */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {new Date(app.applied_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {overdue && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Follow up
              </span>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Link href={`/applications/${app.id}?edit=1`}
              className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium transition-colors">
              Edit
            </Link>
            <button onClick={() => onDelete(app.id)}
              className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition-colors">
              Delete
            </button>
          </div>
          <svg className="hidden sm:block w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Links row */}
      {(app.job_url || app.cv_file || app.cv_url || app.cl_file || app.cl_url || app.notes) && (
        <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Job posting
            </a>
          )}
          {app.cv_url && (
            <a href={app.cv_url} {...(app.cv_file ? { download: app.cv_file } : { target: "_blank", rel: "noopener noreferrer" })}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CV
            </a>
          )}
          {app.cl_url && (
            <a href={app.cl_url} {...(app.cl_file ? { download: app.cl_file } : { target: "_blank", rel: "noopener noreferrer" })}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Cover letter
            </a>
          )}
          {app.notes && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic truncate max-w-[200px] sm:max-w-xs">{app.notes}</span>
          )}
        </div>
      )}
    </div>
  );
}
