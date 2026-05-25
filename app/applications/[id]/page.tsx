"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Application, ALL_STATUSES, Status, Interview, isOverdue } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplicationForm } from "@/components/ApplicationForm";
import { InterviewTimeline } from "@/components/InterviewTimeline";

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [editing, setEditing] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/applications/${id}`).then((r) => r.json()),
      fetch(`/api/applications/${id}/interviews`).then((r) => r.json()),
    ]).then(([appData, ivData]) => {
      setApp(appData);
      setInterviews(ivData);
    });
  }, [id]);

  async function handleUpdate(data: Partial<Application>) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update");
    const updated: Application = await res.json();
    setApp(updated);
    setEditing(false);
  }

  async function handleStatusChange(status: Status) {
    setStatusUpdating(true);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated: Application = await res.json();
    setApp(updated);
    setStatusUpdating(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (!app) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  );

  const initials = app.company.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </a>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm dark:shadow-slate-950 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold shrink-0 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300`}>
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
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOverdue(app.followup_date)
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-slate-950">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-5">Edit application</h2>
          <ApplicationForm initial={app} applicationId={app.id} onSubmit={handleUpdate} submitLabel="Update application" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status pipeline */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-slate-950">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Update status</p>
            <div className="flex gap-2 flex-wrap">
              {ALL_STATUSES.map((s) => (
                <button key={s} disabled={statusUpdating || s === app.status} onClick={() => handleStatusChange(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition-all disabled:cursor-default ${
                    s === app.status
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Interview timeline */}
          <InterviewTimeline applicationId={app.id} initial={interviews} />

          {/* Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-slate-950">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Details</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {app.followup_date && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Follow-up date</dt>
                  <dd className={`text-sm font-medium ${isOverdue(app.followup_date) ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                    {new Date(app.followup_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    {isOverdue(app.followup_date) && <span className="ml-2 text-xs">(overdue)</span>}
                  </dd>
                </div>
              )}
              {app.platform && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Platform</dt>
                  <dd className="text-sm font-medium text-slate-700 dark:text-slate-200">{app.platform}</dd>
                </div>
              )}
              {app.job_url && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Job posting</dt>
                  <dd>
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View job posting
                    </a>
                  </dd>
                </div>
              )}
              {(app.cv_file || app.cv_url) && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">CV</dt>
                  <dd>
                    <a href={app.cv_file ? `/api/files/${app.cv_file}` : app.cv_url!}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {app.cv_file ? app.cv_file.split("/").pop() : "Open CV link"}
                    </a>
                  </dd>
                </div>
              )}
              {(app.cl_file || app.cl_url) && (
                <div>
                  <dt className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Cover letter</dt>
                  <dd>
                    <a href={app.cl_file ? `/api/files/${app.cl_file}` : app.cl_url!}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {app.cl_file ? app.cl_file.split("/").pop() : "Open cover letter link"}
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
