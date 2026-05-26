"use client";

import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Application } from "@/lib/types";
import { createApp } from "@/lib/store";

export default function NewApplication() {
  const router = useRouter();

  function handleSubmit(data: Partial<Application>) {
    const created = createApp(data);
    router.push(`/applications/${created.id}`);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </a>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">New application</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track a new job you&apos;ve applied to.</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-slate-950">
        <ApplicationForm onSubmit={handleSubmit} submitLabel="Save application" />
      </div>
    </div>
  );
}
