"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Application, ALL_STATUSES, Status, Interview, isOverdue } from "@/lib/types";
import { getApp, updateApp, deleteApp, getInterviews } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplicationForm } from "@/components/ApplicationForm";
import { InterviewTimeline } from "@/components/InterviewTimeline";

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const found = getApp(id);
    if (!found) { router.replace("/"); return; }
    setApp(found);
    setInterviews(getInterviews(id));
  }, [id, router]);

  function handleUpdate(data: Partial<Application>) {
    const updated = updateApp(id, data);
    setApp(updated);
    setEditing(false);
  }

  function handleStatusChange(status: Status) {
    const updated = updateApp(id, { status });
    setApp(updated);
  }

  function handleDelete() {
    if (!confirm("Delete this application?")) return;
    deleteApp(id);
    router.push("/");
  }

  if (!app) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = app.company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="max-w-2xl">
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </a>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold shrink-0 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">{app.company}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 truncate">{app.role}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={app.status} />
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Applied {new Date(app.applied_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {app.followup_date && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isOverdue(app.followup_date) ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Follow up {app.followup_date}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 self-start">
            <button onClick={() => setEditing(!editing)}
              className="px-3.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
              {editing ? "Cancel" : "Edit"}
            </button>
            <button onClick={handleDelete}
              className="px-3.5 py-1.5 text-sm border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">Edit application</h2>
          <ApplicationForm initial={app} onSubmit={handleUpdate} submitLabel="Update application" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Update status</p>
            <div className="flex gap-2 flex-wrap">
              {ALL_STATUSES.map((s) => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${s === app.status ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <InterviewTimeline applicationId={app.id} initial={interviews} />

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Details</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {app.platform && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Platform</dt>
                  <dd className="text-sm font-medium text-slate-700 dark:text-slate-200">{app.platform}</dd>
                </div>
              )}
              {app.followup_date && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Follow-up date</dt>
                  <dd className={`text-sm font-medium ${isOverdue(app.followup_date) ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                    {new Date(app.followup_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {isOverdue(app.followup_date) && <span className="ml-2 text-xs">(overdue)</span>}
                  </dd>
                </div>
              )}
              {app.job_url && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Job posting</dt>
                  <dd>
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View job posting
                    </a>
                  </dd>
                </div>
              )}
              {app.cv_url && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">CV</dt>
                  <dd>
                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Open CV
                    </a>
                  </dd>
                </div>
              )}
              {app.cl_url && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Cover letter</dt>
                  <dd>
                    <a href={app.cl_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Open cover letter
                    </a>
                  </dd>
                </div>
              )}
              {app.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Notes</dt>
                  <dd className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{app.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
