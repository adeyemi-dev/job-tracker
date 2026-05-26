"use client";

import Link from "next/link";
import { Application, avatarColor, isOverdue } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  app: Application;
  onDelete: (id: string) => void;
}

export function ApplicationCard({ app, onDelete }: Props) {
  const initials = app.company
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const overdue = isOverdue(app.followup_date) && !["Rejected", "Withdrawn", "Ghosted"].includes(app.status);

  return (
    <div className={`group bg-white dark:bg-slate-900 rounded-xl border p-4 sm:p-5 hover:shadow-md dark:hover:shadow-slate-900 transition-all duration-200 ${
      overdue
        ? "border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10"
        : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
    }`}>
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Avatar */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(app.company)}`}>
          {initials}
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] leading-snug">{app.company}</h3>
            <StatusBadge status={app.status} />
            {app.platform && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                {app.platform}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{app.role}</p>
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
          {/* Action buttons — always visible on mobile, hover-reveal on desktop */}
          <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Link href={`/applications/${app.id}`}
              className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors">
              View
            </Link>
            <Link href={`/applications/${app.id}?edit=1`}
              className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium transition-colors">
              Edit
            </Link>
            <button onClick={() => onDelete(app.id)}
              className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition-colors">
              Delete
            </button>
          </div>
          <Link href={`/applications/${app.id}`}
            className="hidden sm:block text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Links row */}
      {(app.job_url || app.cv_file || app.cv_url || app.cl_file || app.cl_url || app.notes) && (
        <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Job posting
            </a>
          )}
          {(app.cv_file || app.cv_url) && (
            <a href={app.cv_file ? `/api/files/${app.cv_file}` : app.cv_url!} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CV
            </a>
          )}
          {(app.cl_file || app.cl_url) && (
            <a href={app.cl_file ? `/api/files/${app.cl_file}` : app.cl_url!} target="_blank" rel="noopener noreferrer"
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
